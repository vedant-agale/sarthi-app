'use client';

import React, { useState, useEffect } from 'react';
import { Flame, Plus, Settings2, Check, Sparkles, TrendingUp, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BikeSavingLog {
  id: string;
  title: string;
  amount: number;
  date?: string | null;
}

interface BikeVaultProps {
  logs: BikeSavingLog[];
  onAddSaving: (amount: number, note: string) => Promise<void>;
  onDeleteSaving: (id: string) => Promise<void>;
}

export const BikeVaultCard: React.FC<BikeVaultProps> = ({
  logs,
  onAddSaving,
  onDeleteSaving,
}) => {
  const [bikeName, setBikeName] = useState('Dream Bike 🏍️');
  const [targetPrice, setTargetPrice] = useState(220000);
  const [isEditingGoal, setIsEditingGoal] = useState(false);

  const [amountInput, setAmountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedName = localStorage.getItem('sarthi_bike_name');
      const savedTarget = localStorage.getItem('sarthi_bike_target');
      if (savedName) setBikeName(savedName);
      if (savedTarget) setTargetPrice(Number(savedTarget));
    }
  }, []);

  const saveGoalSettings = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sarthi_bike_name', bikeName);
      localStorage.setItem('sarthi_bike_target', String(targetPrice));
    }
    setIsEditingGoal(false);
  };

  const totalSaved = logs.reduce((acc, cur) => acc + Number(cur.amount), 0);
  const remaining = Math.max(0, targetPrice - totalSaved);
  const progress = targetPrice > 0 ? Math.min(100, (totalSaved / targetPrice) * 100) : 0;

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amountInput);
    if (isNaN(val) || val <= 0) return;

    confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    await onAddSaving(val, noteInput.trim() || 'Bike Gullak Deposit');
    setAmountInput('');
    setNoteInput('');
  };

  const handleQuickAdd = async (val: number) => {
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
    await onAddSaving(val, `Quick +₹${val} Deposit`);
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900 via-neutral-900/90 to-amber-950/30 border border-amber-500/30 rounded-3xl p-4 shadow-xl space-y-3.5">
      {/* Background Glow */}
      <div className="absolute -right-10 -top-10 w-28 h-28 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
            <Flame className="w-4 h-4 fill-amber-400" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-widest text-amber-400 block">
              Mission Garage Vault
            </span>
            <h3 className="text-sm font-black text-white">{bikeName}</h3>
          </div>
        </div>

        <button
          onClick={() => setIsEditingGoal(!isEditingGoal)}
          className="p-1.5 rounded-xl bg-white/5 border border-white/10 text-neutral-400 hover:text-white transition"
          title="Edit Bike Name & Target Price"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Edit Target Price Drawer */}
      {isEditingGoal && (
        <div className="bg-black/70 border border-white/10 rounded-2xl p-3 space-y-2 text-xs animate-in fade-in">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">Bike Model Name</label>
              <input
                type="text"
                value={bikeName}
                onChange={(e) => setBikeName(e.target.value)}
                className="w-full bg-neutral-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-neutral-400 block mb-1">On-Road Target (₹)</label>
              <input
                type="number"
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value) || 0)}
                className="w-full bg-neutral-900 border border-white/10 rounded-xl px-2.5 py-1.5 text-white font-mono focus:outline-none"
              />
            </div>
          </div>
          <button
            onClick={saveGoalSettings}
            className="w-full bg-amber-500 text-black font-bold py-1.5 rounded-xl flex items-center justify-center gap-1"
          >
            <Check className="w-3.5 h-3.5" /> Save Target
          </button>
        </div>
      )}

      {/* Numbers & Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-xl font-black font-mono text-emerald-400">
              ₹{totalSaved.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-neutral-400 font-mono ml-1">
              / ₹{targetPrice.toLocaleString('en-IN')}
            </span>
          </div>
          <span className="text-xs font-black font-mono text-amber-400">
            {progress.toFixed(1)}%
          </span>
        </div>

        <div className="w-full h-2.5 bg-black/60 rounded-full overflow-hidden border border-white/5 p-0.5">
          <div
            className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400 pt-0.5">
          <span>
            Remaining: <strong className="text-white">₹{remaining.toLocaleString('en-IN')}</strong>
          </span>
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="text-amber-400 hover:underline flex items-center gap-1"
          >
            <TrendingUp className="w-3 h-3" /> {logs.length} Deposits {showHistory ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Quick Deposit Chips */}
      <div className="flex items-center gap-1.5 pt-1">
        <span className="text-[10px] text-neutral-400 font-semibold mr-1">Quick Add:</span>
        {[500, 1000, 2000, 5000].map((amt) => (
          <button
            key={amt}
            type="button"
            onClick={() => handleQuickAdd(amt)}
            className="px-2 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold active:scale-95 transition"
          >
            +₹{amt}
          </button>
        ))}
      </div>

      {/* Custom Deposit Form */}
      <form onSubmit={handleDeposit} className="flex gap-1.5">
        <input
          type="number"
          placeholder="₹ Amount..."
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          className="w-28 bg-black/60 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
        />
        <input
          type="text"
          placeholder="Source (e.g. Editing gig, Pocket money)..."
          value={noteInput}
          onChange={(e) => setNoteInput(e.target.value)}
          className="flex-1 bg-black/60 border border-white/10 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
        />
        <button
          type="submit"
          className="bg-amber-500 hover:bg-amber-400 text-black font-black px-3 rounded-xl text-xs flex items-center justify-center active:scale-95 transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
        </button>
      </form>

      {/* Deposit History Drawer */}
      {showHistory && (
        <div className="space-y-1.5 pt-2 border-t border-white/10 max-h-40 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-[10px] text-neutral-500 text-center py-2">
              Abhi tak koi saving add nahi ki. Shuruat karo!
            </p>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between bg-black/40 border border-white/5 px-2.5 py-1.5 rounded-xl text-[11px]"
              >
                <div className="truncate pr-2">
                  <span className="font-bold text-emerald-400 font-mono">+₹{log.amount}</span>
                  <span className="text-neutral-300 ml-2">{log.title}</span>
                  {log.date && <span className="text-[9px] text-neutral-500 ml-1.5">({log.date})</span>}
                </div>
                <button
                  onClick={() => onDeleteSaving(log.id)}
                  className="text-neutral-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};