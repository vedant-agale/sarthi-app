'use client';

import React, { useMemo } from 'react';
import { Sparkles, AlertTriangle, Clock, Shield, Zap } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  category: string;
  target_date: string;
  is_completed: boolean;
  carry_forward_count?: number;
}

interface KhaataRecord {
  id: string;
  person_name: string;
  amount: number;
  type: 'lena' | 'dena';
  due_date?: string | null;
  note?: string | null;
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

    // Filter out Kharcha records from Overdue Udhaar
    const overdueKhaata = khaataRecords.filter(
      r => !r.note?.startsWith('[KHARCHA]') && r.due_date && r.due_date < todayStr && !r.is_settled
    );

    // 🎮 RPG XP & Level Calculation
    let rawXp = naamJapCount; // +1 XP per jap
    let penaltyXp = 0;

    tasks.forEach(t => {
      if (t.is_completed) {
        const cat = t.category.toLowerCase();
        if (cat.includes('leetcode') || cat.includes('github')) rawXp += 50;
        else if (cat.includes('naam_jap')) rawXp += 100;
        else rawXp += 20;
      } else if (t.carry_forward_count && t.carry_forward_count > 0) {
        penaltyXp += t.carry_forward_count * 25;
      }
    });

    const netXp = Math.max(0, rawXp - penaltyXp);
    const level = Math.floor(netXp / 250) + 1;
    const currentLevelXp = netXp % 250;
    const xpProgress = Math.min(100, Math.round((currentLevelXp / 250) * 100));

    let rankTitle = 'Initiate Grinder';
    if (level >= 10) rankTitle = 'SARTHI Sovereign';
    else if (level >= 6) rankTitle = 'Discipline Monk';
    else if (level >= 3) rankTitle = 'Code Ronin';

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
      level,
      rankTitle,
      netXp,
      currentLevelXp,
      xpProgress,
      penaltyXp,
    };
  }, [tasks, khaataRecords, todayStr, naamJapCount]);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-neutral-900/90 via-neutral-900/70 to-neutral-950 border border-white/10 rounded-3xl p-4 shadow-xl backdrop-blur-xl space-y-3">
      <div
        className={`absolute -right-12 -top-12 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20 ${
          intel.mood === 'warning'
            ? 'bg-amber-500'
            : intel.mood === 'success'
            ? 'bg-emerald-500'
            : 'bg-blue-500'
        }`}
      />

      {/* 🎮 Top RPG Level & XP Bar */}
      <div className="bg-black/50 border border-white/5 rounded-2xl p-2.5 space-y-1.5">
        <div className="flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md bg-amber-500 text-black font-black font-mono text-[10px]">
              LVL {intel.level}
            </span>
            <span className="font-bold text-white flex items-center gap-1">
              <Shield className="w-3 h-3 text-amber-400" /> {intel.rankTitle}
            </span>
          </div>
          <div className="flex items-center gap-1.5 font-mono text-[10px]">
            {intel.penaltyXp > 0 && (
              <span className="text-rose-400 font-bold" title="Carry-forward overdue penalty">
                -{intel.penaltyXp} XP
              </span>
            )}
            <span className="text-amber-400 font-bold flex items-center gap-0.5">
              <Zap className="w-3 h-3 fill-amber-400" /> {intel.currentLevelXp}/250 XP
            </span>
          </div>
        </div>
        <div className="w-full h-1.5 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${intel.xpProgress}%` }}
          />
        </div>
      </div>

      {/* Header & Badges */}
      <div className="flex items-center justify-between">
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

      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[11px] font-mono text-neutral-400">
        <span>Naam Jap: <strong className="text-white">{intel.japProgress}/108</strong></span>
        <span>•</span>
        <span>Total XP: <strong className="text-emerald-400">{intel.netXp}</strong></span>
        <span>•</span>
        <span>Overdue: <strong className={intel.totalOverdueAmount > 0 ? "text-rose-400" : "text-neutral-400"}>₹{intel.totalOverdueAmount}</strong></span>
      </div>
    </div>
  );
};