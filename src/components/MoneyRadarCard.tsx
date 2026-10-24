'use client';

import React from 'react';
import { TrendingUp, AlertTriangle, ShieldCheck, Flame } from 'lucide-react';

interface MoneyRadarProps {
  totalBikeSaved: number;
  totalKharcha: number;
  totalLena: number;
  totalDena: number;
}

export const MoneyRadarCard: React.FC<MoneyRadarProps> = ({
  totalBikeSaved,
  totalKharcha,
  totalLena,
  totalDena,
}) => {
  const totalOutflow = totalBikeSaved + totalKharcha;
  const saveRatio = totalOutflow > 0 ? Math.round((totalBikeSaved / totalOutflow) * 100) : 50;
  const spendRatio = totalOutflow > 0 ? 100 - saveRatio : 50;

  const isOverspending = totalKharcha > totalBikeSaved && totalKharcha > 0;
  const netPosition = totalLena - totalDena;

  return (
    <div className="bg-neutral-900/70 border border-white/10 rounded-3xl p-4 space-y-3 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`p-1.5 rounded-xl border ${
            isOverspending 
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            {isOverspending ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-400 block">
              SARTHI Financial Radar
            </span>
            <h3 className="text-xs font-bold text-white">
              {isOverspending ? 'High Burn Alert ⚠️' : 'Healthy Wealth Flow ⚡'}
            </h3>
          </div>
        </div>

        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-lg border ${
          netPosition >= 0 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
        }`}>
          Net Udhaar: {netPosition >= 0 ? `+₹${netPosition}` : `-₹${Math.abs(netPosition)}`}
        </span>
      </div>

      {/* Dual Comparison Bar: Bike Saving vs Kharcha */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-mono">
          <span className="text-emerald-400 font-bold">
            🏍️ Bike Gullak: ₹{totalBikeSaved.toLocaleString('en-IN')} ({saveRatio}%)
          </span>
          <span className="text-amber-400 font-bold">
            💸 Kharcha: ₹{totalKharcha.toLocaleString('en-IN')} ({spendRatio}%)
          </span>
        </div>

        <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden flex border border-white/5 p-0.5 gap-0.5">
          <div
            className="h-full bg-emerald-500 rounded-l-full transition-all duration-500"
            style={{ width: `${saveRatio}%` }}
          />
          <div
            className="h-full bg-amber-500 rounded-r-full transition-all duration-500"
            style={{ width: `${spendRatio}%` }}
          />
        </div>
      </div>

      {/* Smart Assistant Verdict */}
      <p className="text-[11px] text-neutral-300 leading-relaxed bg-black/40 border border-white/5 rounded-2xl p-2.5">
        {totalOutflow === 0 ? (
          '💡 SARTHI Tip: Apna pehla Bike deposit ya daily kharcha log karo taaki cashflow radar active ho sake.'
        ) : isOverspending ? (
          `🚨 SARTHI Warning: Bhai, tera kharcha (₹${totalKharcha}) teri Bike Saving (₹${totalBikeSaved}) se ₹${totalKharcha - totalBikeSaved} zyada chal raha hai! Agla deposit Bike Gullak me daal.`
        ) : (
          `🔥 Shandaar! Tera ${saveRatio}% paisa seedha Dream Bike me ja raha hai. Is discipline se bike jaldi ghar aayegi!`
        )}
      </p>
    </div>
  );
};