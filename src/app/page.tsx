'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Check, 
  Flame, 
  Plus, 
  Heart, 
  Code2, 
  RefreshCw, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  X,
  Mail,
  Briefcase,
  Laptop,
  Clock,
  Calendar,
  History,
  Bell,
  RotateCcw,
  Hourglass
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

interface BannerNotification {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

// 5 Mandatory Daily Routines
const DEFAULT_ROUTINES = [
  { title: 'Naam Jap (108 Jap)', category: 'naam_jap' },
  { title: 'LeetCode Daily Challenge', category: 'leetcode' },
  { title: 'Mail Checking (Inbox Zero)', category: 'mail' },
  { title: 'Job Apply & Follow-ups', category: 'job_apply' },
  { title: 'Productive Deep Work', category: 'productive' },
];

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'history'>('today');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [category, setCategory] = useState<string>('general');
  const [dueTime, setDueTime] = useState('');
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [japCount, setJapCount] = useState(0);
  const [leetcodeUsername, setLeetcodeUsername] = useState('vedant-agale');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [banner, setBanner] = useState<BannerNotification | null>(null);
  const [notificationsAllowed, setNotificationsAllowed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live Clock for Countdowns
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerBanner = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setBanner({ title, message, type });
    setTimeout(() => setBanner(null), 4500);
  };

