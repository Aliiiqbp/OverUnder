import React from 'react';
import { StockReportData, StockMetric } from '../types';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Star } from 'lucide-react';

interface StockReportProps {
  data: StockReportData;
}

const SignalIcon = ({ signal }: { signal: StockMetric['signal'] }) => {
  if (signal === 'undervalued') return <TrendingUp className="w-5 h-5 text-emerald-400" />;
  if (signal === 'overvalued') return <TrendingDown className="w-5 h-5 text-red-400" />;
  return <Minus className="w-5 h-5 text-gray-400" />;
};

const SignalBadge = ({ signal }: { signal: StockMetric['signal'] }) => {
  const styles = {
    undervalued: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    overvalued: "bg-red-500/10 text-red-400 border-red-500/20",
    neutral: "bg-gray-500/10 text-gray-400 border-gray-500/20",
  };
  return (
    <span className={`text-xs px-2 py-1 rounded-full border ${styles[signal]} uppercase font-bold tracking-wider`}>
      {signal}
    </span>
  );
};

// Helper to parse numbers from strings like "$150.20", "25.4x", "12%"
const parseValue = (val: string | number): number => {
  if (typeof val === 'number') return val;
  const clean = val.toString().replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return clean ? parseFloat(clean[0]) : 0;
};

