import React, { useState, useEffect } from 'react';
import { Search, Filter, Eye, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { apiClient } from '../api/client';
import { RouteMeta, AirlineMeta, SourceMeta, PaginatedObservations, Observation } from '../types';
import { ObservationDetailModal } from './ObservationDetailModal';

interface ObservationExplorerTabProps {
  routes: RouteMeta[];
  airlines: AirlineMeta[];
  sources: SourceMeta[];
}

export const ObservationExplorerTab: React.FC<ObservationExplorerTabProps> = ({
  routes,
  airlines,
  sources
}) => {
  const [routeId, setRouteId] = useState<number | undefined>(undefined);
  const [airlineId, setAirlineId] = useState<number | undefined>(undefined);
  const [sourceId, setSourceId] = useState<number | undefined>(undefined);
  const [leadTime, setLeadTime] = useState<number | undefined>(undefined);
  const [qualityStatus, setQualityStatus] = useState<string | undefined>(undefined);
  const [page, setPage] = useState<number>(1);

  const [data, setData] = useState<PaginatedObservations | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedObsId, setSelectedObsId] = useState<number | null>(null);

  const fetchObservations = () => {
    setLoading(true);
    apiClient.getObservations({
      route_id: routeId,
      airline_id: airlineId,
      source_id: sourceId,
      booking_lead_time_days: leadTime,
      quality_status: qualityStatus,
      page,
      page_size: 25
    })
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchObservations();
  }, [routeId, airlineId, sourceId, leadTime, qualityStatus, page]);

  return (
    <div className="space-y-6">
      
      {/* Header & Filter Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Search className="h-4 w-4 text-blue-600" />
            Raw Fare Observation Explorer
          </h2>
          <p className="text-xs text-slate-500">
            Search and inspect accepted, quarantined, and rejected airfare observations.
          </p>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase">Route</label>
            <select
              value={routeId || ''}
              onChange={e => setRouteId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
            >
              <option value="">All Routes</option>
              {routes.map(r => (
                <option key={r.id} value={r.id}>{r.origin_iata}-{r.destination_iata}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase">Carrier</label>
            <select
              value={airlineId || ''}
              onChange={e => setAirlineId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
            >
              <option value="">All Carriers</option>
              {airlines.map(a => (
                <option key={a.id} value={a.id}>{a.airline_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase">Source</label>
            <select
              value={sourceId || ''}
              onChange={e => setSourceId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
            >
              <option value="">All Sources</option>
              {sources.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase">Lead Window</label>
            <select
              value={leadTime || ''}
              onChange={e => setLeadTime(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
            >
              <option value="">All Lead Times</option>
              <option value={1}>T+1</option>
              <option value={7}>T+7</option>
              <option value={15}>T+15</option>
              <option value={30}>T+30</option>
              <option value={45}>T+45</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 uppercase">Quality Status</label>
            <select
              value={qualityStatus || ''}
              onChange={e => setQualityStatus(e.target.value || undefined)}
              className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2 font-medium"
            >
              <option value="">All Statuses</option>
              <option value="accepted">Accepted</option>
              <option value="quarantined">Quarantined</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

        </div>
      </div>

      {/* Observations Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">ID</th>
                <th className="py-3 px-3">Route</th>
                <th className="py-3 px-3">Carrier</th>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-3">Travel Date</th>
                <th className="py-3 px-3">Window</th>
                <th className="py-3 px-3 text-right">Base Fare</th>
                <th className="py-3 px-3 text-right">Taxes & Fees</th>
                <th className="py-3 px-3 text-right">Total Payable</th>
                <th className="py-3 px-3 text-center">Quality</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-400 font-sans">
                    Loading fare observations...
                  </td>
                </tr>
              ) : data && data.items.length > 0 ? (
                data.items.map(obs => (
                  <tr key={obs.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 font-bold text-slate-900">#{obs.id}</td>
                    <td className="py-2.5 px-3 font-bold text-blue-900">{obs.route_code}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-800">{obs.airline_name}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-600 text-[11px]">{obs.source_name}</td>
                    <td className="py-2.5 px-3 text-slate-700">{obs.travel_date}</td>
                    <td className="py-2.5 px-3">
                      <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">
                        T+{obs.booking_lead_time_days}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-700">₹{obs.base_fare_inr.toFixed(0)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">₹{obs.taxes_fees_inr.toFixed(0)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                      ₹{obs.total_payable_inr.toFixed(0)}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold capitalize ${
                        obs.quality_status === 'accepted' ? 'bg-emerald-100 text-emerald-800' :
                        obs.quality_status === 'quarantined' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {obs.quality_status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={() => setSelectedObsId(obs.id)}
                        className="p-1 rounded text-blue-600 hover:bg-blue-50 transition"
                        title="View Raw Response Payload"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-slate-500 font-sans">
                    No fare observations match the specified filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {data && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              Showing {((page - 1) * data.page_size) + 1} to {Math.min(page * data.page_size, data.total)} of {data.total} observations
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 bg-white border border-slate-300 rounded font-medium disabled:opacity-50"
              >
                Previous
              </button>
              <span className="font-mono">Page {page}</span>
              <button
                disabled={page * data.page_size >= data.total}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 bg-white border border-slate-300 rounded font-medium disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedObsId && (
        <ObservationDetailModal
          observationId={selectedObsId}
          onClose={() => setSelectedObsId(null)}
        />
      )}

    </div>
  );
};
