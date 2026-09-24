'use client';

import { useState, useEffect } from 'react';
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
  Dumbbell,
  Clock,
  Calendar,
  History,
  Bell,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Task {
  id: string;
  title: string;
  category: string;
  target_date: string;
  due_time?: string;
  is_completed: boolean;
  completed_at?: string;
  carry_forward_count: number;
}

interface BannerNotification {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<'today' | 'history'>('today');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [category, setCategory] = useState<string>('general');
  const [dueTime, setDueTime] = useState('');
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0]);

  // Widget States
  const [japCount, setJapCount] = useState(0);
  const [leetcodeUsername, setLeetcodeUsername] = useState('vedant-agale');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [mailChecked, setMailChecked] = useState(false);
  const [banner, setBanner] = useState<BannerNotification | null>(null);
  const [notificationsAllowed, setNotificationsAllowed] = useState(false);

  // Trigger iOS Dynamic Island Notification
  const triggerBanner = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setBanner({ title, message, type });
    setTimeout(() => setBanner(null), 4500);
  };

  // Request Native System Notification Permission
  const requestNotificationAccess = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsAllowed(true);
        triggerBanner('Notifications Active', 'Time pe reminders milenge!', 'success');
      }
    }
  };

  // Auto Carry-Forward Logic
  const handleAutoCarryForward = async (currentTasks: Task[]) => {
    const today = new Date().toISOString().split('T')[0];
    const overdueTasks = currentTasks.filter(t => !t.is_completed && t.target_date < today);

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
      triggerBanner(
        'Auto Carry-Forward ⏳', 
        `${overdueTasks.length} pending task(s) agale din transfer kar diye gaye!`, 
        'info'
      );
      fetchTasks();
    }
  };

  // Fetch Tasks
  const fetchTasks = async () => {
    const { data } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (data) {
      setTasks(data);
      handleAutoCarryForward(data);
    }
  };

 useEffect(() => {
    fetchTasks();

    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationsAllowed(Notification.permission === 'granted');
    }

    // 🟢 Realtime Multi-Device Sync Listener
    const channel = supabase
      .channel('tasks-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tasks' },
        () => {
          fetchTasks(); // Kisi bhi device se change ho, screen auto-update hogi
        }
      )
      .subscribe();

    // ⏰ Time-based Alert Checker
    const interval = setInterval(() => {
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      const today = now.toISOString().split('T')[0];

      tasks.forEach(task => {
        if (!task.is_completed && task.target_date === today && task.due_time === currentTime) {
          if (Notification.permission === 'granted') {
            new Notification('SARTHI Alert! 🔔', {
              body: `Bhai time ho gaya hai: "${task.title}" complete kar le!`,
            });
          }
          triggerBanner('Reminder Alert! ⏰', `Time ho gaya: "${task.title}"`, 'info');
        }
      });
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, []);

  // Add Task
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
    triggerBanner('Task Scheduled', 'Routine me shamil kar diya gaya hai.', 'success');
    fetchTasks();
  };

  // Delete Task
  const deleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await supabase.from('tasks').delete().eq('id', id);
    fetchTasks();
  };

  // Complete Task
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

    fetchTasks();
  };

  // LeetCode Verifier
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
        fetchTasks();
      } else {
        triggerBanner('Submission Not Found', data.message || 'Aaj koi fresh solve nahi mila.', 'error');
      }
    } catch {
      triggerBanner('Error', 'LeetCode se contact nahi ho saka.', 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  // Naam Jap Increment
  const handleJapIncrement = async () => {
    const nextCount = japCount + 1;
    setJapCount(nextCount);

    if (nextCount === 108) {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
      triggerBanner('Har Har Mahadev! 🙏', '108 Naam Jap ka sankalp pura hua!', 'success');
      
      const japTask = tasks.find(t => t.category === 'naam_jap' && !t.is_completed);
      if (japTask) {
        await supabase.from('tasks').update({ 
          is_completed: true, 
          completed_at: new Date().toISOString() 
        }).eq('id', japTask.id);
        fetchTasks();
      }
    }
  };

  // Mark Mail Check Done
  const handleMailToggle = async () => {
    const nextState = !mailChecked;
    setMailChecked(nextState);
    if (nextState) {
      confetti({ particleCount: 50, spread: 50 });
      triggerBanner('Inbox Zero! ✉️', 'Aaj ke important mails review ho gaye.', 'success');
      const mailTask = tasks.find(t => t.category === 'mail' && !t.is_completed);
      if (mailTask) {
        await supabase.from('tasks').update({ 
          is_completed: true, 
          completed_at: new Date().toISOString() 
        }).eq('id', mailTask.id);
        fetchTasks();
      }
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasks = tasks.filter(t => t.target_date === todayStr);
  const completedToday = todayTasks.filter(t => t.is_completed).length;
  const historyTasks = tasks.filter(t => t.is_completed);

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6 sm:py-10 max-w-lg mx-auto font-sans antialiased">
      
      {/* 🟢 iOS Dynamic Island Floating Pill */}
      {banner && (
        <div className="fixed top-4 inset-x-0 mx-auto max-w-sm px-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-neutral-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-3.5 shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-2xl ${
                banner.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' :
                banner.type === 'error' ? 'bg-rose-500/20 text-rose-400' :
                'bg-amber-500/20 text-amber-400'
              }`}>
                {banner.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                {banner.type === 'error' && <AlertCircle className="w-5 h-5" />}
                {banner.type === 'info' && <Sparkles className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white tracking-wide">{banner.title}</h4>
                <p className="text-[11px] text-neutral-400 leading-snug line-clamp-1">{banner.message}</p>
              </div>
            </div>
            <button onClick={() => setBanner(null)} className="p-1 text-neutral-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/*  iOS Navigation Header */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-amber-500">Autonomous Assistant</span>
          <h1 className="text-3xl font-black tracking-tight text-white">SARTHI</h1>
        </div>
        <div className="flex items-center gap-2">
          {!notificationsAllowed && (
            <button 
              onClick={requestNotificationAccess}
              className="bg-neutral-900 border border-white/10 p-2 rounded-full text-amber-400 hover:text-amber-300"
              title="Enable Reminders"
            >
              <Bell className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-1.5 bg-neutral-900/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-xs">
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
            <span className="font-semibold text-white">{completedToday}</span>
            <span className="text-neutral-500">/{todayTasks.length}</span>
          </div>
        </div>
      </header>

      {/*  Top Navigation Segmented Switcher (Today vs History) */}
      <div className="grid grid-cols-2 bg-neutral-900/90 p-1 rounded-2xl border border-white/10 text-xs font-semibold mb-6">
        <button
          onClick={() => setActiveTab('today')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'today' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-amber-400" /> Today's Routine
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            activeTab === 'history' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <History className="w-3.5 h-3.5 text-blue-400" /> Past Records ({historyTasks.length})
        </button>
      </div>

      {activeTab === 'today' ? (
        <>
          {/*  iOS Horizontal Swipeable Widget Deck (Scrollable with Smooth Snap) */}
          <section className="mb-6">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">Quick Rituals (Swipe ↔)</span>
              <span className="text-[10px] text-amber-500 font-mono">3 Active Deck</span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory no-scrollbar text-left">
              
              {/* Widget 1: Naam Jap */}
              <div className="min-w-[240px] flex-shrink-0 snap-start bg-gradient-to-br from-neutral-900/90 to-neutral-900/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-rose-500/15 text-rose-400 rounded-xl">
                      <Heart className="w-4 h-4 fill-rose-500/20" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Naam Jap</h4>
                      <p className="text-[10px] text-neutral-400">Target 108 dafa</p>
                    </div>
                  </div>
                  <span className="text-base font-mono font-bold text-amber-400">{japCount}/108</span>
                </div>
                <button 
                  onClick={handleJapIncrement}
                  className="w-full bg-white text-black text-xs font-bold py-2 rounded-xl active:scale-95 transition hover:bg-neutral-200"
                >
                  +1 Jap Mark Karo
                </button>
              </div>

              {/* Widget 2: LeetCode Engine */}
              <div className="min-w-[250px] flex-shrink-0 snap-start bg-neutral-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-amber-500/15 text-amber-400 rounded-xl">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">LeetCode</h4>
                      <p className="text-[10px] text-neutral-400">Zero-Storage Verify</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={leetcodeUsername}
                    onChange={(e) => setLeetcodeUsername(e.target.value)}
                    placeholder="Handle"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Widget 3: Mail & Inbox Review */}
              <div className="min-w-[240px] flex-shrink-0 snap-start bg-neutral-900/80 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 flex flex-col justify-between">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-500/15 text-blue-400 rounded-xl">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">Mail Check</h4>
                      <p className="text-[10px] text-neutral-400">Inbox Zero Check</p>
                    </div>
                  </div>
                  {mailChecked && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </div>
                <button 
                  onClick={handleMailToggle}
                  className={`w-full text-xs font-bold py-2 rounded-xl active:scale-95 transition ${
                    mailChecked 
                      ? 'bg-neutral-800 text-neutral-400' 
                      : 'bg-blue-600 hover:bg-blue-500 text-white'
                  }`}
                >
                  {mailChecked ? 'Mails Done ✓' : 'Mark Inbox Zero'}
                </button>
              </div>

            </div>
          </section>

          {/*  Task Creation Input Form */}
          <form onSubmit={addTask} className="space-y-3 mb-6 bg-neutral-900/70 backdrop-blur-2xl border border-white/10 p-4 rounded-3xl shadow-lg">
            <input
              type="text"
              placeholder="Naya task likho..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />

            {/* Horizontal Scrollable Categories */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
              {[
                { id: 'general', label: 'General' },
                { id: 'leetcode', label: 'LeetCode' },
                { id: 'naam_jap', label: 'Naam Jap' },
                { id: 'mail', label: 'Mail Check' },
                { id: 'workout', label: 'Workout/Gym' },
                { id: 'deep_work', label: 'Deep Work' },
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all text-[11px] font-semibold ${
                    category === cat.id 
                      ? 'bg-amber-500 text-black shadow-md' 
                      : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Date & Time Picker */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-neutral-300">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                <input 
                  type="date" 
                  value={targetDate} 
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="bg-transparent text-neutral-200 focus:outline-none w-full text-[11px]"
                />
              </div>
              <div className="flex items-center gap-1.5 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-neutral-300">
                <Clock className="w-3.5 h-3.5 text-neutral-500" />
                <input 
                  type="time" 
                  value={dueTime} 
                  onChange={(e) => setDueTime(e.target.value)}
                  className="bg-transparent text-neutral-200 focus:outline-none w-full text-[11px]"
                  placeholder="Set Time"
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 transition active:scale-[0.98]"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Routine Me Shamil Karo
            </button>
          </form>

          {/*  Task List */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-500 px-1">Today's Tasks</h3>

            {todayTasks.length === 0 ? (
              <div className="text-center py-10 bg-neutral-900/30 border border-white/5 rounded-3xl">
                <p className="text-xs text-neutral-500">Sab tasks niptaye gaye hain! Chill karo ✨</p>
              </div>
            ) : (
              todayTasks.map((task) => (
                <div 
                  key={task.id}
                  onClick={() => toggleGeneralTask(task)}
                  className={`group p-3.5 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    task.is_completed 
                      ? 'bg-neutral-900/30 border-white/5 opacity-50' 
                      : 'bg-neutral-900/70 hover:bg-neutral-900/90 border-white/10 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 mr-2">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      task.is_completed 
                        ? 'bg-emerald-500 border-emerald-500 text-black' 
                        : 'border-neutral-600 group-hover:border-neutral-400'
                    }`}>
                      {task.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>

                    <div className="flex flex-col">
                      <span className={`text-sm font-medium ${task.is_completed ? 'line-through text-neutral-500' : 'text-neutral-100'}`}>
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold">
                          {task.category}
                        </span>
                        {task.due_time && (
                          <span className="text-[10px] text-amber-400/90 flex items-center gap-1 font-mono">
                            <Clock className="w-2.5 h-2.5" /> {task.due_time}
                          </span>
                        )}
                        {task.carry_forward_count > 0 && (
                          <span className="text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 rounded-full flex items-center gap-0.5">
                            <RotateCcw className="w-2 h-2" /> +{task.carry_forward_count}d pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {task.category === 'leetcode' && !task.is_completed && (
                      <button
                        onClick={(e) => verifyLeetCode(task.id, e)}
                        disabled={verifyingId === task.id}
                        className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[11px] font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition active:scale-95"
                      >
                        <RefreshCw className={`w-3 h-3 ${verifyingId === task.id ? 'animate-spin' : ''}`} />
                        {verifyingId === task.id ? '...' : 'Verify AC'}
                      </button>
                    )}

                    <button
                      onClick={(e) => deleteTask(task.id, e)}
                      className="opacity-30 group-hover:opacity-100 p-1.5 rounded-xl hover:bg-white/10 text-neutral-400 hover:text-rose-400 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /*  History & Past Records View */
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Accomplished History</h3>
            <span className="text-xs text-emerald-400 font-mono font-bold">{historyTasks.length} Completed</span>
          </div>

          {historyTasks.length === 0 ? (
            <div className="text-center py-12 bg-neutral-900/30 border border-white/5 rounded-3xl">
              <p className="text-xs text-neutral-500">Abhi tak koi task complete nahi hua hai.</p>
            </div>
          ) : (
            historyTasks.map(task => (
              <div key={task.id} className="p-3.5 bg-neutral-900/40 border border-white/5 rounded-2xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-neutral-200 line-through">{task.title}</h4>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    Completed: {task.completed_at ? new Date(task.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Earlier'}
                  </p>
                </div>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
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