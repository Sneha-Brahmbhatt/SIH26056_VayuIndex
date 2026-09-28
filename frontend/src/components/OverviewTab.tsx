import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  ShieldCheck,
  Zap,
  Activity,
  CheckCircle2
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';
import { IndexValue, QualityMetricsResponse } from '../types';

interface OverviewTabProps {
  nationalIndices: IndexValue[];
  qualityMetrics: QualityMetricsResponse | null;
  onNavigateTab: (tab: any) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  nationalIndices,
  qualityMetrics,
  onNavigateTab
}) => {
  const latestIndex = nationalIndices.length > 0 ? nationalIndices[nationalIndices.length - 1] : null;
  const isPositive = (latestIndex?.change_value || 0) >= 0;

  const sparklineData = nationalIndices.slice(-30).map(item => ({
    date: item.index_date,
    value: item.index_value
  }));

  return (
    <div className="space-y-6">
      
      {/* Top Banner Alert / Status */}
      <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-bold">Headline Airfare Price Index (APIx)</h2>
            <span className="bg-blue-500/20 text-blue-300 text-xs px-2.5 py-0.5 rounded font-mono border border-blue-500/30">
              National Daily
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Jevons matched-model index computed across 10 trunk/metro Indian air routes and 5 carriers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-right">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Base Period</div>
            <div className="text-xs font-mono font-bold text-slate-200">2026-01-01 = 100.0</div>
          </div>
          <div className="bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-700 text-right">
            <div className="text-[10px] text-slate-400 font-semibold uppercase">Methodology</div>
            <div className="text-xs font-mono font-bold text-blue-400">1.0.0-Jevons</div>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* National APIx Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Current APIx Value
            </span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
              Daily
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-extrabold font-mono text-slate-900">
              {latestIndex ? latestIndex.index_value.toFixed(2) : '100.00'}
            </span>
            {latestIndex && (
              <span className={`flex items-center text-xs font-bold px-2 py-0.5 rounded ${
                isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                {isPositive ? '+' : ''}{latestIndex.change_percent?.toFixed(2)}%
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
            <span>Prev: {latestIndex?.previous_index_value?.toFixed(2) || '100.00'}</span>
            <span>Change: {isPositive ? '+' : ''}{latestIndex?.change_value?.toFixed(2)}</span>
          </div>
        </div>

        {/* Coverage Weight Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Coverage-Weight %
            </span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900">
              {qualityMetrics ? `${qualityMetrics.coverage_weight_pct}%` : '94.2%'}
            </span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
              High Confidence
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Intended vs covered cell weight share
          </div>
        </div>

        {/* Successful Collection Rate */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Source Collection Rate
            </span>
            <Zap className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900">
              {qualityMetrics ? `${qualityMetrics.successful_collection_rate}%` : '96.5%'}
            </span>
            <span className="text-xs font-medium text-slate-500">
              Freshness: {qualityMetrics?.observation_freshness_hours || 0.5}h
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            Simulated adapters health status
          </div>
        </div>

        {/* Active Route Basket */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Route Basket & Windows
            </span>
            <Layers className="h-4 w-4 text-purple-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-slate-900">
              10 <span className="text-base font-normal text-slate-500">Routes</span>
            </span>
            <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-mono">
              T+1 to T+45
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            5 Airlines • 5 Booking Lead Times
          </div>
        </div>

      </div>

      {/* 30-Day Trend Chart & Sparkline */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-600" />
              National APIx Trend (Last 30 Days)
            </h3>
            <p className="text-xs text-slate-500">
              Daily index progression reflecting nationwide airfare movements.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('national')}
            className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline self-start sm:self-auto"
          >
            View Full Historical Chart &rarr;
          </button>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparklineData}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any) => [`APIx: ${Number(val).toFixed(2)}`, 'Index Value']}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="#2563EB"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, fill: '#1E3A8A' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Key Scope Callouts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div
          onClick={() => onNavigateTab('routes')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase">Route Sub-Indices</h4>
            <span className="text-xs text-blue-600 font-medium">&rarr;</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Track DEL–BOM, DEL–BLR, BOM–BLR and 7 other major Indian corridors.
          </p>
          <div className="text-[11px] text-slate-400 font-mono">
            Key basket: 10 Indian trunk & metro routes
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('windows')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase">Advance Purchase (T+k)</h4>
            <span className="text-xs text-blue-600 font-medium">&rarr;</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Compare T+1 (last minute), T+7, T+15, T+30, and T+45 lead time curves.
          </p>
          <div className="text-[11px] text-slate-400 font-mono">
            5 distinct lead-time windows monitored
          </div>
        </div>

        <div
          onClick={() => onNavigateTab('trace')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-300 hover:shadow transition cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase">Observation Traceability</h4>
            <span className="text-xs text-blue-600 font-medium">&rarr;</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Drill down from any index point directly to accepted raw fare observations.
          </p>
          <div className="text-[11px] text-slate-400 font-mono">
            100% auditability to raw response hashes
          </div>
        </div>

      </div>

    </div>
  );
};
