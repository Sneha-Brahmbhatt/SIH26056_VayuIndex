import React, { useEffect, useState } from 'react';
import { X, Hash, Calendar, FileText, CheckCircle, AlertTriangle, ShieldX } from 'lucide-react';
import { apiClient } from '../api/client';
import { ObservationDetailResponse } from '../types';

interface ObservationDetailModalProps {
  observationId: number | null;
  onClose: () => void;
}

export const ObservationDetailModal: React.FC<ObservationDetailModalProps> = ({ observationId, onClose }) => {
  const [data, setData] = useState<ObservationDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (observationId) {
      setLoading(true);
      apiClient.getObservationDetail(observationId)
        .then(res => setData(res))
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [observationId]);

  if (!observationId) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold">Fare Observation #{observationId}</h3>
              {data && (
                <span className={`text-xs px-2.5 py-0.5 rounded font-medium capitalize ${
                  data.observation.quality_status === 'accepted' ? 'bg-emerald-500/20 text-emerald-300' :
                  data.observation.quality_status === 'quarantined' ? 'bg-amber-500/20 text-amber-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {data.observation.quality_status}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Detailed observation components and immutable raw response payload
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-xs">
            Loading observation details & raw response body...
          </div>
        ) : data ? (
          <div className="p-6 overflow-y-auto space-y-6 text-xs">
            
            {/* Observation Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Route</span>
                <div className="font-bold text-slate-900 font-mono mt-0.5">{data.observation.route_code}</div>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Airline</span>
                <div className="font-bold text-slate-900 mt-0.5">{data.observation.airline_name}</div>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Source</span>
                <div className="font-bold text-slate-900 mt-0.5">{data.observation.source_name}</div>
              </div>
              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Travel Date</span>
                <div className="font-bold text-slate-900 font-mono mt-0.5">{data.observation.travel_date}</div>
              </div>
            </div>

            {/* Component Fare Breakdown */}
            <div className="bg-white p-4 rounded-xl border border-slate-200">
              <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-3">
                Disaggregated Fare Components (INR)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center font-mono">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-slate-500 text-[10px]">Base Fare</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">₹{data.observation.base_fare_inr.toFixed(2)}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-slate-500 text-[10px]">Taxes & Fees</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">₹{data.observation.taxes_fees_inr.toFixed(2)}</div>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <div className="text-slate-500 text-[10px]">Convenience Fee</div>
                  <div className="text-sm font-bold text-slate-900 mt-1">₹{data.observation.convenience_fee_inr.toFixed(2)}</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="text-blue-800 text-[10px] font-bold">Total Payable</div>
                  <div className="text-base font-extrabold text-blue-900 mt-1">₹{data.observation.total_payable_inr.toFixed(2)}</div>
                </div>
              </div>
            </div>

            {/* Linked Raw Response */}
            {data.raw_response && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-blue-600" />
                    Raw Response Audit Payload & Hash
                  </h4>
                  <span className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    {data.raw_response.response_hash.substring(0, 16)}...
                  </span>
                </div>

                <div className="bg-slate-900 text-slate-200 p-4 rounded-xl font-mono text-[11px] overflow-x-auto max-h-48 border border-slate-800">
                  <pre>{data.raw_response.response_body}</pre>
                </div>
              </div>
            )}

          </div>
        ) : null}

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs px-4 py-2 rounded-lg font-medium transition"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
};
