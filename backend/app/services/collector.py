import hashlib
import json
import uuid
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session

from app.models import Source, Route, Airline, RawResponse, FareObservation, CollectionEvent
from app.adapters.simulated import SimulatedSourceAdapter
from app.services.validation import validate_observation

def run_collection_cycle(
    db: Session,
    target_date: date = None,
    route_ids: list[int] = None,
    source_ids: list[int] = None,
    booking_windows: list[int] = None
) -> dict:
    """
    Executes a complete collection cycle for specified or all active routes, sources, and lead times.
    """
    if target_date is None:
        target_date = date.today()

    if booking_windows is None:
        booking_windows = [1, 7, 15, 30, 45]

    # Fetch sources
    query_sources = db.query(Source).filter(Source.status == "active")
    if source_ids:
        query_sources = query_sources.filter(Source.id.in_(source_ids))
    sources = query_sources.all()

    # Fetch routes
    query_routes = db.query(Route).filter(Route.is_active == True)
    if route_ids:
        query_routes = query_routes.filter(Route.id.in_(route_ids))
    routes = query_routes.all()

    # Fetch airlines
    airlines = db.query(Airline).filter(Airline.is_active == True).all()

    cycle_id = str(uuid.uuid4())[:8]
    total_attempted = 0
    accepted_count = 0
    quarantined_count = 0
    rejected_count = 0
    events_count = 0

    # Instantiate simulated adapters per source
    adapter_map = {}
    for src in sources:
        adapter_map[src.id] = SimulatedSourceAdapter(source_name=src.name, source_type=src.source_type)

    for route in routes:
        for lead_days in booking_windows:
            travel_date = target_date + timedelta(days=lead_days)
            for airline in airlines:
                for src in sources:
                    total_attempted += 1
                    adapter = adapter_map[src.id]

                    result = adapter.fetch_observations(
                        route_origin=route.origin_iata,
                        route_dest=route.destination_iata,
                        travel_date=travel_date,
                        booking_lead_time_days=lead_days,
                        airline_code=airline.airline_code,
                        collection_date=target_date
                    )

                    outcome = result["outcome"]
                    http_status = result["http_status"]
                    error_msg = result["error_message"]
                    duration_ms = result["duration_ms"]
                    raw_body = result.get("raw_response")
                    fare_data = result.get("fare_data")

                    # Log collection event
                    event = CollectionEvent(
                        source_id=src.id,
                        route_id=route.id,
                        attempted_at=datetime.combine(target_date, datetime.min.time()),
                        outcome=outcome,
                        http_status=http_status,
                        error_message=error_msg,
                        retry_count=0,
                        duration_ms=duration_ms
                    )
                    db.add(event)
                    events_count += 1

                    if outcome in ["blocked", "timeout", "schema_change"] or not raw_body:
                        continue

                    # Save raw response
                    response_hash = hashlib.sha256(raw_body.encode("utf-8")).hexdigest()
                    raw_resp = RawResponse(
                        source_id=src.id,
                        request_url=f"{src.base_url}/search?origin={route.origin_iata}&dest={route.destination_iata}&date={travel_date.isoformat()}&airline={airline.airline_code}",
                        response_format="json",
                        response_body=raw_body,
                        response_hash=response_hash,
                        collection_timestamp_ist=datetime.combine(target_date, datetime.min.time()),
                        request_metadata=json.dumps({"cycle_id": cycle_id, "lead_days": lead_days})
                    )
                    db.add(raw_resp)
                    db.flush()

                    if outcome == "sold_out":
                        # Record sold out observation
                        obs = FareObservation(
                            source_id=src.id,
                            route_id=route.id,
                            airline_id=airline.id,
                            collection_timestamp_ist=datetime.combine(target_date, datetime.min.time()),
                            travel_date=travel_date,
                            booking_lead_time_days=lead_days,
                            trip_type="one_way",
                            stops=0,
                            cabin="economy",
                            fare_family="standard",
                            base_fare_inr=0.0,
                            taxes_fees_inr=0.0,
                            convenience_fee_inr=0.0,
                            optional_ancillaries_inr=0.0,
                            total_payable_inr=0.0,
                            currency="INR",
                            availability_status="sold_out",
                            parser_version="v1.0",
                            raw_response_id=raw_resp.id,
                            quality_status="accepted",
                            quality_flags=json.dumps(["SOLD_OUT"]),
                            created_at=datetime.utcnow()
                        )
                        db.add(obs)
                        accepted_count += 1
                        continue

                    # Check for existing duplicate observation in this collection batch
                    existing_dup = db.query(FareObservation).filter(
                        FareObservation.source_id == src.id,
                        FareObservation.route_id == route.id,
                        FareObservation.airline_id == airline.id,
                        FareObservation.travel_date == travel_date,
                        FareObservation.booking_lead_time_days == lead_days,
                        FareObservation.collection_timestamp_ist == datetime.combine(target_date, datetime.min.time())
                    ).first()

                    is_dup = (existing_dup is not None)

                    # Validate observation
                    quality_status, quality_flags = validate_observation(
                        fare_data=fare_data,
                        origin_iata=route.origin_iata,
                        dest_iata=route.destination_iata,
                        travel_date=travel_date,
                        booking_lead_time_days=lead_days,
                        collection_date=target_date,
                        is_duplicate=is_dup
                    )

                    if quality_status == "accepted":
                        accepted_count += 1
                    elif quality_status == "quarantined":
                        quarantined_count += 1
                    else:
                        rejected_count += 1

                    obs = FareObservation(
                        source_id=src.id,
                        route_id=route.id,
                        airline_id=airline.id,
                        collection_timestamp_ist=datetime.combine(target_date, datetime.min.time()),
                        travel_date=travel_date,
                        booking_lead_time_days=lead_days,
                        trip_type="one_way",
                        stops=0,
                        cabin="economy",
                        fare_family="standard",
                        base_fare_inr=fare_data["base_fare_inr"],
                        taxes_fees_inr=fare_data["taxes_fees_inr"],
                        convenience_fee_inr=fare_data["convenience_fee_inr"],
                        optional_ancillaries_inr=fare_data.get("optional_ancillaries_inr", 0.0),
                        total_payable_inr=fare_data["total_payable_inr"],
                        currency=fare_data.get("currency", "INR"),
                        availability_status=fare_data.get("availability_status", "available"),
                        parser_version=fare_data.get("parser_version", "v1.0"),
                        raw_response_id=raw_resp.id,
                        quality_status=quality_status,
                        quality_flags=json.dumps(quality_flags),
                        created_at=datetime.utcnow()
                    )
                    db.add(obs)

    db.commit()

    return {
        "status": "success",
        "message": f"Collection cycle executed successfully for target date {target_date.isoformat()}",
        "collection_cycle_id": cycle_id,
        "total_attempted": total_attempted,
        "accepted_count": accepted_count,
        "quarantined_count": quarantined_count,
        "rejected_count": rejected_count,
        "events_count": events_count
    }