const MetricRangeBar: React.FC<{ metric: StockMetric }> = ({ metric }) => {
  const stockVal = parseValue(metric.value);
  const benchVal = parseValue(metric.benchmark);
  
  // Heuristic: If parsing failed (result is 0) and the original string didn't look like 0, don't show bar.
  const isValid = (stockVal !== 0 || metric.value.toString().includes('0')) && 
                  (benchVal !== 0 || metric.benchmark.toString().includes('0'));

  if (!isValid) {
    // Fallback card if we can't parse numbers
    return (
      <div className="bg-slate-700/30 rounded-lg p-4 mb-4 border border-slate-700/50">
         <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <SignalIcon signal={metric.signal} />
              <span className="font-semibold text-slate-200">{metric.label}</span>
            </div>
            <SignalBadge signal={metric.signal} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div><span className="text-xs text-slate-500">Value</span><div className="text-lg font-mono text-white">{metric.value}</div></div>
             <div className="text-right"><span className="text-xs text-slate-500">Benchmark</span><div className="text-sm font-mono text-slate-300">{metric.benchmark}</div></div>
          </div>
          <p className="text-xs text-slate-400 italic mt-2 border-t border-slate-700/50 pt-2">"{metric.explanation}"</p>
      </div>
    );
  }

  // Determine Scale
  // We want the benchmark to sit roughly in the middle-ish, or allow space for the stock value.
  // Max scale is usually larger of the two values * 1.5 padding
  const maxScale = Math.max(stockVal, benchVal) * 1.5 || 10;
  
  // Calculate percentages (clamped 0-100)
  const stockPct = Math.min(Math.max((stockVal / maxScale) * 100, 0), 100);
  const benchPct = Math.min(Math.max((benchVal / maxScale) * 100, 0), 100);

  // Colors
  // Most metrics (P/E, PEG, P/B): Lower is Green (Undervalued), Higher is Red (Overvalued).
  // Some metrics (Yield, Margins): Higher is Green.
  const isInverse = ['dividend', 'yield', 'margin', 'growth'].some(k => metric.label.toLowerCase().includes(k));

  // Gradient: 
  // Standard: Green -> Grey -> Red
  // Inverse: Red -> Grey -> Green
  const gradientClass = isInverse
    ? "bg-gradient-to-r from-red-500/20 via-slate-500/20 to-emerald-500/20"
    : "bg-gradient-to-r from-emerald-500/20 via-slate-500/20 to-red-500/20";
    
  return (
    <div className="bg-slate-900/40 rounded-xl p-5 border border-slate-700/50 mb-4 hover:border-slate-600 transition-colors">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {/* We rely on the signal badge for the explicit call, icon adds flavor */}
          <SignalIcon signal={metric.signal} />
          <span className="font-bold text-slate-100">{metric.label}</span>
        </div>
        <SignalBadge signal={metric.signal} />
      </div>

      <div className="flex justify-between text-sm mb-1 px-0.5">
         <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">Company Value</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-white"></div>
              <span className="text-xl font-bold font-mono text-white">{metric.value}</span>
            </div>
         </div>
         <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-0.5">Industry Avg</span>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-mono text-blue-400">{metric.benchmark}</span>
              <div className="w-0.5 h-3 bg-blue-400"></div>
            </div>
         </div>
      </div>

      {/* Visualization Bar */}
      <div className="relative h-6 w-full mt-3 mb-2">
        {/* Background Track with Gradient Zones */}
        <div className={`absolute inset-0 rounded-md ${gradientClass} border border-white/5`}></div>

        {/* Benchmark Marker (Line) - Now Blue */}
        <div 
           className="absolute top-[-4px] bottom-[-4px] w-0.5 bg-blue-400 z-10 flex flex-col items-center justify-end group shadow-[0_0_8px_rgba(96,165,250,0.6)]"
           style={{ left: `${benchPct}%` }}
        >
        </div>

        {/* Stock Value Marker (Pip) - White */}
        <div 
          className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.3)] z-20 border-2 border-slate-800 transition-all duration-1000 ease-out`}
          style={{ left: `calc(${stockPct}% - 8px)` }}
        >
        </div>
      </div>
      
      <div className="flex justify-between text-[10px] text-slate-600 font-mono mt-1">
         <span>0</span>
         <span>{Math.round(maxScale)}</span>
      </div>

      <p className="text-xs text-slate-400 italic mt-3 border-t border-slate-700/50 pt-3 leading-relaxed">
        "{metric.explanation}"
      </p>
    </div>
  );
};

export const StockReport: React.FC<StockReportProps> = ({ data }) => {
  // Calculate stars (0-5) based on confidence score (0-100)
  const totalStars = 5;
  const starCount = Math.max(0, Math.min(5, Math.round((data.confidenceScore / 100) * totalStars)));

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-2xl my-4 animate-fade-in">
      {/* Header */}
      <div className="bg-slate-900/50 p-6 border-b border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-baseline gap-3">
            <h2 className="text-3xl font-bold text-white">{data.symbol}</h2>
            <span className="text-xl text-slate-400">{data.companyName}</span>
          </div>
          <div className="text-2xl font-mono text-blue-400 mt-1">{data.currentPrice}</div>
        </div>
        
        <div className="flex flex-col items-end">
           <div className={`text-lg font-bold px-4 py-2 rounded-lg border mb-2
             ${data.valuationStatus === 'Undervalued' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 
               data.valuationStatus === 'Overvalued' ? 'bg-red-500/20 border-red-500 text-red-400' : 
               'bg-yellow-500/20 border-yellow-500 text-yellow-400'}`}>
             {data.valuationStatus}
           </div>
           <span className="text-slate-400 text-sm">Recommendation: <span className="font-semibold text-white">{data.recommendation}</span></span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Summary & Confidence */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/50 rounded-lg p-6 border border-slate-700 flex flex-col items-center text-center">
            <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-4">Confidence</h3>
            <div className="flex gap-1.5 mb-2">
              {[...Array(totalStars)].map((_, index) => (
                <Star 
                  key={index} 
                  className={`w-8 h-8 ${index < starCount ? "text-yellow-400 fill-yellow-400" : "text-slate-700 fill-slate-700/50"}`} 
                />
              ))}
            </div>
            <p className="text-xs text-slate-500">Based on available market data</p>
          </div>

          <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
            <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">Summary</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{data.summary}</p>
          </div>

          {data.riskFactors && data.riskFactors.length > 0 && (
             <div className="bg-red-900/10 rounded-lg p-4 border border-red-900/30">
               <div className="flex items-center gap-2 mb-2">
                 <AlertTriangle className="w-4 h-4 text-red-400" />
                 <h3 className="text-red-400 text-sm font-semibold uppercase tracking-wider">Risk Factors</h3>
               </div>
               <ul className="list-disc list-inside text-sm text-slate-300 space-y-1">
                 {data.riskFactors.map((risk, idx) => (
                   <li key={idx}>{risk}</li>
                 ))}
               </ul>
             </div>
          )}
        </div>

        {/* Right Column: Detailed Metrics with Visual Bars */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-slate-400 text-sm font-semibold uppercase tracking-wider">Valuation Indicators</h3>
            <div className="flex items-center gap-4 text-[10px] md:text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white border border-slate-700"></div>
                <span className="text-white font-medium">Company</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-0.5 h-3.5 bg-blue-400"></div>
                <span className="text-blue-400 font-medium">Industry Avg</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            {data.metrics.map((metric, index) => (
              <MetricRangeBar key={index} metric={metric} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};