'use client';

import React, { useMemo } from 'react';
import { Sparkles, AlertTriangle, Clock } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  category: string;
  target_date: string;
  is_completed: boolean;
}

interface KhaataRecord {
  id: string;
  person_name: string;
  amount: number;
  type: 'lena' | 'dena';
  due_date?: string | null;
  is_settled: boolean;
}

interface DailyIntelProps {
  tasks: Task[];
  khaataRecords: KhaataRecord[];
  todayStr: string;
  naamJapCount?: number;
}

export const DailyIntelCard: React.FC<DailyIntelProps> = ({
  tasks,
  khaataRecords,
  todayStr,
  naamJapCount = 0,
}) => {
  const intel = useMemo(() => {
    const hour = new Date().getHours();
    const todayTasks = tasks.filter(t => t.target_date === todayStr);
    const pendingTasks = todayTasks.filter(t => !t.is_completed);
    const completedTasks = todayTasks.filter(t => t.is_completed);

    const leetcodeDone = todayTasks.some(
      t => t.category.toLowerCase().includes('leetcode') && t.is_completed
    );
    const githubDone = todayTasks.some(
      t => t.category.toLowerCase().includes('github') && t.is_completed
    );
    const overdueKhaata = khaataRecords.filter(
      r => r.due_date && r.due_date < todayStr && !r.is_settled
    );

    let greeting = 'Suprabhat';
    let phaseTag = 'Morning Focus';
    let mood = 'neutral';
    let message = '';

    if (hour >= 5 && hour < 12) {
      greeting = 'Suprabhat Vedant!';
      phaseTag = 'Morning Intel';
      message =
        pendingTasks.length > 0
          ? `Aaj ke routine me ${pendingTasks.length} tasks lined up hain. Din fresh hai, pehle critical tasks niptao.`
          : 'Aaj ka routine sorted hai! Naye tasks schedule karo ya deep focus mode on karo.';
    } else if (hour >= 12 && hour < 17) {
      greeting = 'Mid-Day Sync';
      phaseTag = 'Afternoon Grind';
      message = `${completedTasks.length}/${todayTasks.length} tasks complete ho chuke hain. Momentum banaye rakhna!`;
    } else if (hour >= 17 && hour < 22) {
      greeting = 'Evening Review';
      phaseTag = 'Night Push';
      if (!leetcodeDone || !githubDone) {
        mood = 'warning';
        message = `Shaam ho gayi hai! ${!leetcodeDone ? 'LeetCode Daily ' : ''}${
          !githubDone ? 'GitHub Commit ' : ''
        }abhi pending hai. Streak drop mat hone dena!`;
      } else {
        mood = 'success';
        message = 'LeetCode aur GitHub streaks secured hain! Baki bache tasks wrap up karo.';
      }
    } else {
      greeting = 'Late Night Mode';
      phaseTag = 'Rest & Recharge';
      message = 'Aaj ka session close karne ka time ho gaya. Screen off karo aur kal ke liye recharge ho jao.';
    }

    return {
      greeting,
      phaseTag,
      message,
      mood,
      pendingCount: pendingTasks.length,
      overdueCount: overdueKhaata.length,
      totalOverdueAmount: overdueKhaata.reduce((acc, curr) => acc + Number(curr.amount), 0),
      japProgress: naamJapCount,
    };
  }, [tasks, khaataRecords, todayStr, naamJapCount]);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900/90 via-neutral-900/70 to-neutral-950 border border-white/10 rounded-3xl p-4 shadow-xl backdrop-blur-xl">
      <div
        className={`absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20 ${
          intel.mood === 'warning'
            ? 'bg-amber-500'
            : intel.mood === 'success'
            ? 'bg-emerald-500'
            : 'bg-blue-500'
        }`}
      />

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-[10px] font-black tracking-wider uppercase text-neutral-400">{intel.phaseTag}</h4>
            <h3 className="text-sm font-bold text-white leading-tight">{intel.greeting}</h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {intel.overdueCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400">
              <AlertTriangle className="w-3 h-3" />
              {intel.overdueCount} Overdue
            </span>
          )}
          <span className="flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-neutral-300">
            <Clock className="w-3 h-3 text-neutral-400" />
            {intel.pendingCount} Pending
          </span>
        </div>
      </div>

      <p className="text-xs text-neutral-300 leading-relaxed font-medium">
        {intel.message}
      </p>

      <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-white/5 text-[11px] font-mono text-neutral-400">
        <span>Naam Jap: <strong className="text-white">{intel.japProgress}/108</strong></span>
        <span>•</span>
        <span>Khaata Overdue: <strong className={intel.totalOverdueAmount > 0 ? "text-rose-400" : "text-neutral-400"}>₹{intel.totalOverdueAmount}</strong></span>
      </div>
    </div>
  );
};