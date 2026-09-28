import sys
import os
from datetime import date, timedelta
from sqlalchemy.orm import Session

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database import engine, Base, SessionLocal
from app.models import Source, Route, Airline, Weight, DGCABenchmark, FareObservation
from app.services.collector import run_collection_cycle
from app.services.indexer import calculate_daily_index

def seed_database():
    print("Initializing Database Schema...")
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    try:
        # Re-seeding Guard: Skip if database already contains sources / fare observations
        if db.query(Source).count() > 0 or db.query(FareObservation).count() > 0:
            print("Database already contains seeded data. Skipping seed process to prevent duplicate records.")
            return

        print("1. Seeding Sources...")
        sources_data = [
            {
                "name": "IndiGo Direct (Simulated)",
                "source_type": "simulated",
                "base_url": "https://www.goindigo.in",
                "status": "active",
                "robots_policy": "Simulated adapter for demonstration. Real-source compliance requires robots.txt adherence.",
                "tos_policy": "MoSPI DIID Research Terms Compliance Stub",
                "rate_limit_per_minute": 60
            },
            {
                "name": "Air India Direct (Simulated)",
                "source_type": "simulated",
                "base_url": "https://www.airindia.com",
                "status": "active",
                "robots_policy": "Simulated adapter for demonstration.",
                "tos_policy": "MoSPI DIID Research Terms Compliance Stub",
                "rate_limit_per_minute": 60
            },
            {
                "name": "Akasa Air Direct (Simulated)",
                "source_type": "simulated",
                "base_url": "https://www.akasaair.com",
                "status": "active",
                "robots_policy": "Simulated adapter for demonstration.",
                "tos_policy": "MoSPI DIID Research Terms Compliance Stub",
                "rate_limit_per_minute": 60
            },
            {
                "name": "MakeMyTrip OTA (Simulated)",
                "source_type": "simulated",
                "base_url": "https://www.makemytrip.com",
                "status": "active",
                "robots_policy": "Simulated adapter for demonstration.",
                "tos_policy": "MoSPI DIID Research Terms Compliance Stub",
                "rate_limit_per_minute": 40
            },
            {
                "name": "Cleartrip OTA (Simulated)",
                "source_type": "simulated",
                "base_url": "https://www.cleartrip.com",
                "status": "active",
                "robots_policy": "Simulated adapter for demonstration.",
                "tos_policy": "MoSPI DIID Research Terms Compliance Stub",
                "rate_limit_per_minute": 40
            }
        ]

        for s in sources_data:
            existing = db.query(Source).filter(Source.name == s["name"]).first()
            if not existing:
                db.add(Source(**s))
        db.commit()

        print("2. Seeding Routes...")
        routes_data = [
            {"origin_iata": "DEL", "destination_iata": "BOM", "origin_city": "Delhi", "destination_city": "Mumbai", "route_type": "trunk", "distance_km": 1150},
            {"origin_iata": "DEL", "destination_iata": "BLR", "origin_city": "Delhi", "destination_city": "Bengaluru", "route_type": "trunk", "distance_km": 1740},
            {"origin_iata": "BOM", "destination_iata": "BLR", "origin_city": "Mumbai", "destination_city": "Bengaluru", "route_type": "metro", "distance_km": 840},
            {"origin_iata": "DEL", "destination_iata": "CCU", "origin_city": "Delhi", "destination_city": "Kolkata", "route_type": "trunk", "distance_km": 1305},
            {"origin_iata": "BLR", "destination_iata": "HYD", "origin_city": "Bengaluru", "destination_city": "Hyderabad", "route_type": "regional", "distance_km": 500},
            {"origin_iata": "MAA", "destination_iata": "DEL", "origin_city": "Chennai", "destination_city": "Delhi", "route_type": "trunk", "distance_km": 1760},
            {"origin_iata": "DEL", "destination_iata": "HYD", "origin_city": "Delhi", "destination_city": "Hyderabad", "route_type": "metro", "distance_km": 1250},
            {"origin_iata": "BOM", "destination_iata": "CCU", "origin_city": "Mumbai", "destination_city": "Kolkata", "route_type": "metro", "distance_km": 1650},
            {"origin_iata": "BLR", "destination_iata": "MAA", "origin_city": "Bengaluru", "destination_city": "Chennai", "route_type": "regional", "distance_km": 290},
            {"origin_iata": "DEL", "destination_iata": "GOI", "origin_city": "Delhi", "destination_city": "Goa", "route_type": "regional", "distance_km": 1500},
        ]

        for r in routes_data:
            existing = db.query(Route).filter(Route.origin_iata == r["origin_iata"], Route.destination_iata == r["destination_iata"]).first()
            if not existing:
                db.add(Route(**r))
        db.commit()

        print("3. Seeding Airlines...")
        airlines_data = [
            {"airline_code": "6E", "airline_name": "IndiGo"},
            {"airline_code": "AI", "airline_name": "Air India"},
            {"airline_code": "IX", "airline_name": "Air India Express"},
            {"airline_code": "QP", "airline_name": "Akasa Air"},
            {"airline_code": "SG", "airline_name": "SpiceJet"},
        ]

        for a in airlines_data:
            existing = db.query(Airline).filter(Airline.airline_code == a["airline_code"]).first()
            if not existing:
                db.add(Airline(**a))
        db.commit()

        print("4. Seeding Weights...")
        routes = db.query(Route).all()
        airlines = db.query(Airline).all()

        # Weight distribution matrix
        route_weights = {"DEL-BOM": 0.20, "DEL-BLR": 0.16, "BOM-BLR": 0.12, "DEL-CCU": 0.10, "BLR-HYD": 0.08, "MAA-DEL": 0.08, "DEL-HYD": 0.08, "BOM-CCU": 0.07, "BLR-MAA": 0.06, "DEL-GOI": 0.05}
        airline_weights = {"6E": 0.60, "AI": 0.22, "IX": 0.08, "QP": 0.06, "SG": 0.04}
        lead_weights = {1: 0.10, 7: 0.25, 15: 0.35, 30: 0.20, 45: 0.10}

        db.query(Weight).delete() # refresh weights
        for r in routes:
            r_code = f"{r.origin_iata}-{r.destination_iata}"
            r_w = route_weights.get(r_code, 0.10)
            for a in airlines:
                a_w = airline_weights.get(a.airline_code, 0.20)
                for lead, l_w in lead_weights.items():
                    cell_weight = round(r_w * a_w * l_w * 100.0, 4)
                    weight_item = Weight(
                        weight_version="2026.1",
                        effective_from=date(2026, 1, 1),
                        route_id=r.id,
                        airline_id=a.id,
                        booking_lead_time_days=lead,
                        weight_value=cell_weight,
                        weight_basis="DGCA_monthly_passenger_traffic_share",
                        notes=f"Weight for route {r_code}, airline {a.airline_code}, T+{lead}"
                    )
                    db.add(weight_item)
        db.commit()

        print("5. Generating 45 Days of Historical Fare Observations & Daily APIx...")
        today = date.today()
        start_date = today - timedelta(days=45)

        for day_offset in range(46):
            current_dt = start_date + timedelta(days=day_offset)
            print(f"   -> Processing day {day_offset+1}/46: {current_dt.isoformat()}")

            run_collection_cycle(
                db=db,
                target_date=current_dt,
                booking_windows=[1, 7, 15, 30, 45]
            )

            calculate_daily_index(db, target_date=current_dt)

        print("6. Seeding Initial DGCA Benchmark Samples...")
        benchmarks = [
            {"route_name": "DEL-BOM", "year_month": "2026-01", "average_fare_inr": 5420.0, "notes": "Official DGCA sample"},
            {"route_name": "DEL-BLR", "year_month": "2026-01", "average_fare_inr": 6150.0, "notes": "Official DGCA sample"},
            {"route_name": "BOM-BLR", "year_month": "2026-01", "average_fare_inr": 4480.0, "notes": "Official DGCA sample"},
            {"route_name": "DEL-BOM", "year_month": "2026-02", "average_fare_inr": 5580.0, "notes": "Official DGCA sample"},
            {"route_name": "DEL-BLR", "year_month": "2026-02", "average_fare_inr": 6290.0, "notes": "Official DGCA sample"},
        ]
        for bm in benchmarks:
            db.add(DGCABenchmark(**bm))
        db.commit()

        print("\nSeed Data Generation Completed Successfully!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