  const requestNotificationAccess = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsAllowed(true);
        triggerBanner('Notifications Active', 'Time pe reminders milenge!', 'success');
      }
    }
  };

  // 1. Auto Daily Defaults & Carry Forward Engine
  const processDailyLifecycle = async (allTasks: Task[]) => {
    const today = new Date().toISOString().split('T')[0];

    // Carry forward unfinished tasks from previous dates
    const overdueTasks = allTasks.filter(t => !t.is_completed && t.target_date < today);
    if (overdueTasks.length > 0) {
      for (const t of overdueTasks) {
        await supabase
          .from('tasks')
          .update({ 
            target_date: today, 
            carry_forward_count: (t.carry_forward_count || 0) + 1 
          })
          .eq('id', t.id);
      }
    }

    // Auto-assign 5 Default Tasks if not already present for today
    const todaysTasks = allTasks.filter(t => t.target_date === today);
    const missingDefaults = DEFAULT_ROUTINES.filter(
      def => !todaysTasks.some(t => t.title.toLowerCase().includes(def.title.toLowerCase().slice(0, 8)))
    );

    if (missingDefaults.length > 0) {
      const newEntries = missingDefaults.map(def => ({
        title: def.title,
        category: def.category,
        target_date: today,
        is_completed: false,
        carry_forward_count: 0
      }));
      await supabase.from('tasks').insert(newEntries);
    }
  };

  // 2. Fetch Tasks with Supabase
  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) {
      setTasks(data);
      await processDailyLifecycle(data);
    }
  };

  // 3. Realtime Listener & 7 PM Notification Watcher
  useEffect(() => {
    fetchTasks();

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsAllowed(Notification.permission === 'granted');
    }

    // Supabase Realtime Channel
    const channel = supabase
      .channel('tasks-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        // Kisi bhi device par change ho, turant reload hoga bina refresh kiye
        supabase.from('tasks').select('*').order('created_at', { ascending: false }).then(({ data }) => {
          if (data) setTasks(data);
        });
      })
      .subscribe();

    // Routine & 7 PM Incomplete Tasks Notification Engine
    let alertedAt7PM = false;
    const interval = setInterval(() => {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMins = now.getMinutes();
      const timeString = `${String(currentHours).padStart(2, '0')}:${String(currentMins).padStart(2, '0')}`;
      const today = now.toISOString().split('T')[0];

      // Point 4: Shaam 7:00 PM Notification
      if (currentHours === 19 && currentMins === 0 && !alertedAt7PM) {
        const pendingCount = tasks.filter(t => t.target_date === today && !t.is_completed).length;
        if (pendingCount > 0) {
          if (Notification.permission === 'granted') {
            new Notification('SARTHI: Shaam Ke 7 Baj Gaye! ⚠️', {
              body: `Dhyan de! Aaj ke ${pendingCount} zaroori tasks abhi bhi baaki hain. Routine complete kar lo!`,
            });
          }
          triggerBanner('Evening Alert! ⚠️', `Aaj ke ${pendingCount} tasks pending hain. Nipta lo!`, 'error');
        }
        alertedAt7PM = true;
      }
      if (currentHours !== 19) alertedAt7PM = false;

      // Due time reminder
      tasks.forEach(task => {
        if (!task.is_completed && task.target_date === today && task.due_time === timeString) {
          if (Notification.permission === 'granted') {
            new Notification('SARTHI Alert! 🔔', {
              body: `Time ho gaya: "${task.title}" execute karo!`,
            });
          }
          triggerBanner('Scheduled Reminder ⏰', task.title, 'info');
        }
      });
    }, 20000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // Add Task (Supports any date)
  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      triggerBanner('Error', 'Task ka naam daalna zaroori hai!', 'error');
      return;
    }

    await supabase.from('tasks').insert([{ 
      title: newTaskTitle.trim(), 
      category,
      target_date: targetDate,
      due_time: dueTime || null
    }]);

    setNewTaskTitle('');
    setDueTime('');
    triggerBanner('Saved!', 'Task schedule me set kar diya gaya.', 'success');
  };

  // Delete Task
  const deleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('tasks').delete().eq('id', id);
  };

  // Toggle Complete
  const toggleGeneralTask = async (task: Task) => {
    if (task.category === 'leetcode' && !task.is_completed) {
      triggerBanner('LeetCode Lock', 'Complete karne ke liye "Verify AC" dabayein.', 'info');
      return;
    }
    if (task.category === 'naam_jap' && !task.is_completed) {
      triggerBanner('Naam Jap Lock', 'Pehle counter par 108 jap pure karein.', 'info');
      return;
    }

    const updated = !task.is_completed;
    if (updated) confetti({ particleCount: 60, spread: 60, origin: { y: 0.8 } });

    await supabase.from('tasks').update({ 
      is_completed: updated,
      completed_at: updated ? new Date().toISOString() : null
    }).eq('id', task.id);
  };

  // LeetCode Verify
  const verifyLeetCode = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVerifyingId(taskId);
    try {
      const res = await fetch(`/api/leetcode?username=${leetcodeUsername.trim()}`);
      const data = await res.json();

      if (data.verified) {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 } });
        triggerBanner('Verified! 🔥', data.problem ? `Problem: ${data.problem}` : data.message, 'success');
        await supabase.from('tasks').update({ 
          is_completed: true,
          completed_at: new Date().toISOString()
        }).eq('id', taskId);
      } else {
        triggerBanner('Not Found', data.message || 'Aaj koi fresh submission nahi mila.', 'error');
      }
    } catch {
      triggerBanner('Network Error', 'LeetCode se check nahi ho saka.', 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  // 108 Jap Increment
  const handleJapIncrement = async () => {
    const nextCount = japCount + 1;
    setJapCount(nextCount);

    if (nextCount === 108) {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
      triggerBanner('Har Har Mahadev! 🙏', '108 Naam Jap pure hue!', 'success');
      
      const japTask = tasks.find(t => t.category === 'naam_jap' && !t.is_completed);
      if (japTask) {
        await supabase.from('tasks').update({ 
          is_completed: true, 
          completed_at: new Date().toISOString() 
        }).eq('id', japTask.id);
      }
    }
  };

  // Countdown Calculator for Future Tasks
  const getCountdownString = (targetDateStr: string, dueTimeStr?: string | null) => {
    const target = new Date(`${targetDateStr}T${dueTimeStr || '00:00:00'}`);
    const diff = target.getTime() - currentTime.getTime();

    if (diff <= 0) return 'Time reached';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / 1000 / 60) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h ${mins}m ${secs}s`;
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const todayTasks = tasks.filter(t => t.target_date === todayStr);
  const upcomingTasks = tasks.filter(t => t.target_date > todayStr);
  const historyTasks = tasks.filter(t => t.is_completed);

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6 sm:py-10 max-w-md mx-auto font-sans antialiased overflow-x-hidden">
      
      {/* 🟢 iOS Dynamic Island Floating Pill */}
      {banner && (
        <div className="fixed top-4 inset-x-0 mx-auto max-w-xs px-4 z-50">
          <div className="bg-neutral-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-3.5 shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-2xl ${
                banner.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                banner.type === 'error' ? 'bg-rose-500/20 text-rose-400' :
                'bg-amber-500/20 text-amber-400'
              }`}>
                {banner.type === 'success' && <CheckCircle2 className="w-4 h-4" />}
                {banner.type === 'error' && <AlertCircle className="w-4 h-4" />}
                {banner.type === 'info' && <Sparkles className="w-4 h-4" />}
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white tracking-wide">{banner.title}</h4>
                <p className="text-[10px] text-neutral-400 leading-snug line-clamp-1">{banner.message}</p>
              </div>
            </div>
            <button onClick={() => setBanner(null)} className="p-1 text-neutral-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/*  Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-amber-500">Autonomous Assistant</span>
          <h1 className="text-2xl font-black tracking-tight text-white">SARTHI</h1>
        </div>
        <div className="flex items-center gap-2">
          {!notificationsAllowed && (
            <button 
              onClick={requestNotificationAccess}
              className="bg-neutral-900 border border-white/10 p-2 rounded-full text-amber-400 hover:text-amber-300 active:scale-95 transition"
              title="7 PM Reminders"
            >
              <Bell className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-1.5 bg-neutral-900/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-xs">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
            <span className="font-semibold text-white">{todayTasks.filter(t => t.is_completed).length}</span>
            <span className="text-neutral-500">/{todayTasks.length}</span>
          </div>
        </div>
      </header>

      {/*  Top Navigation Segmented Switcher */}
      <div className="grid grid-cols-3 bg-neutral-900/90 p-1 rounded-2xl border border-white/10 text-xs font-semibold mb-6">
        <button
          onClick={() => setActiveTab('today')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${
            activeTab === 'today' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-amber-400" /> Today
        </button>
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${
            activeTab === 'upcoming' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Hourglass className="w-3.5 h-3.5 text-indigo-400" /> Upcoming
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1 ${
            activeTab === 'history' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5 text-blue-400" /> Records
        </button>
      </div>

      {activeTab === 'today' && (
        <>
          {/* Quick Deck Cards (Without Horizontal Side-Blowout) */}
          <section className="grid grid-cols-2 gap-3 mb-6">
            {/* Naam Jap Card */}
            <div className="bg-gradient-to-br from-neutral-900 to-neutral-900/60 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold text-rose-400 flex items-center gap-1">
                  <Heart className="w-3 h-3 fill-rose-500/20" /> Naam Jap
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">{japCount}/108</span>
              </div>
              <button 
                onClick={handleJapIncrement}
                className="w-full bg-white text-black text-[11px] font-bold py-1.5 rounded-xl active:scale-95 transition"
              >
                +1 Jap
              </button>
            </div>

            {/* LeetCode Handle Bar */}
            <div className="bg-neutral-900 border border-white/10 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1">
                  <Code2 className="w-3 h-3" /> LeetCode
                </span>
              </div>
              <input
                type="text"
                value={leetcodeUsername}
                onChange={(e) => setLeetcodeUsername(e.target.value)}
                placeholder="Handle"
                className="w-full bg-black/60 border border-white/10 rounded-xl px-2 py-1 text-xs text-neutral-200 focus:outline-none"
              />
            </div>
          </section>

          {/*  Task Creation Input Form */}
          <form onSubmit={addTask} className="space-y-3 mb-6 bg-neutral-900/70 border border-white/10 p-3.5 rounded-3xl shadow-lg">
            <input
              type="text"
              placeholder="Naya task likho..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-2xl px-3.5 py-2.5 text-base sm:text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />

            {/* Category Selectors */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              {[
                { id: 'general', label: 'General' },
                { id: 'leetcode', label: 'LeetCode' },
                { id: 'naam_jap', label: 'Naam Jap' },
                { id: 'mail', label: 'Mail' },
                { id: 'job_apply', label: 'Job Apply' },
                { id: 'productive', label: 'Deep Work' },
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition-all text-[11px] font-semibold ${
                    category === cat.id 
                      ? 'bg-amber-500 text-black shadow-md' 
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Date & Time Picker */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 rounded-xl px-2.5 py-2 text-neutral-300">
                <Calendar className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <input 
                  type="date" 
                  value={targetDate} 
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="bg-transparent text-neutral-200 focus:outline-none w-full text-xs"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 rounded-xl px-2.5 py-2 text-neutral-300">
                <Clock className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <input 
                  type="time" 
                  value={dueTime} 
                  onChange={(e) => setDueTime(e.target.value)}
                  className="bg-transparent text-neutral-200 focus:outline-none w-full text-xs"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs py-2.5 rounded-2xl flex items-center justify-center gap-1.5 transition active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Routine Me Shamil Karo
            </button>
          </form>

          {/* Today Tasks */}
          <div className="space-y-2.5">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 px-1">Today's Focus (Auto-Scheduled)</h3>

            {todayTasks.length === 0 ? (
              <div className="text-center py-8 bg-neutral-900/30 border border-white/5 rounded-3xl">
                <p className="text-xs text-neutral-500">Sab tasks done hain!</p>
              </div>
            ) : (
              todayTasks.map((task) => (
                <div 
                  key={task.id}
                  onClick={() => toggleGeneralTask(task)}
                  className={`group p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    task.is_completed 
                      ? 'bg-neutral-900/30 border-white/5 opacity-50' 
                      : 'bg-neutral-900/80 border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 mr-2 min-w-0">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      task.is_completed 
                        ? 'bg-emerald-500 border-emerald-500 text-black' 
                        : 'border-neutral-600'
                    }`}>
                      {task.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className={`text-xs font-semibold truncate ${task.is_completed ? 'line-through text-neutral-500' : 'text-neutral-100'}`}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">
                          {task.category}
                        </span>
                        {task.due_time && (
                          <span className="text-[9px] text-amber-400 font-mono">
                            • {task.due_time}
                          </span>
                        )}
                        {task.carry_forward_count > 0 && (
                          <span className="text-[8px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 rounded-full flex items-center gap-0.5">
                            <RotateCcw className="w-2 h-2" /> +{task.carry_forward_count}d
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {task.category === 'leetcode' && !task.is_completed && (
                      <button
                        onClick={(e) => verifyLeetCode(task.id, e)}
                        disabled={verifyingId === task.id}
                        className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold px-2 py-1 rounded-xl flex items-center gap-1 active:scale-95"
                      >
                        <RefreshCw className={`w-3 h-3 ${verifyingId === task.id ? 'animate-spin' : ''}`} />
                        Verify
                      </button>
                    )}

                    <button
                      onClick={(e) => deleteTask(task.id, e)}
                      className="opacity-30 group-hover:opacity-100 p-1 rounded-xl text-neutral-400 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/*  UPCOMING TAB (Point 6 Fix: Future Tasks with Countdown) */}
      {activeTab === 'upcoming' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Scheduled Milestones</h3>
            <span className="text-xs text-indigo-400 font-mono">{upcomingTasks.length} Planned</span>
          </div>

          {upcomingTasks.length === 0 ? (
            <div className="text-center py-10 bg-neutral-900/30 border border-white/5 rounded-3xl">
              <p className="text-xs text-neutral-500">Aage ke liye koi task plan nahi hai. Upar date select karke schedule karo!</p>
            </div>
          ) : (
            upcomingTasks.map(task => (
              <div key={task.id} className="p-3.5 bg-neutral-900/70 border border-white/10 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{task.title}</h4>
                  <p className="text-[10px] text-neutral-400 mt-0.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-neutral-500" /> {task.target_date} {task.due_time ? `@ ${task.due_time}` : ''}
                  </p>
                </div>
                {/* ⏳ Aesthetic Live Countdown Timer */}
                <div className="text-right">
                  <span className="text-[11px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded-xl">
                    {getCountdownString(task.target_date, task.due_time)}
                  </span>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {/*  HISTORY TAB */}
      {activeTab === 'history' && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Completed Archive</h3>
            <span className="text-xs text-emerald-400 font-mono font-bold">{historyTasks.length} Done</span>
          </div>

          {historyTasks.length === 0 ? (
            <div className="text-center py-10 bg-neutral-900/30 border border-white/5 rounded-3xl">
              <p className="text-xs text-neutral-500">Abhi tak koi task complete nahi hua hai.</p>
            </div>
          ) : (
            historyTasks.map(task => (
              <div key={task.id} className="p-3 bg-neutral-900/40 border border-white/5 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-300 line-through">{task.title}</h4>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    {task.completed_at ? new Date(task.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Completed'}
                  </p>
                </div>
                <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
                  {task.category}
                </span>
              </div>
            ))
          )}
        </section>
      )}

    </main>
  );
}