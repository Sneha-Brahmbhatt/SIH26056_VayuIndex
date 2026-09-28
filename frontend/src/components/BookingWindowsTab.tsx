import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { CalendarDays, Info, Clock, AlertCircle } from 'lucide-react';
import { IndexValue } from '../types';

interface BookingWindowsTabProps {
  bookingWindowIndices: IndexValue[];
}

export const BookingWindowsTab: React.FC<BookingWindowsTabProps> = ({ bookingWindowIndices }) => {
  const [activeWindow, setActiveWindow] = useState<number>(1);

  // Filter indices for current window
  const windowIndices = bookingWindowIndices.filter(item => item.booking_lead_time_days === activeWindow);

  // Group latest index values across all lead times to construct Lead-Time Curve
  const leadTimes = [1, 7, 15, 30, 45];
  const curveData = leadTimes.map(lt => {
    const items = bookingWindowIndices.filter(i => i.booking_lead_time_days === lt);
    const latest = items[items.length - 1];
    return {
      window: `T+${lt}`,
      leadTimeDays: lt,
      indexValue: latest?.index_value || 100.0
    };
  });

  const descriptions: { [key: number]: { title: string; desc: string; targetGroup: string } } = {
    1: {
      title: "T+1 (Immediate / Next-Day Departure)",
      desc: "Monitors last-minute distress or urgent business fares. Exhibits highest price volatility and steep premium multipliers.",
      targetGroup: "Emergency & Unplanned Business Travelers"
    },
    7: {
      title: "T+7 (1-Week Advance Purchase)",
      desc: "Captures short-notice travel decisions and weekly business trip planning cycles.",
      targetGroup: "Corporate Travelers & Short-Notice Visitors"
    },
    15: {
      title: "T+15 (2-Week Advance Purchase)",
      desc: "Standard domestic trip horizon for planned visits and medium-term bookings.",
      targetGroup: "General Domestic Passengers & Regional Visitors"
    },
    30: {
      title: "T+30 (1-Month Advance Purchase)",
      desc: "Baseline leisure travel horizon. Fares reflect carrier standard base inventory pricing before dynamic yield management escalations.",
      targetGroup: "Vacationers & Family Travelers"
    },
    45: {
      title: "T+45 (45-Day Early Bird Purchase)",
      desc: "Early bird booking horizon. Captures promotional fares, holiday advance planning, and festival season early inventory.",
      targetGroup: "Holiday Planners & Budget Conscious Travelers"
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-blue-600" />
          Advance Purchase Windows Sub-Indices (T+1 to T+45)
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Tracking price index movements across 5 distinct consumer booking horizons.
        </p>
      </div>

      {/* Five Sub-Index Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {leadTimes.map(lt => {
          const items = bookingWindowIndices.filter(i => i.booking_lead_time_days === lt);
          const latest = items[items.length - 1];
          const isSelected = activeWindow === lt;

          return (
            <div
              key={lt}
              onClick={() => setActiveWindow(lt)}
              className={`p-4 rounded-xl border cursor-pointer transition ${
                isSelected
                  ? 'bg-blue-900 text-white border-blue-900 shadow-md transform scale-[1.02]'
                  : 'bg-white text-slate-900 border-slate-200 hover:border-blue-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                  isSelected ? 'bg-blue-800 text-blue-200' : 'bg-slate-100 text-slate-700'
                }`}>
                  T+{lt}
                </span>
                <Clock className={`h-3.5 w-3.5 ${isSelected ? 'text-blue-300' : 'text-slate-400'}`} />
              </div>
              
              <div className="mt-3">
                <div className={`text-[11px] ${isSelected ? 'text-blue-200' : 'text-slate-500'}`}>
                  {lt === 1 ? '1 Day Lead' : `${lt} Days Lead`}
                </div>
                <div className="text-2xl font-extrabold font-mono mt-0.5">
                  {latest ? latest.index_value.toFixed(2) : '100.00'}
                </div>
              </div>

              <div className={`mt-2 text-[10px] ${isSelected ? 'text-blue-300' : 'text-slate-400'}`}>
                {latest?.change_percent ? `${latest.change_percent >= 0 ? '+' : ''}${latest.change_percent.toFixed(2)}% daily` : 'Base=100.0'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Window Detail & Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Selected Window Specs */}
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-sm col-span-1 space-y-4">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white font-mono font-bold text-xs px-2.5 py-1 rounded">
              T+{activeWindow}
            </span>
            <h3 className="text-sm font-bold">{descriptions[activeWindow].title}</h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            {descriptions[activeWindow].desc}
          </p>

          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
            <div className="text-[10px] text-slate-400 uppercase font-semibold">Primary Target Segment</div>
            <div className="text-xs font-medium text-emerald-400 mt-1">
              {descriptions[activeWindow].targetGroup}
            </div>
          </div>

          <div className="text-xs text-slate-400 flex items-start gap-2 pt-2 border-t border-slate-800">
            <Info className="h-4 w-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <span>
              By isolating T+k windows, VayuIndex prevents lead-time compositional bias in CPI augmentation.
            </span>
          </div>
        </div>

        {/* Lead Time Index Curve Chart */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-2">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
            Lead-Time Price Index Curve (Current Snapshot)
          </h3>
          
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={curveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="window" tick={{ fontSize: 12, fill: '#0F172A', fontWeight: 'bold' }} />
                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`APIx: ${Number(val).toFixed(2)}`, 'Window Index']}
                />
                <Line
                  type="monotone"
                  dataKey="indexValue"
                  stroke="#2563EB"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#1E3A8A' }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 text-xs text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200">
            <strong>Economic Insight:</strong> T+1 index generally trades at a premium over T+45 due to carrier yield management algorithms.
          </div>
        </div>

      </div>

    </div>
  );
};
