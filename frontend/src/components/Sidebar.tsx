import React from 'react';
import {
  LayoutDashboard,
  TrendingUp,
  MapPin,
  CalendarDays,
  ShieldCheck,
  Search,
  FileCheck2,
  BarChart3
} from 'lucide-react';

export type TabType =
  | 'overview'
  | 'national'
  | 'routes'
  | 'windows'
  | 'quality'
  | 'explorer'
  | 'trace'
  | 'dgca';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'national', label: 'National Index', icon: TrendingUp },
    { id: 'routes', label: 'Routes Sub-Index', icon: MapPin },
    { id: 'windows', label: 'Booking Windows', icon: CalendarDays },
    { id: 'quality', label: 'Data Quality & Coverage', icon: ShieldCheck },
    { id: 'explorer', label: 'Observation Explorer', icon: Search },
    { id: 'trace', label: 'Index Traceability', icon: FileCheck2 },
    { id: 'dgca', label: 'DGCA Benchmark', icon: BarChart3 },
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-r border-slate-200 flex-shrink-0">
      <div className="p-4">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 px-2">
          Navigation Panel
        </h2>
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as TabType)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-blue-600 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};
