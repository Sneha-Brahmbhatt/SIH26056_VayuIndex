import React, { useState, useEffect } from 'react';
import { BarChart3, Upload, AlertCircle, CheckCircle, Info, FileSpreadsheet } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { apiClient } from '../api/client';
import { DGCAComparisonResponse } from '../types';

export const DGCABenchmarkTab: React.FC = () => {
  const [data, setData] = useState<DGCAComparisonResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadMsg, setUploadMsg] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchBenchmarkData = () => {
    setLoading(true);
    apiClient.getDGCABenchmark()
      .then(res => setData(res))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchBenchmarkData();
  }, []);

  const handleFileUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadMsg(null);
    apiClient.uploadDGCACSV(selectedFile)
      .then(res => {
        setUploadMsg(res.message);
        fetchBenchmarkData();
      })
      .catch(err => setUploadMsg("Error uploading CSV. Check column headers: route, month, average_fare_inr, source_url, notes."))
      .finally(() => setUploading(false));
  };

  const chartData = data?.benchmarks.map(b => ({
    label: `${b.route_name} (${b.year_month})`,
    dgcaFare: b.average_fare_inr
  })) || [];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-blue-600" />
          DGCA Official Average Fare Benchmark Panel
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Validation panel for benchmarking VayuIndex against officially published Director General of Civil Aviation (DGCA) monthly route statistics.
        </p>
      </div>

      {/* Mandatory Compliance Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-900 p-4 rounded-xl flex items-start gap-3 text-xs">
        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">BENCHMARK DISCLAIMER:</p>
          <p className="mt-0.5">
            {data?.notes || "DGCA benchmark requires manual upload/import of officially published data; VayuIndex does not claim DGCA endorsement."}
          </p>
        </div>
      </div>

      {/* Upload CSV Panel & Correlation Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CSV Upload Form */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm col-span-1 space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Upload className="h-4 w-4 text-blue-600" />
            Upload Official DGCA Monthly CSV
          </h3>
          
          <p className="text-xs text-slate-500">
            Select a CSV file containing columns: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[11px]">route, month, average_fare_inr, source_url, notes</code>
          </p>

          <form onSubmit={handleFileUpload} className="space-y-3">
            <input
              type="file"
              accept=".csv"
              onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs py-2 rounded-lg font-medium transition flex items-center justify-center gap-1.5"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>{uploading ? "Parsing & Validating..." : "Import DGCA Dataset"}</span>
            </button>
          </form>

          {uploadMsg && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700 font-mono">
              {uploadMsg}
            </div>
          )}
        </div>

        {/* Statistical Agreement & Metrics */}
        <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 shadow-sm col-span-2 flex flex-col justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
              Benchmarking Analysis
            </span>
            <h3 className="text-sm font-bold text-white mt-1">
              Statistical Agreement & Directional Correlation
            </h3>
            <p className="text-xs text-slate-300 mt-2">
              Metrics calculated between uploaded DGCA published route averages and VayuIndex monthly aggregates.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="text-slate-400 text-[10px] uppercase">Pearson Correlation (r)</div>
              <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-1">
                {data?.correlation !== null && data?.correlation !== undefined ? data.correlation : "N/A"}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">High co-movement alignment</div>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
              <div className="text-slate-400 text-[10px] uppercase">Directional Agreement %</div>
              <div className="text-3xl font-extrabold font-mono text-blue-400 mt-1">
                {data?.directional_agreement_pct !== null && data?.directional_agreement_pct !== undefined
                  ? `${data.directional_agreement_pct}%`
                  : "N/A"}
              </div>
              <div className="text-[10px] text-slate-400 mt-1">Same-sign monthly trajectory</div>
            </div>
          </div>
        </div>

      </div>

      {/* DGCA Data Visualization Chart */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4">
          Uploaded DGCA Monthly Average Fares (INR)
        </h3>

        {chartData.length > 0 ? (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0F172A', color: '#FFF', borderRadius: '8px', fontSize: '12px' }}
                  formatter={(val: any) => [`₹${Number(val).toFixed(2)}`, 'DGCA Average Fare']}
                />
                <Bar dataKey="dgcaFare" fill="#1E3A8A" radius={[4, 4, 0, 0]} name="DGCA Average Fare (INR)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 text-xs bg-slate-50 rounded-lg border border-dashed border-slate-200">
            No official DGCA benchmark dataset uploaded yet. Use the upload panel above to import a CSV dataset.
          </div>
        )}
      </div>

    </div>
  );
};
