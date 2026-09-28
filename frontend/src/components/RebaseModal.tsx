import React, { useState } from 'react';
import { X, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../api/client';

interface RebaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RebaseModal: React.FC<RebaseModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [newBaseDate, setNewBaseDate] = useState<string>('2026-02-01');
  const [notes, setNotes] = useState<string>('Admin methodology rebase to new reference month.');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  if (!isOpen) return null;

  const handleRebase = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    apiClient.rebaseIndex(newBaseDate, notes)
      .then(res => {
        setResult(res);
        onSuccess();
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-blue-400" />
              Rebase Index Reference Period
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Admin endpoint to update index base period (100.0 baseline).
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 text-xs">
          
          {!result ? (
            <form onSubmit={handleRebase} className="space-y-4">
              
              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">New Base Date</label>
                <input
                  type="date"
                  value={newBaseDate}
                  onChange={e => setNewBaseDate(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono mt-1"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 uppercase">Revision Reason / Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 mt-1"
                  rows={3}
                  required
                />
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3 rounded-lg text-[11px] leading-snug">
                <strong>Warning:</strong> Rebasing creates a new methodology version record and updates base period references across historical index series.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition flex items-center justify-center gap-2 shadow-sm"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Executing Admin Rebase...</span>
                  </>
                ) : (
                  <span>Confirm Rebase Operation</span>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-3 font-mono">
              <div className="flex items-center gap-2 text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200 font-sans font-bold text-xs">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>Rebase Action Completed!</span>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-[11px]">
                <div>New Base Period: <span className="font-bold">{result.new_base_period}</span></div>
                <div>Methodology: <span className="font-bold text-blue-600">{result.methodology_version}</span></div>
                <div>Updated Records: <span className="font-bold">{result.affected_records_count}</span></div>
              </div>

              <button
                onClick={onClose}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 rounded-lg transition text-xs"
              >
                Close
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
