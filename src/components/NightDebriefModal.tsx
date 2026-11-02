'use client';

import React, { useState } from 'react';
import { Moon, Sparkles, CheckCircle2, RotateCcw, ArrowRight, Shield, Zap, X } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Task {
  id: string;
  title: string;
  category: string;
  target_date: string;
  is_completed: boolean;
}

interface NightDebriefProps {
  isOpen: boolean;
  onClose: () => void;
  pendingTasks: Task[];
  completedCount: number;
  totalCount: number;
  todayBikeSaved: number;
  todayKharcha: number;
  streakCount: number;
  streakShields: number;
  onRolloverTasksToTomorrow: () => Promise<void>;
  onUseStreakShield: () => void;
}

export const NightDebriefModal: React.FC<NightDebriefProps> = ({
  isOpen,
  onClose,
  pendingTasks,
  completedCount,
  totalCount,
  todayBikeSaved,
  todayKharcha,
  streakCount,
  streakShields,
  onRolloverTasksToTomorrow,
  onUseStreakShield,
}) => {
  const [isRollingOver, setIsRollingOver] = useState(false);
  const [shieldUsed, setShieldUsed] = useState(false);

  if (!isOpen) return null;

  const handleRollover = async () => {
    setIsRollingOver(true);
    try {
      await onRolloverTasksToTomorrow();
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
      onClose();
    } finally {
      setIsRollingOver(false);
    }
  };

  const handleProtectStreak = () => {
    if (streakShields <= 0 || shieldUsed) return;
    onUseStreakShield();
    setShieldUsed(true);
    confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
  };

  const isAllDone = pendingTasks.length === 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 animate-in zoom-in-95 duration-200 select-none">
      <div className="w-full max-w-sm bg-gradient-to-b from-neutral-900 to-neutral-950 border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4">
        
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Moon className="w-4 h-4 fill-indigo-400/20" />
            </div>
            <div>
              <span className="text-[9px] font-mono tracking-widest text-indigo-400 uppercase font-bold block">
                Daily Cockpit Close
              </span>
              <h3 className="text-sm font-black text-white">Night Debrief & Auto-Planner</h3>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Today's Scorecard */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-neutral-950/80 border border-white/5 rounded-2xl p-3 space-y-1">
            <span className="text-[10px] text-neutral-400 font-medium">Routine Progress</span>
            <div className="text-base font-black text-white font-mono flex items-center gap-1.5">
              {completedCount}/{totalCount} <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <span className="text-[9px] text-neutral-500 font-mono">
              {isAllDone ? '100% Cleared!' : `${pendingTasks.length} Pending`}
            </span>
          </div>

          <div className="bg-neutral-950/80 border border-white/5 rounded-2xl p-3 space-y-1">
            <span className="text-[10px] text-neutral-400 font-medium">Today's Inflow/Out</span>
            <div className="text-xs font-black font-mono space-y-0.5">
              <div className="text-emerald-400">+₹{todayBikeSaved} Saved</div>
              <div className="text-amber-400">-₹{todayKharcha} Spent</div>
            </div>
          </div>
        </div>

        {/* 🛡️ Streak Insurance Status */}
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-400" />
            <div>
              <h4 className="text-xs font-bold text-white flex items-center gap-1">
                Streak Shield ({streakShields} Available)
              </h4>
              <p className="text-[10px] text-neutral-400">
                {streakShields > 0 ? 'Emergency freeze protection active' : 'Grind 7 days to earn +1 shield'}
              </p>
            </div>
          </div>

          {!isAllDone && streakShields > 0 && !shieldUsed && (
            <button
              onClick={handleProtectStreak}
              className="px-2.5 py-1.5 rounded-xl bg-amber-500 text-black text-[10px] font-black active:scale-95 transition"
            >
              Use Shield
            </button>
          )}

          {shieldUsed && (
            <span className="text-[10px] font-bold text-emerald-400 font-mono">Protected ✓</span>
          )}
        </div>

        {/* Pending Rollover Preview */}
        {!isAllDone ? (
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block px-1">
              Kal Ka Auto-Planner ({pendingTasks.length} Carry-Forward)
            </span>
            <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
              {pendingTasks.map((t) => (
                <div
                  key={t.id}
                  className="bg-black/40 border border-white/5 rounded-xl px-2.5 py-1.5 text-[11px] text-neutral-300 flex items-center justify-between"
                >
                  <span className="truncate flex-1 mr-2">{t.title}</span>
                  <span className="text-[9px] text-amber-400 font-mono flex items-center gap-0.5">
                    <ArrowRight className="w-2.5 h-2.5" /> Kal Subah
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={handleRollover}
              disabled={isRollingOver}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs py-2.5 rounded-2xl flex items-center justify-center gap-1.5 active:scale-95 transition shadow-lg shadow-indigo-600/20"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Shift to Tomorrow & Close Day
            </button>
          </div>
        ) : (
          <div className="text-center py-4 bg-black/40 border border-emerald-500/20 rounded-2xl space-y-1">
            <Sparkles className="w-5 h-5 text-emerald-400 mx-auto" />
            <h4 className="text-xs font-bold text-white">Full Day Complete!</h4>
            <p className="text-[10px] text-neutral-400">Streak secure hai. Screen band karo aur rest lo!</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full text-center text-[11px] text-neutral-500 hover:text-neutral-300 py-1"
        >
          Dismiss Cockpit
        </button>
      </div>
    </div>
  );
};