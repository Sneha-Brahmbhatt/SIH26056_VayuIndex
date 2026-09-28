import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { Sidebar, TabType } from './components/Sidebar';
import { OverviewTab } from './components/OverviewTab';
import { NationalIndexTab } from './components/NationalIndexTab';
import { RoutesTab } from './components/RoutesTab';
import { BookingWindowsTab } from './components/BookingWindowsTab';
import { DataQualityTab } from './components/DataQualityTab';
import { ObservationExplorerTab } from './components/ObservationExplorerTab';
import { IndexTraceTab } from './components/IndexTraceTab';
import { DGCABenchmarkTab } from './components/DGCABenchmarkTab';
import { CollectionRunModal } from './components/CollectionRunModal';
import { RebaseModal } from './components/RebaseModal';
import { apiClient } from './api/client';
import { MetaResponse, IndexValue, QualityMetricsResponse } from './types';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [meta, setMeta] = useState<MetaResponse | null>(null);
  const [nationalIndices, setNationalIndices] = useState<IndexValue[]>([]);
  const [routeIndices, setRouteIndices] = useState<IndexValue[]>([]);
  const [bookingWindowIndices, setBookingWindowIndices] = useState<IndexValue[]>([]);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetricsResponse | null>(null);

  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState<boolean>(false);
  const [isRebaseModalOpen, setIsRebaseModalOpen] = useState<boolean>(false);

  const loadAllData = () => {
    apiClient.getMeta().then(res => setMeta(res)).catch(err => console.error(err));
    apiClient.getNationalIndex().then(res => setNationalIndices(res)).catch(err => console.error(err));
    apiClient.getRouteIndices().then(res => setRouteIndices(res)).catch(err => console.error(err));
    apiClient.getBookingWindowIndices().then(res => setBookingWindowIndices(res)).catch(err => console.error(err));
    apiClient.getQualityMetrics().then(res => setQualityMetrics(res)).catch(err => console.error(err));
  };

  useEffect(() => {
    loadAllData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      
      {/* Top Navigation & Compliance Header */}
      <Header
        onOpenCollectionModal={() => setIsCollectionModalOpen(true)}
        onOpenRebaseModal={() => setIsRebaseModalOpen(true)}
      />

      {/* Mandatory Compliance Banner */}
      <DisclaimerBanner />

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Main Tab View */}
        <main className="flex-1 min-w-0">
          {activeTab === 'overview' && (
            <OverviewTab
              nationalIndices={nationalIndices}
              qualityMetrics={qualityMetrics}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'national' && (
            <NationalIndexTab
              nationalIndices={nationalIndices}
              bookingWindowIndices={bookingWindowIndices}
              onOpenRebaseModal={() => setIsRebaseModalOpen(true)}
            />
          )}

          {activeTab === 'routes' && (
            <RoutesTab
              routes={meta?.routes || []}
              routeIndices={routeIndices}
            />
          )}

          {activeTab === 'windows' && (
            <BookingWindowsTab
              bookingWindowIndices={bookingWindowIndices}
            />
          )}

          {activeTab === 'quality' && (
            <DataQualityTab
              qualityMetrics={qualityMetrics}
            />
          )}

          {activeTab === 'explorer' && (
            <ObservationExplorerTab
              routes={meta?.routes || []}
              airlines={meta?.airlines || []}
              sources={meta?.sources || []}
            />
          )}

          {activeTab === 'trace' && (
            <IndexTraceTab
              nationalIndices={nationalIndices}
            />
          )}

          {activeTab === 'dgca' && (
            <DGCABenchmarkTab />
          )}
        </main>

      </div>

      {/* Modals */}
      <CollectionRunModal
        isOpen={isCollectionModalOpen}
        onClose={() => setIsCollectionModalOpen(false)}
        routes={meta?.routes || []}
        sources={meta?.sources || []}
        onSuccess={loadAllData}
      />

      <RebaseModal
        isOpen={isRebaseModalOpen}
        onClose={() => setIsRebaseModalOpen(false)}
        onSuccess={loadAllData}
      />

      {/* Government Footer */}
      <footer className="bg-navy-900 text-slate-400 border-t border-slate-800 text-xs py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-200">VayuIndex — Airfare Price Index Prototype</p>
            <p className="text-[11px] mt-0.5 text-slate-400">
              Smart India Hackathon SIH26056 Prototype • Ministry of Statistics and Programme Implementation (MoSPI) / DIID
            </p>
          </div>
          <div className="text-[11px] text-center md:text-right text-slate-400">
            <p>VayuIndex is a proposed SIH prototype and does not replace CPI.</p>
            <p className="mt-0.5">Built with Python, FastAPI, SQLAlchemy, React, TypeScript & Tailwind CSS.</p>
          </div>
        </div>
      </footer>

    </div>
  );
};
