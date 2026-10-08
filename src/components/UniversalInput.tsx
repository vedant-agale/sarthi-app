'use client';

import React, { useState, useMemo } from 'react';
import { Zap, CornerDownLeft, ArrowRight } from 'lucide-react';

interface UniversalInputProps {
  todayStr: string;
  onAddTask: (task: { title: string; category: string; target_date: string; target_time: string }) => Promise<void>;
  onAddKhaata: (record: { person_name: string; amount: number; type: 'lena' | 'dena'; note: string; due_date: string }) => Promise<void>;
  onSuccess: (msg: string) => void;
}

export const UniversalInput: React.FC<UniversalInputProps> = ({
  todayStr,
  onAddTask,
  onAddKhaata,
  onSuccess,
}) => {
  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parsing Engine
  const parsedIntent = useMemo(() => {
    const raw = text.trim();
    if (!raw) return null;

    const lower = raw.toLowerCase();

    // 1. Detect Khaata Entry Patterns
    const amountMatch = raw.match(/(\d+)/);
    const hasKhaataKeywords = 
      lower.includes('diye') || lower.includes('diya') || 
      lower.includes('dena') || lower.includes('lena') || 
      lower.includes('liye') || lower.includes('paise') ||
      lower.includes('hisaab') || lower.includes('₹') || lower.includes('rs');

    if (amountMatch && hasKhaataKeywords) {
      const amount = parseInt(amountMatch[1], 10);
      const isLena = lower.includes('lena') || lower.includes('liye');
      const type: 'lena' | 'dena' = isLena ? 'lena' : 'dena';

      let cleaned = raw
        .replace(/(\d+)/g, '')
        .replace(/(rs|₹|rupaye|rupees|ko|se|diye|diya|dena|lena|liye|hai)/gi, '')
        .trim();

      const parts = cleaned.split(/\s+/).filter(Boolean);
      const person_name = parts[0] || 'Unknown';
      const note = parts.slice(1).join(' ') || (type === 'lena' ? 'Lena Hai' : 'Dena Hai');

      return {
        target: 'khaata' as const,
        data: {
          person_name,
          amount,
          type,
          note,
          due_date: todayStr,
        },
      };
    }

    // 2. Detect Routine Task
    let category = 'Personal';
    if (lower.includes('gym') || lower.includes('workout') || lower.includes('leg day') || lower.includes('chest')) {
      category = 'Gym / Workout';
    } else if (lower.includes('study') || lower.includes('padhai') || lower.includes('dsa') || lower.includes('leetcode')) {
      category = 'Study';
    } else if (lower.includes('edit') || lower.includes('work') || lower.includes('office') || lower.includes('meeting')) {
      category = 'Editing / Work';
    } else if (lower.includes('urgent') || lower.includes('emergency') || lower.includes('imp')) {
      category = 'Urgent';
    }

    // Date parsing: "kal" -> tomorrow
    let target_date = todayStr;
    if (lower.includes('kal')) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      target_date = d.toISOString().split('T')[0];
    } else if (lower.includes('parso')) {
      const d = new Date();
      d.setDate(d.getDate() + 2);
      target_date = d.toISOString().split('T')[0];
    }

    // Time parsing: e.g. "8 baje", "8:30 baje", "8am", "8 pm"
    let target_time = '09:00 AM';
    const timeMatch = lower.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm|baje)?/);
    if (timeMatch && (lower.includes('baje') || lower.includes('am') || lower.includes('pm'))) {
      let h = parseInt(timeMatch[1], 10);
      const m = timeMatch[2] ? timeMatch[2].padStart(2, '0') : '00';
      const isPm = lower.includes('pm') || (lower.includes('shaam') && h < 12) || (lower.includes('raat') && h < 12);
      if (isPm && h < 12) h += 12;
      target_time = `${h.toString().padStart(2, '0')}:${m}`;
    }

    // Clean title
    let title = raw
      .replace(/(kal|parso|aaj|\d{1,2}(?::\d{2})?\s*(?:am|pm|baje))/gi, '')
      .trim();
    if (!title) title = raw;

    return {
      target: 'routine' as const,
      data: {
        title,
        category,
        target_date,
        target_time,
      },
    };
  }, [text, todayStr]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!parsedIntent || isSubmitting) return;

    setIsSubmitting(true);
    try {
      if (parsedIntent.target === 'khaata') {
        await onAddKhaata(parsedIntent.data);
        onSuccess(`Khaata saved: ₹${parsedIntent.data.amount} (${parsedIntent.data.person_name})`);
      } else {
        await onAddTask(parsedIntent.data);
        onSuccess(`Task added: "${parsedIntent.data.title}" [${parsedIntent.data.category}]`);
      }
      setText('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="absolute left-3.5 text-neutral-500">
          <Zap className="w-4 h-4 text-amber-400" />
        </div>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Smart Bar: "Kal 8 baje gym" ya "Satya ko 500 diye dinner"...'
          disabled={isSubmitting}
          className="w-full bg-neutral-900/90 border border-white/10 hover:border-white/20 focus:border-amber-500/50 rounded-2xl pl-10 pr-12 py-3 text-xs text-white placeholder-neutral-500 outline-none transition shadow-inner font-medium"
        />

        <button
          type="submit"
          disabled={!text.trim() || isSubmitting}
          className="absolute right-2 px-2.5 py-1.5 rounded-xl bg-white text-black text-[11px] font-bold disabled:opacity-20 transition active:scale-95 flex items-center gap-1"
        >
          <CornerDownLeft className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Live Parser Preview */}
      {parsedIntent && (
        <div className="flex items-center gap-2 px-2 py-1 text-[11px] font-mono text-neutral-400 animate-in fade-in duration-150">
          <ArrowRight className="w-3 h-3 text-amber-400 shrink-0" />
          {parsedIntent.target === 'khaata' ? (
            <span className="truncate">
              Khaata Entry: <strong className="text-white">{parsedIntent.data.person_name}</strong> • 
              <span className={parsedIntent.data.type === 'lena' ? 'text-emerald-400 font-bold ml-1' : 'text-rose-400 font-bold ml-1'}>
                {parsedIntent.data.type === 'lena' ? 'Lena' : 'Dena'} ₹{parsedIntent.data.amount}
              </span>
              {parsedIntent.data.note && ` (${parsedIntent.data.note})`}
            </span>
          ) : (
            <span className="truncate">
              Routine: <strong className="text-white">"{parsedIntent.data.title}"</strong> • 
              <span className="text-amber-400 ml-1">[{parsedIntent.data.category}]</span> • 
              <span className="text-neutral-300 ml-1">{parsedIntent.data.target_date} @ {parsedIntent.data.target_time}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};