import React, { useState } from 'react';
import { X, Play, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { apiClient } from '../api/client';
import { RouteMeta, SourceMeta } from '../types';

interface CollectionRunModalProps {
  isOpen: boolean;
  onClose: () => void;
  routes: RouteMeta[];
  sources: SourceMeta[];
  onSuccess: () => void;
}

export const CollectionRunModal: React.FC<CollectionRunModalProps> = ({
  isOpen,
  onClose,
  routes,
  sources,
  onSuccess
}) => {
  const [running, setRunning] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleRun = () => {
    setRunning(true);
    setResult(null);

    apiClient.runCollection()
      .then(res => {
        setResult(res);
        onSuccess();
      })
      .catch(err => console.error(err))
      .finally(() => setRunning(false));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Play className="h-4 w-4 text-blue-400 fill-current" />
              Trigger Simulated Collection Cycle
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Executes a full observation sweep across active routes and carriers.
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          
          <div className="bg-blue-50 border border-blue-200 text-blue-900 p-3 rounded-lg text-[11px] leading-relaxed">
            <strong>Prototype Compliance Note:</strong> Triggering this cycle invokes the deterministic <code>SimulatedSourceAdapter</code>. No live airline websites will be scraped or bypassed.
          </div>

          {!result ? (
            <div className="space-y-3">
              <div className="flex justify-between text-slate-600 font-mono">
                <span>Active Corridors:</span>
                <span className="font-bold text-slate-900">{routes.length} Routes</span>
              </div>
              <div className="flex justify-between text-slate-600 font-mono">
                <span>Active Adapters:</span>
                <span className="font-bold text-slate-900">{sources.length} Sources</span>
              </div>
              <div className="flex justify-between text-slate-600 font-mono">
                <span>Lead Times Monitored:</span>
                <span className="font-bold text-slate-900">5 Windows (T+1..T+45)</span>
              </div>

              <button
                onClick={handleRun}
                disabled={running}
                className="w-full mt-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-sm text-xs"
              >
                {running ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Executing Collection Cycle...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    <span>Run Collection Cycle Now</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-3 font-mono">
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200 font-sans font-bold text-xs">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>Collection Cycle Executed Successfully!</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-[11px]">
                <div>Cycle ID: <span className="font-bold">{result.collection_cycle_id}</span></div>
                <div>Total Attempted: <span className="font-bold">{result.total_attempted}</span></div>
                <div>Accepted Count: <span className="font-bold text-emerald-600">{result.accepted_count}</span></div>
                <div>Quarantined Count: <span className="font-bold text-amber-600">{result.quarantined_count}</span></div>
                <div>Rejected Count: <span className="font-bold text-rose-600">{result.rejected_count}</span></div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg transition text-xs"
              >
                Done
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
