import axios from 'axios';
import {
  MetaResponse,
  IndexValue,
  PaginatedObservations,
  ObservationDetailResponse,
  QualityMetricsResponse,
  CollectionEvent,
  IndexTraceResponse,
  DGCAComparisonResponse
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = {
  getMeta: async (): Promise<MetaResponse> => {
    const res = await axios.get(`${API_BASE_URL}/meta`);
    return res.data;
  },

  getNationalIndex: async (granularity = 'daily', leadTime?: number): Promise<IndexValue[]> => {
    const res = await axios.get(`${API_BASE_URL}/index`, {
      params: { granularity, booking_lead_time_days: leadTime }
    });
    return res.data;
  },

  getRouteIndices: async (routeId?: number): Promise<IndexValue[]> => {
    const res = await axios.get(`${API_BASE_URL}/index/routes`, {
      params: { route_id: routeId }
    });
    return res.data;
  },

  getAirlineIndices: async (airlineId?: number): Promise<IndexValue[]> => {
    const res = await axios.get(`${API_BASE_URL}/index/airlines`, {
      params: { airline_id: airlineId }
    });
    return res.data;
  },

  getBookingWindowIndices: async (leadTime?: number): Promise<IndexValue[]> => {
    const res = await axios.get(`${API_BASE_URL}/index/booking-windows`, {
      params: { lead_time_days: leadTime }
    });
    return res.data;
  },

  getObservations: async (params: {
    route_id?: number;
    airline_id?: number;
    source_id?: number;
    booking_lead_time_days?: number;
    quality_status?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedObservations> => {
    const res = await axios.get(`${API_BASE_URL}/observations`, { params });
    return res.data;
  },

  getObservationDetail: async (id: number): Promise<ObservationDetailResponse> => {
    const res = await axios.get(`${API_BASE_URL}/observations/${id}`);
    return res.data;
  },

  getQualityMetrics: async (): Promise<QualityMetricsResponse> => {
    const res = await axios.get(`${API_BASE_URL}/quality`);
    return res.data;
  },

  getCollectionEvents: async (): Promise<CollectionEvent[]> => {
    const res = await axios.get(`${API_BASE_URL}/collection-events`);
    return res.data;
  },

  getIndexTrace: async (indexValueId: number): Promise<IndexTraceResponse> => {
    const res = await axios.get(`${API_BASE_URL}/index/${indexValueId}/trace`);
    return res.data;
  },

  runCollection: async (payload?: { route_ids?: number[]; source_ids?: number[]; booking_windows?: number[] }) => {
    const res = await axios.post(`${API_BASE_URL}/collection/run`, payload || {});
    return res.data;
  },

  rebaseIndex: async (newBaseDate: string, notes: string) => {
    const res = await axios.post(`${API_BASE_URL}/admin/rebase`, {
      new_base_period: newBaseDate,
      notes,
      confirm: true
    });
    return res.data;
  },

  getDGCABenchmark: async (): Promise<DGCAComparisonResponse> => {
    const res = await axios.get(`${API_BASE_URL}/backtest/dgca`);
    return res.data;
  },

  uploadDGCACSV: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axios.post(`${API_BASE_URL}/backtest/dgca-upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};
