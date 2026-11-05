'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Maximize2, 
  Minimize2, 
  Flame, 
  Shield, 
  Check, 
  Heart, 
  Code2, 
  GitBranch, 
  Sparkles,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Task {
  id: string;
  title: string;
  category: string;
  target_date: string;
  due_time?: string | null;
  is_completed: boolean;
  completed_at?: string | null;
  carry_forward_count: number;
}

interface DeskHudProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  todayStr: string;
  japCount: number;
  streakCount: number;
  streakShields: number;
  totalBikeSaved: number;
  onToggleTask: (task: Task) => void | Promise<void>;
  onIncrementJap: () => void;
}

export const DeskHudModal: React.FC<DeskHudProps> = ({
  isOpen,
  onClose,
  tasks,
  todayStr,
  japCount,
  streakCount,
  streakShields,
  totalBikeSaved,
  onToggleTask,
  onIncrementJap,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Live Clock Ticker
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // Screen WakeLock API: Phone ya Laptop ki screen band hone se rokega
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator && isOpen) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch {
        // Fallback if browser denies WakeLock
      }
    };

    if (isOpen) {
      requestWakeLock();
    }

    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
    };
  }, [isOpen]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!isOpen) return null;

  // Filter Tasks
  const todayTasks = tasks.filter(t => t.target_date === todayStr);
  const pendingTasks = todayTasks.filter(t => !t.is_completed);
  const completedTasks = todayTasks.filter(t => t.is_completed);
  const topFocusTask = pendingTasks[0] || null;

  const leetcodeDone = todayTasks.some(t => t.category.toLowerCase().includes('leetcode') && t.is_completed);
  const githubDone = todayTasks.some(t => t.category.toLowerCase().includes('github') && t.is_completed);

  // Formatting Time
  const hours = String(currentTime.getHours()).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentTime.getSeconds()).padStart(2, '0');
  const dateFormatted = currentTime.toLocaleDateString('en-IN', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between p-6 sm:p-10 select-none animate-in fade-in duration-300">
      
      {/* Top Telemetry Bar */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-white/10 text-xs font-mono font-bold text-amber-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            STANDBY HUD
          </span>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-white/10 text-xs font-mono">
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500" />
            <span className="font-bold text-white">{completedTasks.length}/{todayTasks.length} Done</span>
            {streakShields > 0 && (
              <span className="flex items-center gap-0.5 text-amber-400 font-bold ml-1">
                • <Shield className="w-3 h-3 fill-amber-400/20" /> {streakShields}
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-2xl bg-neutral-900 border border-white/10 text-neutral-400 hover:text-white transition active:scale-95"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-2.5 rounded-2xl bg-neutral-900 border border-white/10 text-neutral-400 hover:text-white transition active:scale-95"
            title="Exit HUD"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Centerpiece: Massive Minimalist Clock */}
      <div className="flex flex-col items-center justify-center my-auto space-y-4">
        <div className="flex items-baseline font-mono tracking-tighter">
          <span className="text-7xl sm:text-9xl font-black text-white drop-shadow-[0_0_35px_rgba(255,255,255,0.15)]">
            {hours}:{minutes}
          </span>
          <span className="text-2xl sm:text-4xl font-bold text-neutral-500 ml-2 sm:ml-4">
            :{seconds}
          </span>
        </div>

        <p className="text-sm sm:text-base font-medium tracking-widest uppercase text-neutral-400 font-mono">
          {dateFormatted}
        </p>
      </div>

      {/* Bottom Focus Anchor & Live Quick Actions */}
      <div className="w-full max-w-2xl mx-auto space-y-4">
        
        {/* Next #1 Priority Task Banner */}
        {topFocusTask ? (
          <div 
            onClick={() => {
              onToggleTask(topFocusTask);
              confetti({ particleCount: 70, spread: 60, origin: { y: 0.8 } });
            }}
            className="group cursor-pointer bg-neutral-900/80 hover:bg-neutral-900 border border-white/10 hover:border-amber-500/40 p-4 rounded-3xl transition-all duration-300 flex items-center justify-between shadow-2xl active:scale-[0.99]"
          >
            <div className="flex items-center gap-3.5 min-w-0 flex-1 mr-3">
              <div className="w-7 h-7 rounded-full border-2 border-neutral-600 group-hover:border-amber-400 flex items-center justify-center transition shrink-0">
                <Check className="w-4 h-4 text-transparent group-hover:text-amber-400 stroke-[3] transition" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase tracking-wider font-mono text-amber-400 font-bold block">
                  Next Priority Task
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white truncate">
                  {topFocusTask.title.replace(/^\[(IDEA|SHOOT|EDIT|READY)\]\s*/i, '')}
                </h4>
              </div>
            </div>

            <span className="text-[11px] font-mono px-3 py-1 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold shrink-0">
              Tap to Complete
            </span>
          </div>
        ) : (
          <div className="bg-neutral-900/40 border border-emerald-500/20 p-3.5 rounded-3xl text-center flex items-center justify-center gap-2 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4" /> All tasks cleared for today! Cockpit optimal.
          </div>
        )}

        {/* Quick Micro-Telemetry Grid */}
        <div className="grid grid-cols-4 gap-2 text-xs font-mono">
          
          {/* Naam Jap */}
          <div 
            onClick={onIncrementJap}
            className="bg-neutral-900/60 border border-white/5 hover:border-rose-500/30 p-2.5 rounded-2xl flex flex-col items-center justify-center cursor-pointer active:scale-95 transition"
            title="Tap to +1 Jap"
          >
            <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
              <Heart className="w-3 h-3 fill-rose-500/20" /> Jap
            </span>
            <span className="font-bold text-white mt-0.5">{japCount}/108</span>
          </div>

          {/* LeetCode */}
          <div className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center transition ${
            leetcodeDone 
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
              : 'bg-neutral-900/60 border-white/5 text-neutral-400'
          }`}>
            <span className="text-[10px] font-bold flex items-center gap-1">
              <Code2 className="w-3 h-3" /> LeetCode
            </span>
            <span className="font-bold mt-0.5">{leetcodeDone ? 'Done ✓' : 'Pending'}</span>
          </div>

          {/* GitHub */}
          <div className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center transition ${
            githubDone 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
              : 'bg-neutral-900/60 border-white/5 text-neutral-400'
          }`}>
            <span className="text-[10px] font-bold flex items-center gap-1">
              <GitBranch className="w-3 h-3" /> GitHub
            </span>
            <span className="font-bold mt-0.5">{githubDone ? 'Pushed ✓' : 'Pending'}</span>
          </div>

          {/* Bike Fund */}
          <div className="bg-neutral-900/60 border border-white/5 p-2.5 rounded-2xl flex flex-col items-center justify-center">
            <span className="text-[10px] text-amber-400 font-bold">🏍️ Bike Vault</span>
            <span className="font-bold text-white mt-0.5 truncate max-w-[70px]">₹{totalBikeSaved}</span>
          </div>

        </div>

      </div>
    </div>
  );
};