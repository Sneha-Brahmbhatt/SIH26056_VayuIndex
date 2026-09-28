from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, ConfigDict

# Base Config
class OrmBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

# Route & Airline & Source Meta
class RouteMeta(OrmBase):
    id: int
    origin_iata: str
    destination_iata: str
    origin_city: str
    destination_city: str
    route_type: str
    distance_km: int
    is_active: bool

class AirlineMeta(OrmBase):
    id: int
    airline_code: str
    airline_name: str
    is_active: bool

class SourceMeta(OrmBase):
    id: int
    name: str
    source_type: str
    base_url: str
    status: str
    robots_policy: Optional[str] = None
    tos_policy: Optional[str] = None
    rate_limit_per_minute: int

class MetaResponse(BaseModel):
    routes: List[RouteMeta]
    airlines: List[AirlineMeta]
    sources: List[SourceMeta]
    booking_windows: List[int]
    methodology_version: str
    weight_version: str
    base_period: str
    disclaimer: str

# Raw Response & Observation Schemas
class RawResponseSchema(OrmBase):
    id: int
    source_id: int
    request_url: str
    response_format: str
    response_hash: str
    collection_timestamp_ist: datetime
    request_metadata: Optional[str] = None
    response_body: str

class ObservationResponse(OrmBase):
    id: int
    source_id: int
    route_id: int
    airline_id: int
    collection_timestamp_ist: datetime
    travel_date: date
    booking_lead_time_days: int
    trip_type: str
    stops: int
    cabin: str
    fare_family: str
    base_fare_inr: float
    taxes_fees_inr: float
    convenience_fee_inr: float
    optional_ancillaries_inr: float
    total_payable_inr: float
    currency: str
    availability_status: str
    parser_version: str
    raw_response_id: Optional[int] = None
    quality_status: str
    quality_flags: str
    created_at: datetime
    
    # Optional nested details for easy UI rendering
    source_name: Optional[str] = None
    route_code: Optional[str] = None
    airline_name: Optional[str] = None

class PaginatedObservations(BaseModel):
    total: int
    page: int
    page_size: int
    items: List[ObservationResponse]

# Collection Schemas
class CollectionRunRequest(BaseModel):
    route_ids: Optional[List[int]] = None
    source_ids: Optional[List[int]] = None
    booking_windows: Optional[List[int]] = None
    target_date: Optional[date] = None

class CollectionRunResponse(BaseModel):
    status: str
    message: str
    collection_cycle_id: str
    total_attempted: int
    accepted_count: int
    quarantined_count: int
    rejected_count: int
    events_count: int

class CollectionEventResponse(OrmBase):
    id: int
    source_id: int
    route_id: Optional[int] = None
    attempted_at: datetime
    outcome: str
    http_status: Optional[int] = None
    error_message: Optional[str] = None
    retry_count: int
    duration_ms: int
    source_name: Optional[str] = None

# Index Schemas
class IndexValueResponse(OrmBase):
    id: int
    index_date: date
    granularity: str
    scope: str
    route_id: Optional[int] = None
    airline_id: Optional[int] = None
    booking_lead_time_days: Optional[int] = None
    index_value: float
    previous_index_value: Optional[float] = None
    change_value: Optional[float] = None
    change_percent: Optional[float] = None
    base_period: str
    methodology_version: str
    weight_version: str
    coverage_weight_pct: float
    confidence: str
    created_at: datetime
    revised_at: Optional[datetime] = None
    revision_reason: Optional[str] = None
    route_code: Optional[str] = None
    airline_name: Optional[str] = None

# Quality & Coverage Schemas
class SourceHealthItem(BaseModel):
    source_id: int
    source_name: str
    source_type: str
    status: str
    total_attempts: int
    success_rate: float
    blocked_rate: float
    timeout_rate: float
    schema_change_rate: float
    sold_out_rate: float
    last_collection_timestamp: Optional[datetime] = None

class QualityMetricsResponse(BaseModel):
    as_of_date: date
    intended_weight_total: float
    covered_weight_total: float
    coverage_weight_pct: float
    source_availability_rate: float
    successful_collection_rate: float
    blocked_rate: float
    timeout_rate: float
    schema_change_rate: float
    sold_out_rate: float
    missing_cell_rate: float
    observation_freshness_hours: float
    source_concentration_hhi: float
    source_health: List[SourceHealthItem]
    disclaimer: str

# Traceability Schema
class ObservationTraceDetail(BaseModel):
    observation_id: int
    source_name: str
    route_code: str
    airline_name: str
    booking_lead_time_days: int
    travel_date: date
    total_payable_inr: float
    quality_status: str

class CellWeightDetail(BaseModel):
    cell_key: str
    route_code: str
    airline_name: str
    booking_lead_time_days: int
    weight_value: float
    matched_observations_count: int
    cell_price_relative: float
    cell_index: float

class IndexTraceResponse(BaseModel):
    index_value: IndexValueResponse
    weights_used: List[CellWeightDetail]
    contributing_observations: List[ObservationTraceDetail]
    collection_events_count: int
    coverage_weight_pct: float
    confidence: str

# Admin Rebase Schema
class RebaseRequest(BaseModel):
    new_base_period: date
    notes: Optional[str] = "Manual rebase request"
    confirm: bool

class RebaseResponse(BaseModel):
    status: str
    new_base_period: str
    methodology_version: str
    affected_records_count: int
    message: str

# DGCA Benchmark Schema
class DGCABenchmarkItem(OrmBase):
    id: int
    route_name: str
    year_month: str
    average_fare_inr: float
    source_url: Optional[str] = None
    notes: Optional[str] = None
    uploaded_at: datetime

class DGCAComparisonResponse(BaseModel):
    benchmarks: List[DGCABenchmarkItem]
    correlation: Optional[float] = None
    directional_agreement_pct: Optional[float] = None
    notes: str
