import React from 'react';
import { ShieldCheck, Activity, AlertOctagon, CheckCircle2, Clock, Server, FileCode } from 'lucide-react';
import { QualityMetricsResponse } from '../types';

interface DataQualityTabProps {
  qualityMetrics: QualityMetricsResponse | null;
}

export const DataQualityTab: React.FC<DataQualityTabProps> = ({ qualityMetrics }) => {
  if (!qualityMetrics) {
    return (
      <div className="p-8 text-center text-slate-500">
        Loading data quality metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Required Disclaimer Callout */}
      <div className="bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-xl shadow-sm flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <p className="font-bold text-sm">Official Data Quality & Coverage Declaration</p>
          <p className="leading-relaxed">
            “{qualityMetrics.disclaimer}”
          </p>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Coverage Weight</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold font-mono text-slate-900">
            {qualityMetrics.coverage_weight_pct}%
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Intended: {qualityMetrics.intended_weight_total}</span>
            <span>Covered: {qualityMetrics.covered_weight_total}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Successful Collection</span>
            <CheckCircle2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold font-mono text-slate-900">
            {qualityMetrics.successful_collection_rate}%
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Across active simulated adapters
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Missing Cell Rate</span>
            <AlertOctagon className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold font-mono text-slate-900">
            {qualityMetrics.missing_cell_rate}%
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Cells requiring provisional carry-forward
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase">Source Concentration</span>
            <Activity className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-3 text-3xl font-extrabold font-mono text-slate-900">
            {qualityMetrics.source_concentration_hhi} <span className="text-xs font-normal text-slate-500">HHI</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Herfindahl-Hirschman diversity index
          </div>
        </div>

      </div>

      {/* Detailed Outcome Rates Breakdown */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Server className="h-4 w-4 text-slate-600" />
          Collection Event Outcome Breakdown (% of total attempts)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
          
          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
            <div className="text-[11px] text-emerald-800 font-semibold uppercase">Success</div>
            <div className="text-xl font-bold font-mono text-emerald-900 mt-1">
              {qualityMetrics.successful_collection_rate}%
            </div>
          </div>

          <div className="bg-rose-50 p-3 rounded-lg border border-rose-200">
            <div className="text-[11px] text-rose-800 font-semibold uppercase">Blocked</div>
            <div className="text-xl font-bold font-mono text-rose-900 mt-1">
              {qualityMetrics.blocked_rate}%
            </div>
          </div>

          <div className="bg-amber-50 p-3 rounded-lg border border-amber-200">
            <div className="text-[11px] text-amber-800 font-semibold uppercase">Timeout</div>
            <div className="text-xl font-bold font-mono text-amber-900 mt-1">
              {qualityMetrics.timeout_rate}%
            </div>
          </div>

          <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
            <div className="text-[11px] text-purple-800 font-semibold uppercase">Schema Change</div>
            <div className="text-xl font-bold font-mono text-purple-900 mt-1">
              {qualityMetrics.schema_change_rate}%
            </div>
          </div>

          <div className="bg-slate-100 p-3 rounded-lg border border-slate-300">
            <div className="text-[11px] text-slate-700 font-semibold uppercase">Sold Out</div>
            <div className="text-xl font-bold font-mono text-slate-900 mt-1">
              {qualityMetrics.sold_out_rate}%
            </div>
          </div>

        </div>
      </div>

      {/* Source Health Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <FileCode className="h-4 w-4 text-blue-600" />
          Adapter Source Health & Compliance Table
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Source Name</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Attempts</th>
                <th className="py-3 px-3">Success %</th>
                <th className="py-3 px-3">Blocked %</th>
                <th className="py-3 px-3">Timeout %</th>
                <th className="py-3 px-3">Schema %</th>
                <th className="py-3 px-3">Sold Out %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {qualityMetrics.source_health.map(item => (
                <tr key={item.source_id} className="hover:bg-slate-50">
                  <td className="py-3 px-3 font-sans font-bold text-slate-900">{item.source_name}</td>
                  <td className="py-3 px-3 font-sans capitalize">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                      {item.source_type}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-sans">
                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[11px] font-medium capitalize">
                      {item.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-700">{item.total_attempts}</td>
                  <td className="py-3 px-3 font-bold text-emerald-600">{item.success_rate}%</td>
                  <td className="py-3 px-3 text-rose-600">{item.blocked_rate}%</td>
                  <td className="py-3 px-3 text-amber-600">{item.timeout_rate}%</td>
                  <td className="py-3 px-3 text-purple-600">{item.schema_change_rate}%</td>
                  <td className="py-3 px-3 text-slate-600">{item.sold_out_rate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
