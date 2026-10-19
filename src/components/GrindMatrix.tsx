'use client';

import React, { useMemo } from 'react';
import { Check, Flame, Trophy } from 'lucide-react';

interface Task {
  id: string;
  category: string;
  target_date: string;
  is_completed: boolean;
}

interface GrindMatrixProps {
  tasks: Task[];
  todayStr: string;
  currentStreak?: number;
}

export const GrindMatrix: React.FC<GrindMatrixProps> = ({
  tasks,
  todayStr,
  currentStreak = 9,
}) => {
  // Generate past 14 days
  const pastDays = useMemo(() => {
    const days: string[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }, []);

  const matrixData = useMemo(() => {
    return pastDays.map((day) => {
      const dayTasks = tasks.filter((t) => t.target_date === day);
      const completed = dayTasks.filter((t) => t.is_completed).length;
      const total = dayTasks.length;
      const rate = total > 0 ? (completed / total) * 100 : 0;

      const leetcode = dayTasks.some((t) => t.category === 'leetcode' && t.is_completed);
      const github = dayTasks.some((t) => t.category === 'github' && t.is_completed);
      const jap = dayTasks.some((t) => t.category === 'naam_jap' && t.is_completed);

      return {
        date: day.slice(5), // MM-DD
        total,
        completed,
        rate,
        leetcode,
        github,
        jap,
        isToday: day === todayStr,
      };
    });
  }, [pastDays, tasks, todayStr]);

  return (
    <div className="bg-neutral-900/60 border border-white/10 rounded-3xl p-4 space-y-3.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">14-Day Grind Matrix</h3>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-amber-400">
          <Flame className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          <span>{currentStreak} Days Streak</span>
        </div>
      </div>

      {/* Heatmap Matrix Row */}
      <div className="grid grid-cols-7 gap-1.5 pt-1">
        {matrixData.map((d, i) => {
          let bgClass = 'bg-neutral-950 border-white/5';
          if (d.rate >= 80) bgClass = 'bg-emerald-500 text-black border-emerald-400';
          else if (d.rate >= 50) bgClass = 'bg-emerald-600/80 text-white border-emerald-500/50';
          else if (d.rate > 0) bgClass = 'bg-emerald-950 text-emerald-400 border-emerald-800/40';

          return (
            <div
              key={i}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition ${bgClass} ${
                d.isToday ? 'ring-1 ring-amber-400 shadow-md' : ''
              }`}
            >
              <span className="text-[9px] font-mono opacity-80">{d.date}</span>
              <span className="text-xs font-black font-mono mt-0.5">
                {d.completed}/{d.total}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono pt-1 border-t border-white/5">
        <span>Less Grind</span>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-neutral-950 border border-white/5" />
          <span className="w-2.5 h-2.5 rounded bg-emerald-950" />
          <span className="w-2.5 h-2.5 rounded bg-emerald-700" />
          <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
        </div>
        <span>High Velocity</span>
      </div>
    </div>
  );
};