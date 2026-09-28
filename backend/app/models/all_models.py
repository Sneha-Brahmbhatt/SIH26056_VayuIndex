from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Date, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class Source(Base):
    __tablename__ = "sources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    source_type = Column(String(50), nullable=False) # airline | ota | simulated
    base_url = Column(String(255), nullable=False)
    status = Column(String(50), default="active") # active | blocked | paused | schema_changed
    robots_policy = Column(Text, nullable=True)
    tos_policy = Column(Text, nullable=True)
    rate_limit_per_minute = Column(Integer, default=60)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    observations = relationship("FareObservation", back_populates="source")
    raw_responses = relationship("RawResponse", back_populates="source")
    collection_events = relationship("CollectionEvent", back_populates="source")


class Route(Base):
    __tablename__ = "routes"

    id = Column(Integer, primary_key=True, index=True)
    origin_iata = Column(String(3), nullable=False, index=True)
    destination_iata = Column(String(3), nullable=False, index=True)
    origin_city = Column(String(100), nullable=False)
    destination_city = Column(String(100), nullable=False)
    route_type = Column(String(50), default="trunk") # trunk | metro | regional
    distance_km = Column(Integer, default=1000)
    is_active = Column(Boolean, default=True)

    observations = relationship("FareObservation", back_populates="route")
    collection_events = relationship("CollectionEvent", back_populates="route")
    weights = relationship("Weight", back_populates="route")
    index_values = relationship("IndexValue", back_populates="route")


class Airline(Base):
    __tablename__ = "airlines"

    id = Column(Integer, primary_key=True, index=True)
    airline_code = Column(String(3), nullable=False, unique=True, index=True)
    airline_name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)

    observations = relationship("FareObservation", back_populates="airline")
    weights = relationship("Weight", back_populates="airline")
    index_values = relationship("IndexValue", back_populates="airline")


class RawResponse(Base):
    __tablename__ = "raw_responses"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=False)
    request_url = Column(String(500), nullable=False)
    response_format = Column(String(20), default="json") # json | html
    response_body = Column(Text, nullable=False)
    response_hash = Column(String(64), nullable=False, index=True)
    collection_timestamp_ist = Column(DateTime, nullable=False, default=datetime.utcnow)
    request_metadata = Column(Text, nullable=True) # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

    source = relationship("Source", back_populates="raw_responses")
    observations = relationship("FareObservation", back_populates="raw_response")


class FareObservation(Base):
    __tablename__ = "fare_observations"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=False)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=False)
    airline_id = Column(Integer, ForeignKey("airlines.id"), nullable=False)
    collection_timestamp_ist = Column(DateTime, nullable=False, default=datetime.utcnow)
    travel_date = Column(Date, nullable=False, index=True)
    booking_lead_time_days = Column(Integer, nullable=False, index=True)
    trip_type = Column(String(20), default="one_way")
    stops = Column(Integer, default=0)
    cabin = Column(String(30), default="economy")
    fare_family = Column(String(50), default="standard")
    base_fare_inr = Column(Float, nullable=False)
    taxes_fees_inr = Column(Float, nullable=False)
    convenience_fee_inr = Column(Float, default=0.0)
    optional_ancillaries_inr = Column(Float, default=0.0)
    total_payable_inr = Column(Float, nullable=False)
    currency = Column(String(3), default="INR")
    availability_status = Column(String(30), default="available") # available | sold_out
    parser_version = Column(String(20), default="v1.0")
    raw_response_id = Column(Integer, ForeignKey("raw_responses.id"), nullable=True)
    quality_status = Column(String(30), default="accepted", index=True) # accepted | quarantined | rejected
    quality_flags = Column(Text, default="[]") # JSON string
    created_at = Column(DateTime, default=datetime.utcnow)

    source = relationship("Source", back_populates="observations")
    route = relationship("Route", back_populates="observations")
    airline = relationship("Airline", back_populates="observations")
    raw_response = relationship("RawResponse", back_populates="observations")


class CollectionEvent(Base):
    __tablename__ = "collection_events"

    id = Column(Integer, primary_key=True, index=True)
    source_id = Column(Integer, ForeignKey("sources.id"), nullable=False)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=True)
    attempted_at = Column(DateTime, default=datetime.utcnow)
    outcome = Column(String(50), nullable=False) # success | blocked | timeout | schema_change | sold_out | invalid
    http_status = Column(Integer, nullable=True)
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    duration_ms = Column(Integer, default=0)

    source = relationship("Source", back_populates="collection_events")
    route = relationship("Route", back_populates="collection_events")


class IndexValue(Base):
    __tablename__ = "index_values"

    id = Column(Integer, primary_key=True, index=True)
    index_date = Column(Date, nullable=False, index=True)
    granularity = Column(String(20), default="daily") # daily | weekly | monthly
    scope = Column(String(30), default="national") # national | route | airline | booking_window
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=True)
    airline_id = Column(Integer, ForeignKey("airlines.id"), nullable=True)
    booking_lead_time_days = Column(Integer, nullable=True)
    index_value = Column(Float, nullable=False)
    previous_index_value = Column(Float, nullable=True)
    change_value = Column(Float, nullable=True)
    change_percent = Column(Float, nullable=True)
    base_period = Column(String(50), nullable=False)
    methodology_version = Column(String(50), nullable=False)
    weight_version = Column(String(50), nullable=False)
    coverage_weight_pct = Column(Float, default=100.0)
    confidence = Column(String(20), default="high") # high | medium | low
    created_at = Column(DateTime, default=datetime.utcnow)
    revised_at = Column(DateTime, nullable=True)
    revision_reason = Column(Text, nullable=True)

    route = relationship("Route", back_populates="index_values")
    airline = relationship("Airline", back_populates="index_values")


class Weight(Base):
    __tablename__ = "weights"

    id = Column(Integer, primary_key=True, index=True)
    weight_version = Column(String(50), nullable=False, index=True)
    effective_from = Column(Date, nullable=False)
    route_id = Column(Integer, ForeignKey("routes.id"), nullable=True)
    airline_id = Column(Integer, ForeignKey("airlines.id"), nullable=True)
    booking_lead_time_days = Column(Integer, nullable=True)
    weight_value = Column(Float, nullable=False)
    weight_basis = Column(String(100), default="passenger_traffic_share")
    notes = Column(Text, nullable=True)

    route = relationship("Route", back_populates="weights")
    airline = relationship("Airline", back_populates="weights")


class DGCABenchmark(Base):
    __tablename__ = "dgca_benchmarks"

    id = Column(Integer, primary_key=True, index=True)
    route_name = Column(String(50), nullable=False)
    year_month = Column(String(7), nullable=False) # e.g. "2026-01"
    average_fare_inr = Column(Float, nullable=False)
    source_url = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)
