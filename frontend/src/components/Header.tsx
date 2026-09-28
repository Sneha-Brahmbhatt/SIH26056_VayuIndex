import React from 'react';
import { Plane, Play, RefreshCw, ShieldAlert, Database } from 'lucide-react';

interface HeaderProps {
  onOpenCollectionModal: () => void;
  onOpenRebaseModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenCollectionModal, onOpenRebaseModal }) => {
  return (
    <header className="bg-navy-900 text-white border-b border-slate-700 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Brand & Organization Title */}
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2.5 rounded-lg text-white shadow-md">
              <Plane className="h-6 w-6 transform -rotate-12" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">VayuIndex</h1>
                <span className="bg-amber-500/20 text-amber-300 text-xs px-2.5 py-0.5 rounded border border-amber-500/30 font-medium">
                  High-frequency prototype
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Airfare Price Index (APIx) — MoSPI / Data Informatics & Innovation Division (DIID)
              </p>
            </div>
          </div>

          {/* Badges & Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="hidden lg:flex items-center gap-1.5 text-xs bg-slate-800/80 px-3 py-1.5 rounded border border-slate-700 text-slate-300">
              <Database className="h-3.5 w-3.5 text-blue-400" />
              <span>Coverage-weighted index</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-medium">Controlled / Simulated Data</span>
            </div>

            <button
              onClick={onOpenCollectionModal}
              className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-md font-medium transition shadow-sm"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Run Collection</span>
            </button>

            <button
              onClick={onOpenRebaseModal}
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 px-3 py-2 rounded-md font-medium transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Rebase Base Period</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
