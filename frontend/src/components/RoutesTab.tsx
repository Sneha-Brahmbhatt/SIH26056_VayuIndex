import React, { useState } from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { MapPin, TrendingUp, TrendingDown, Layers } from 'lucide-react';
import { RouteMeta, IndexValue } from '../types';

interface RoutesTabProps {
  routes: RouteMeta[];
  routeIndices: IndexValue[];
}

export const RoutesTab: React.FC<RoutesTabProps> = ({ routes, routeIndices }) => {
  const [selectedRouteId, setSelectedRouteId] = useState<number>(routes[0]?.id || 1);

  const selectedRoute = routes.find(r => r.id === selectedRouteId) || routes[0];
  const filteredIndices = routeIndices.filter(item => item.route_id === selectedRouteId);

  const chartData = filteredIndices.map(item => ({
    date: item.index_date,
    value: item.index_value
  }));

  // Route Summary Stats Table Data
  const routeSummary = routes.map(r => {
    const rIndices = routeIndices.filter(item => item.route_id === r.id);
    const latest = rIndices[rIndices.length - 1];
    const prev7 = rIndices[Math.max(0, rIndices.length - 8)];
    
    const change7 = (latest && prev7)
      ? ((latest.index_value - prev7.index_value) / prev7.index_value) * 100.0
      : 0.0;

    return {
      route: r,
      code: `${r.origin_iata}-${r.destination_iata}`,
      cities: `${r.origin_city} ➔ ${r.destination_city}`,
      type: r.route_type,
      distance: r.distance_km,
      latestIndex: latest?.index_value || 100.0,
      change7Days: change7
    };
  });

  return (
    <div className="space-y-6">
      
      {/* Route Selector Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-blue-600" />
            Route Basket Sub-Indices
          </h2>
          <p className="text-xs text-slate-500">
            Route-level airfare price movements across key Indian aviation corridors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-600">Select Corridor:</label>
          <select
            value={selectedRouteId}
            onChange={e => setSelectedRouteId(Number(e.target.value))}
            className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {routes.map(r => (
              <option key={r.id} value={r.id}>
                {r.origin_iata}-{r.destination_iata} ({r.origin_city} to {r.destination_city})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Route Info Card & Line Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Selected Route Profile
            </span>
            <h3 className="text-lg font-bold text-slate-900">
              {selectedRoute?.origin_city} ({selectedRoute?.origin_iata}) to {selectedRoute?.destination_city} ({selectedRoute?.destination_iata})
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded font-medium border border-blue-200 capitalize">
              {selectedRoute?.route_type} corridor
            </span>
            <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded font-mono">
              {selectedRoute?.distance_km} km
            </span>
          </div>
        </div>

        {/* Route Chart */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#64748B' }} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                formatter={(val: any) => [`APIx: ${Number(val).toFixed(2)}`, 'Route Index']}
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

      {/* Complete Route Comparison Table */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Layers className="h-4 w-4 text-slate-600" />
          Route Basket Comparison Matrix (10 Monitored Corridors)
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3">Route Code</th>
                <th className="py-3 px-3">City Pair</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Distance</th>
                <th className="py-3 px-3">Current APIx</th>
                <th className="py-3 px-3">7-Day Change %</th>
                <th className="py-3 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {routeSummary.map(item => (
                <tr
                  key={item.route.id}
                  className={`hover:bg-slate-50 transition ${
                    item.route.id === selectedRouteId ? 'bg-blue-50/50 font-semibold' : ''
                  }`}
                >
                  <td className="py-3 px-3 font-mono font-bold text-blue-900">{item.code}</td>
                  <td className="py-3 px-3 text-slate-800">{item.cities}</td>
                  <td className="py-3 px-3">
                    <span className="capitalize bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-600">{item.distance} km</td>
                  <td className="py-3 px-3 font-mono font-bold text-slate-900">{item.latestIndex.toFixed(2)}</td>
                  <td className={`py-3 px-3 font-mono font-bold ${item.change7Days >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {item.change7Days >= 0 ? '+' : ''}{item.change7Days.toFixed(2)}%
                  </td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => setSelectedRouteId(item.route.id)}
                      className="text-xs bg-slate-800 text-white px-2.5 py-1 rounded hover:bg-slate-700 transition"
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
