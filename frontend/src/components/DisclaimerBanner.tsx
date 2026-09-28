import React from 'react';
import { AlertTriangle, Info } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-900 px-4 py-2.5 text-xs">
      <div className="max-w-7xl mx-auto flex items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
          <p className="leading-snug">
            <span className="font-semibold text-amber-950">IMPORTANT COMPLIANCE NOTICE:</span>{" "}
            Prototype uses controlled/simulated source data for demonstration. Real-source adapters must comply with each website’s robots.txt, terms, and rate limits.{" "}
            <span className="font-semibold underline">VayuIndex is a proposed SIH prototype and does not replace CPI.</span>
          </p>
        </div>
        <div className="hidden md:flex items-center gap-1 text-amber-800 bg-amber-100 px-2 py-0.5 rounded text-[11px] font-medium flex-shrink-0">
          <Info className="h-3.5 w-3.5" />
          <span>Potential complement to CPI-related analysis</span>
        </div>
      </div>
    </div>
  );
};
