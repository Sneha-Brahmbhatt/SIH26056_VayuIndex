import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { Calendar, Filter, Info, RefreshCw } from 'lucide-react';
import { IndexValue } from '../types';

interface NationalIndexTabProps {
  nationalIndices: IndexValue[];
  bookingWindowIndices: IndexValue[];
  onOpenRebaseModal: () => void;
}

export const NationalIndexTab: React.FC<NationalIndexTabProps> = ({
  nationalIndices,
  bookingWindowIndices,
  onOpenRebaseModal
}) => {
  const [granularity, setGranularity] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [selectedLeadTime, setSelectedLeadTime] = useState<number | 'all'>('all');

  // Prepare combined series for Chart
  const dateMap: { [dateStr: string]: any } = {};

  nationalIndices.forEach(item => {
    if (!dateMap[item.index_date]) {
      dateMap[item.index_date] = { date: item.index_date };
    }
    dateMap[item.index_date]['National'] = item.index_value;
  });

  bookingWindowIndices.forEach(item => {
    if (!dateMap[item.index_date]) {
      dateMap[item.index_date] = { date: item.index_date };
    }
    if (item.booking_lead_time_days) {
      dateMap[item.index_date][`T+${item.booking_lead_time_days}`] = item.index_value;
    }
  });

  const chartData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      
      {/* Tab Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            National Airfare Price Index (APIx) Time Series
          </h2>
          <p className="text-xs text-slate-500">
            Chain-linked Jevons matched-model index computed daily across all cell weights.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Granularity Toggle */}
          <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 text-xs">
            {(['daily', 'weekly', 'monthly'] as const).map(g => (
              <button
                key={g}
                onClick={() => setGranularity(g)}
                className={`px-3 py-1 rounded-md font-medium capitalize transition ${
                  granularity === g
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Lead Time Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedLeadTime}
              onChange={e => setSelectedLeadTime(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="text-xs bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="all">All Series (National + Lead Times)</option>
              <option value={1}>T+1 (1 Day Lead)</option>
              <option value={7}>T+7 (7 Days Lead)</option>
              <option value={15}>T+15 (15 Days Lead)</option>
              <option value={30}>T+30 (30 Days Lead)</option>
              <option value={45}>T+45 (45 Days Lead)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Multi-Series Line Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any, name: any) => [`APIx: ${Number(val).toFixed(2)}`, name]}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              
              {selectedLeadTime === 'all' && (
                <Line
                  type="monotone"
                  dataKey="National"
                  stroke="#0A192F"
                  strokeWidth={3}
                  dot={false}
                  name="National Headline APIx"
                />
              )}
              {(selectedLeadTime === 'all' || Number(selectedLeadTime) === 1) && (
                <Line type="monotone" dataKey="T+1" stroke="#EF4444" strokeWidth={1.8} dot={false} name="T+1 (1 Day)" />
              )}
              {(selectedLeadTime === 'all' || Number(selectedLeadTime) === 7) && (
                <Line type="monotone" dataKey="T+7" stroke="#F59E0B" strokeWidth={1.8} dot={false} name="T+7 (7 Days)" />
              )}
              {(selectedLeadTime === 'all' || Number(selectedLeadTime) === 15) && (
                <Line type="monotone" dataKey="T+15" stroke="#10B981" strokeWidth={1.8} dot={false} name="T+15 (15 Days)" />
              )}
              {(selectedLeadTime === 'all' || Number(selectedLeadTime) === 30) && (
                <Line type="monotone" dataKey="T+30" stroke="#3B82F6" strokeWidth={1.8} dot={false} name="T+30 (30 Days)" />
              )}
              {(selectedLeadTime === 'all' || Number(selectedLeadTime) === 45) && (
                <Line type="monotone" dataKey="T+45" stroke="#8B5CF6" strokeWidth={1.8} dot={false} name="T+45 (45 Days)" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Methodology & Revision Log */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Methodology Specs */}
        <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-sm col-span-1">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Info className="h-4 w-4 text-blue-400" />
            Methodology & Governance
          </h3>
          <div className="space-y-3 text-xs">
            <div>
              <span className="text-slate-400">Formula:</span>
              <div className="font-mono text-blue-300 mt-0.5">Matched-Model Jevons Index</div>
            </div>
            <div>
              <span className="text-slate-400">Base Period:</span>
              <div className="font-mono text-slate-200 mt-0.5">2026-01-01 = 100.0</div>
            </div>
            <div>
              <span className="text-slate-400">Weight Version:</span>
              <div className="font-mono text-emerald-400 mt-0.5">2026.1 (Passenger Share)</div>
            </div>
            <div>
              <span className="text-slate-400">Missing Data Policy:</span>
              <div className="text-slate-300 mt-0.5">
                Provisional carry-forward allowed for 1 daily period with flagged revision.
              </div>
            </div>
            <button
              onClick={onOpenRebaseModal}
              className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white text-xs py-2 rounded font-medium flex items-center justify-center gap-1.5 transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Admin Rebase Base Period</span>
            </button>
          </div>
        </div>

        {/* Recent Revision Log Table */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm col-span-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Historical Daily Index Log (Latest 5 Records)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">APIx Value</th>
                  <th className="py-2.5 px-3">Change %</th>
                  <th className="py-2.5 px-3">Coverage %</th>
                  <th className="py-2.5 px-3">Confidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {nationalIndices.slice(-5).reverse().map(item => (
                  <tr key={item.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 font-semibold text-slate-900">{item.index_date}</td>
                    <td className="py-2 px-3 font-bold text-blue-700">{item.index_value.toFixed(2)}</td>
                    <td className={`py-2 px-3 ${ (item.change_percent || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600' }`}>
                      {(item.change_percent || 0) >= 0 ? '+' : ''}{item.change_percent?.toFixed(2)}%
                    </td>
                    <td className="py-2 px-3 text-slate-600">{item.coverage_weight_pct.toFixed(1)}%</td>
                    <td className="py-2 px-3">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[11px] font-sans font-medium">
                        {item.confidence}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};
