import React, { useState, useEffect } from 'react';
import { FileCheck2, ShieldCheck, Database, Layers, ArrowRight } from 'lucide-react';
import { apiClient } from '../api/client';
import { IndexValue, IndexTraceResponse } from '../types';

interface IndexTraceTabProps {
  nationalIndices: IndexValue[];
}

export const IndexTraceTab: React.FC<IndexTraceTabProps> = ({ nationalIndices }) => {
  const [selectedIndexId, setSelectedIndexId] = useState<number>(
    nationalIndices.length > 0 ? nationalIndices[nationalIndices.length - 1].id : 1
  );

  const [traceData, setTraceData] = useState<IndexTraceResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (selectedIndexId) {
      setLoading(true);
      apiClient.getIndexTrace(selectedIndexId)
        .then(res => setTraceData(res))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [selectedIndexId]);

  return (
    <div className="space-y-6">
      
      {/* Selector Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileCheck2 className="h-4 w-4 text-blue-600" />
            Index Value Traceability Audit Trail
          </h2>
          <p className="text-xs text-slate-500">
            Audit and trace any index value back to weights, cell relatives, and raw observations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600">Select Index Point:</label>
          <select
            value={selectedIndexId}
            onChange={e => setSelectedIndexId(Number(e.target.value))}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {nationalIndices.slice(-30).reverse().map(idx => (
              <option key={idx.id} value={idx.id}>
                {idx.index_date} — APIx {idx.index_value.toFixed(2)} (ID #{idx.id})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          Loading traceability audit trail for index ID #{selectedIndexId}...
        </div>
      ) : traceData ? (
        <div className="space-y-6">
          
          {/* Target Index Card */}
          <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-blue-600 text-white font-mono text-xs px-2.5 py-0.5 rounded font-bold">
                  {traceData.index_value.index_date}
                </span>
                <span className="text-xs text-slate-300 font-mono">
                  Scope: {traceData.index_value.scope.toUpperCase()}
                </span>
              </div>
              <div className="text-3xl font-extrabold font-mono mt-2 text-white">
                APIx {traceData.index_value.index_value.toFixed(4)}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Methodology: {traceData.index_value.methodology_version} • Weights: {traceData.index_value.weight_version}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                <div className="text-slate-400 text-[10px] uppercase">Coverage Weight</div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">{traceData.coverage_weight_pct}%</div>
              </div>
              <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                <div className="text-slate-400 text-[10px] uppercase">Collection Events</div>
                <div className="text-lg font-bold text-blue-400 mt-0.5">{traceData.collection_events_count} events</div>
              </div>
            </div>
          </div>

          {/* Cell Weights & Price Relatives Table */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              Cell Weights & Matched Price Relatives Used in Calculation
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Cell Key</th>
                    <th className="py-2.5 px-3">Route</th>
                    <th className="py-2.5 px-3">Carrier</th>
                    <th className="py-2.5 px-3">Window</th>
                    <th className="py-2.5 px-3 text-right">Weight Share</th>
                    <th className="py-2.5 px-3 text-right">Matched Obs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {traceData.weights_used.map((cell, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-700">{cell.cell_key}</td>
                      <td className="py-2 px-3 text-blue-900 font-bold">{cell.route_code}</td>
                      <td className="py-2 px-3 font-sans">{cell.airline_name}</td>
                      <td className="py-2 px-3">T+{cell.booking_lead_time_days}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900">{cell.weight_value.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-slate-600">{cell.matched_observations_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Contributing Raw Fare Observations */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-600" />
              Contributing Accepted Raw Fare Observations ({traceData.contributing_observations.length} items)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Obs ID</th>
                    <th className="py-2 px-3">Source</th>
                    <th className="py-2 px-3">Route</th>
                    <th className="py-2 px-3">Carrier</th>
                    <th className="py-2 px-3">Lead Time</th>
                    <th className="py-2 px-3 text-right">Total Payable</th>
                    <th className="py-2 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {traceData.contributing_observations.slice(0, 15).map(obs => (
                    <tr key={obs.observation_id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-bold text-slate-900">#{obs.observation_id}</td>
                      <td className="py-2 px-3 font-sans text-slate-600">{obs.source_name}</td>
                      <td className="py-2 px-3 font-bold text-blue-900">{obs.route_code}</td>
                      <td className="py-2 px-3 font-sans text-slate-800">{obs.airline_name}</td>
                      <td className="py-2 px-3">T+{obs.booking_lead_time_days}</td>
                      <td className="py-2 px-3 text-right font-bold">₹{obs.total_payable_inr.toFixed(2)}</td>
                      <td className="py-2 px-3 text-center font-sans">
                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-semibold">
                          {obs.quality_status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : null}

    </div>
  );
};
