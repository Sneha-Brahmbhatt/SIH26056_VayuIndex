export interface RouteMeta {
  id: number;
  origin_iata: string;
  destination_iata: string;
  origin_city: string;
  destination_city: string;
  route_type: string;
  distance_km: number;
  is_active: boolean;
}

export interface AirlineMeta {
  id: number;
  airline_code: string;
  airline_name: string;
  is_active: boolean;
}

export interface SourceMeta {
  id: number;
  name: string;
  source_type: string;
  base_url: string;
  status: string;
  robots_policy?: string;
  tos_policy?: string;
  rate_limit_per_minute: number;
}

export interface MetaResponse {
  routes: RouteMeta[];
  airlines: AirlineMeta[];
  sources: SourceMeta[];
  booking_windows: number[];
  methodology_version: string;
  weight_version: string;
  base_period: string;
  disclaimer: string;
}

export interface IndexValue {
  id: number;
  index_date: string;
  granularity: string;
  scope: string;
  route_id?: number;
  airline_id?: number;
  booking_lead_time_days?: number;
  index_value: number;
  previous_index_value?: number;
  change_value?: number;
  change_percent?: number;
  base_period: string;
  methodology_version: string;
  weight_version: string;
  coverage_weight_pct: number;
  confidence: 'high' | 'medium' | 'low';
  created_at: string;
  revised_at?: string;
  revision_reason?: string;
  route_code?: string;
  airline_name?: string;
}

export interface Observation {
  id: number;
  source_id: number;
  route_id: number;
  airline_id: number;
  collection_timestamp_ist: string;
  travel_date: string;
  booking_lead_time_days: number;
  trip_type: string;
  stops: number;
  cabin: string;
  fare_family: string;
  base_fare_inr: number;
  taxes_fees_inr: number;
  convenience_fee_inr: number;
  optional_ancillaries_inr: number;
  total_payable_inr: number;
  currency: string;
  availability_status: string;
  parser_version: string;
  raw_response_id?: number;
  quality_status: 'accepted' | 'quarantined' | 'rejected';
  quality_flags: string;
  created_at: string;
  source_name?: string;
  route_code?: string;
  airline_name?: string;
}

export interface PaginatedObservations {
  total: number;
  page: number;
  page_size: number;
  items: Observation[];
}

export interface RawResponseSchema {
  id: number;
  source_id: number;
  request_url: string;
  response_format: string;
  response_hash: string;
  collection_timestamp_ist: string;
  request_metadata?: string;
  response_body: string;
}

export interface ObservationDetailResponse {
  observation: Observation;
  raw_response?: RawResponseSchema;
}

export interface SourceHealthItem {
  source_id: number;
  source_name: string;
  source_type: string;
  status: string;
  total_attempts: number;
  success_rate: number;
  blocked_rate: number;
  timeout_rate: number;
  schema_change_rate: number;
  sold_out_rate: number;
  last_collection_timestamp?: string;
}

export interface QualityMetricsResponse {
  as_of_date: string;
  intended_weight_total: number;
  covered_weight_total: number;
  coverage_weight_pct: number;
  source_availability_rate: number;
  successful_collection_rate: number;
  blocked_rate: number;
  timeout_rate: number;
  schema_change_rate: number;
  sold_out_rate: number;
  missing_cell_rate: number;
  observation_freshness_hours: number;
  source_concentration_hhi: number;
  source_health: SourceHealthItem[];
  disclaimer: string;
}

export interface CollectionEvent {
  id: number;
  source_id: number;
  route_id?: number;
  attempted_at: string;
  outcome: string;
  http_status?: number;
  error_message?: string;
  retry_count: number;
  duration_ms: number;
  source_name?: string;
}

export interface ObservationTraceDetail {
  observation_id: number;
  source_name: string;
  route_code: string;
  airline_name: string;
  booking_lead_time_days: number;
  travel_date: string;
  total_payable_inr: number;
  quality_status: string;
}

export interface CellWeightDetail {
  cell_key: string;
  route_code: string;
  airline_name: string;
  booking_lead_time_days: number;
  weight_value: number;
  matched_observations_count: number;
  cell_price_relative: number;
  cell_index: number;
}

export interface IndexTraceResponse {
  index_value: IndexValue;
  weights_used: CellWeightDetail[];
  contributing_observations: ObservationTraceDetail[];
  collection_events_count: number;
  coverage_weight_pct: number;
  confidence: string;
}

export interface DGCABenchmarkItem {
  id: number;
  route_name: string;
  year_month: string;
  average_fare_inr: number;
  source_url?: string;
  notes?: string;
  uploaded_at: string;
}

export interface DGCAComparisonResponse {
  benchmarks: DGCABenchmarkItem[];
  correlation?: number;
  directional_agreement_pct?: number;
  notes: string;
}
