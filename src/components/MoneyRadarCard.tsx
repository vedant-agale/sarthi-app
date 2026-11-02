'use client';

import React, { useState } from 'react';
import { TrendingUp, AlertTriangle, ShieldCheck, Calendar, Infinity } from 'lucide-react';

interface MoneyRadarProps {
  currentMonthName: string;
  monthBikeSaved: number;
  monthKharcha: number;
  monthLena: number;
  monthDena: number;
  allTimeBikeSaved: number;
  allTimeKharcha: number;
  allTimeLena: number;
  allTimeDena: number;
}

export const MoneyRadarCard: React.FC<MoneyRadarProps> = ({
  currentMonthName,
  monthBikeSaved,
  monthKharcha,
  monthLena,
  monthDena,
  allTimeBikeSaved,
  allTimeKharcha,
  allTimeLena,
  allTimeDena,
}) => {
  const [viewMode, setViewMode] = useState<'month' | 'all'>('month');

  const bikeSaved = viewMode === 'month' ? monthBikeSaved : allTimeBikeSaved;
  const kharcha = viewMode === 'month' ? monthKharcha : allTimeKharcha;
  const lena = viewMode === 'month' ? monthLena : allTimeLena;
  const dena = viewMode === 'month' ? monthDena : allTimeDena;

  const totalOutflow = bikeSaved + kharcha;
  const saveRatio = totalOutflow > 0 ? Math.round((bikeSaved / totalOutflow) * 100) : 50;
  const spendRatio = totalOutflow > 0 ? 100 - saveRatio : 50;

  const isOverspending = kharcha > bikeSaved && kharcha > 0;
  const netPosition = lena - dena;

  return (
    <div className="bg-neutral-900/70 border border-white/10 rounded-3xl p-4 space-y-3.5 shadow-lg select-none">
      {/* Top Header & Toggle */}
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

        {/* 1-Tap Toggle: Is Mahine vs All Time */}
        <div className="flex items-center bg-black/60 border border-white/10 rounded-xl p-0.5 text-[10px] font-mono">
          <button
            type="button"
            onClick={() => setViewMode('month')}
            className={`px-2 py-1 rounded-lg transition font-bold flex items-center gap-1 ${
              viewMode === 'month'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3 h-3" /> {currentMonthName}
          </button>
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-2 py-1 rounded-lg transition font-bold flex items-center gap-1 ${
              viewMode === 'all'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Infinity className="w-3 h-3" /> All
          </button>
        </div>
      </div>

      {/* Comparison Bar: Bike Saving vs Kharcha */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-mono">
          <span className="text-emerald-400 font-bold">
            🏍️ Bike Gullak: ₹{bikeSaved.toLocaleString('en-IN')} ({saveRatio}%)
          </span>
          <span className="text-amber-400 font-bold">
            💸 Kharcha: ₹{kharcha.toLocaleString('en-IN')} ({spendRatio}%)
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

        <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 pt-0.5">
          <span>Mode: <strong className="text-neutral-200">{viewMode === 'month' ? `Naya Mahina (${currentMonthName})` : 'Lifetime Ledger'}</strong></span>
          <span className={netPosition >= 0 ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
            Net Udhaar: {netPosition >= 0 ? `+₹${netPosition}` : `-₹${Math.abs(netPosition)}`}
          </span>
        </div>
      </div>

      {/* Smart Assistant Monthly Insight */}
      <p className="text-[11px] text-neutral-300 leading-relaxed bg-black/40 border border-white/5 rounded-2xl p-2.5">
        {totalOutflow === 0 ? (
          `💡 Naya Mahina (${currentMonthName}) start ho gaya hai! Is mahine ka pehla kharcha ya Bike saving log karo.`
        ) : isOverspending ? (
          `🚨 ${viewMode === 'month' ? 'Is Mahine' : 'Overall'}: Kharcha (₹${kharcha}) Bike saving se ₹${kharcha - bikeSaved} zyada ho chuka hai. Pocket control karo!`
        ) : (
          `🔥 Solid control! ${viewMode === 'month' ? 'Is mahine' : 'Ab tak'} ka ${saveRatio}% outflow seedha Dream Bike fund me gaya hai.`
        )}
      </p>
    </div>
  );
};