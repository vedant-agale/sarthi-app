'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Check, 
  Flame, 
  Plus, 
  Heart, 
  Code2, 
  GitBranch,
  RefreshCw, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  X,
  Calendar,
  Clock,
  History,
  Bell,
  RotateCcw,
  Hourglass,
  Edit3,
  SlidersHorizontal,
  Lock,
  ShoppingBag,
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign
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

interface ShoppingItem {
  id: string;
  title: string;
  is_bought: boolean;
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

interface BannerNotification {
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

const DEFAULT_ROUTINES = [
  { title: 'Naam Jap (108 Jap)', category: 'naam_jap' },
  { title: 'LeetCode Daily Challenge', category: 'leetcode' },
  { title: 'GitHub Daily Push / Commit', category: 'github' },
  { title: 'Mail Checking (Inbox Zero)', category: 'mail' },
  { title: 'Job Apply & Follow-ups', category: 'job_apply' },
  { title: 'Productive Deep Work', category: 'productive' },
];

const DEFAULT_CATEGORIES = ['naam_jap', 'leetcode', 'github', 'mail', 'job_apply', 'productive'];

const MANUAL_CATEGORIES = [
  { id: 'Personal', label: 'Personal' },
  { id: 'Workout', label: 'Gym / Workout' },
  { id: 'Study', label: 'Study' },
  { id: 'Project', label: 'Editing / Work' },
  { id: 'Urgent', label: 'Urgent' },
];

export default function Home() {
  const [currentModule, setCurrentModule] = useState<'routine' | 'bazaar' | 'khaata'>('routine');
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'history'>('today');

  const getDeviceDate = () => new Date().toISOString().split('T')[0];
  const getDeviceTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // State: Tasks
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [category, setCategory] = useState<string>('Personal');
  const [targetDate, setTargetDate] = useState(getDeviceDate());
  const [dueTime, setDueTime] = useState(getDeviceTime());
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // State: Shopping & Khaata
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [newShoppingItem, setNewShoppingItem] = useState('');
  const [khaataRecords, setKhaataRecords] = useState<KhaataRecord[]>([]);
  const [khaataName, setKhaataName] = useState('');
  const [khaataAmount, setKhaataAmount] = useState('');
  const [khaataType, setKhaataType] = useState<'lena' | 'dena'>('lena');
  const [khaataDueDate, setKhaataDueDate] = useState('');
  const [khaataNote, setKhaataNote] = useState('');

  // Widgets & Handles
  const [japCount, setJapCount] = useState(0);
  const [leetcodeUsername, setLeetcodeUsername] = useState('vedant-agale');
  const [githubUsername, setGithubUsername] = useState('vedant-agale');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyingGithubId, setVerifyingGithubId] = useState<string | null>(null);
  const [banner, setBanner] = useState<BannerNotification | null>(null);
  const [notificationsAllowed, setNotificationsAllowed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Gestures
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<number>(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const touchStartXRef = useRef<number>(0);
  const isSwipingRef = useRef<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerBanner = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setBanner({ title, message, type });
    setTimeout(() => setBanner(null), 4500);
  };

  const isProtectedTask = (task: Task) => DEFAULT_CATEGORIES.includes(task.category);

  // Routine Auto Process
  const processDailyLifecycle = async (allTasks: Task[]) => {
    const today = getDeviceDate();
    const overdueTasks = allTasks.filter(t => !t.is_completed && t.target_date < today);
    if (overdueTasks.length > 0) {
      for (const t of overdueTasks) {
        await supabase
          .from('tasks')
          .update({ target_date: today, carry_forward_count: (t.carry_forward_count || 0) + 1 })
          .eq('id', t.id);
      }
    }

    const todaysTasks = allTasks.filter(t => t.target_date === today);
    const missingDefaults = DEFAULT_ROUTINES.filter(
      def => !todaysTasks.some(t => t.title.toLowerCase().includes(def.title.toLowerCase().slice(0, 8)))
    );

    if (missingDefaults.length > 0) {
      const entries = missingDefaults.map(def => ({
        title: def.title,
        category: def.category,
        target_date: today,
        is_completed: false,
        carry_forward_count: 0
      }));
      await supabase.from('tasks').insert(entries);
    }
  };

  const fetchAllData = async () => {
    const [tRes, sRes, kRes] = await Promise.all([
      supabase.from('tasks').select('*').order('created_at', { ascending: false }),
      supabase.from('shopping_items').select('*').order('created_at', { ascending: false }),
      supabase.from('khaata_records').select('*').order('created_at', { ascending: false })
    ]);

    if (tRes.data) {
      setTasks(tRes.data);
      await processDailyLifecycle(tRes.data);
    }
    if (sRes.data) setShoppingItems(sRes.data);
    if (kRes.data) setKhaataRecords(kRes.data);
  };

  useEffect(() => {
    fetchAllData();

    const channel = supabase
      .channel('sarthi-global-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        supabase.from('tasks').select('*').order('created_at', { ascending: false }).then(({ data }) => {
          if (data) setTasks(data);
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_items' }, () => {
        supabase.from('shopping_items').select('*').order('created_at', { ascending: false }).then(({ data }) => {
          if (data) setShoppingItems(data);
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'khaata_records' }, () => {
        supabase.from('khaata_records').select('*').order('created_at', { ascending: false }).then(({ data }) => {
          if (data) setKhaataRecords(data);
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // 1. Task Operations
  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = newTaskTitle.trim() ? newTaskTitle.trim() : category;

    await supabase.from('tasks').insert([{ 
      title: finalTitle, 
      category: category.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      target_date: targetDate,
      due_time: dueTime || null
    }]);

    setNewTaskTitle('');
    setDueTime(getDeviceTime());
    setTargetDate(getDeviceDate());
    triggerBanner('Saved!', `"${finalTitle}" schedule ho gaya.`, 'success');
  };

  const deleteTask = async (id: string) => {
    const taskToDelete = tasks.find(t => t.id === id);
    if (taskToDelete && isProtectedTask(taskToDelete)) {
      triggerBanner('Locked Routine 🔒', 'Ye mandatory task hai, delete nahi ho sakta!', 'error');
      setActiveDragId(null);
      setDragOffset(0);
      return;
    }

    await supabase.from('tasks').delete().eq('id', id);
    setDeletingId(null);
    setActiveDragId(null);
    setDragOffset(0);
    setEditingTask(null);
  };

  const toggleGeneralTask = async (task: Task) => {
    if (isSwipingRef.current) return;
    if (task.category === 'leetcode' && !task.is_completed) {
      triggerBanner('LeetCode Lock', 'Pehle "Verify AC" button dabayein.', 'info');
      return;
    }
    if (task.category === 'github' && !task.is_completed) {
      triggerBanner('GitHub Lock', 'Pehle "Verify Push" button dabayein.', 'info');
      return;
    }
    if (task.category === 'naam_jap' && !task.is_completed) {
      triggerBanner('Naam Jap Lock', 'Pehle 108 dafa jap counter complete karein.', 'info');
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
        triggerBanner('Verified! 🔥', data.message, 'success');
        await supabase.from('tasks').update({ is_completed: true, completed_at: new Date().toISOString() }).eq('id', taskId);
      } else {
        triggerBanner('Not Verified', data.message || 'Aaj koi solve nahi mila.', 'error');
      }
    } catch {
      triggerBanner('Network Error', 'LeetCode se contact nahi ho saka.', 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  // GitHub Verify
  const verifyGitHub = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVerifyingGithubId(taskId);
    try {
      const res = await fetch(`/api/github?username=${githubUsername.trim()}`);
      const data = await res.json();

      if (data.verified) {
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 } });
        triggerBanner('Verified! 🚀', data.message, 'success');
        await supabase.from('tasks').update({ is_completed: true, completed_at: new Date().toISOString() }).eq('id', taskId);
      } else {
        triggerBanner('No Commits Found', data.message, 'error');
      }
    } catch {
      triggerBanner('Network Error', 'GitHub connect nahi ho saka.', 'error');
    } finally {
      setVerifyingGithubId(null);
    }
  };

  // Jap Counter
  const handleJapIncrement = async () => {
    const nextCount = japCount + 1;
    setJapCount(nextCount);

    if (nextCount === 108) {
      confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 } });
      triggerBanner('Har Har Mahadev! 🙏', '108 Naam Jap pure hue!', 'success');
      const japTask = tasks.find(t => t.category === 'naam_jap' && !t.is_completed);
      if (japTask) {
        await supabase.from('tasks').update({ is_completed: true, completed_at: new Date().toISOString() }).eq('id', japTask.id);
      }
    }
  };

  // 2. Shopping Operations
  const addShoppingItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShoppingItem.trim()) return;

    await supabase.from('shopping_items').insert([{ title: newShoppingItem.trim() }]);
    setNewShoppingItem('');
    triggerBanner('Added to List', 'Bazaar me khareedne ke liye save hua.', 'success');
  };

  const toggleShoppingItem = async (item: ShoppingItem) => {
    await supabase.from('shopping_items').update({ is_bought: !item.is_bought }).eq('id', item.id);
  };

  const clearBoughtItems = async () => {
    await supabase.from('shopping_items').delete().eq('is_bought', true);
    triggerBanner('Cleared', 'Khareede hue items list se remove ho gaye.', 'info');
  };

  // 3. Khaata Operations
  const addKhaataEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!khaataName.trim() || !khaataAmount.trim()) {
      triggerBanner('Missing Fields', 'Naam aur Amount daalna zaroori hai!', 'error');
      return;
    }

    await supabase.from('khaata_records').insert([{
      person_name: khaataName.trim(),
      amount: parseFloat(khaataAmount),
      type: khaataType,
      due_date: khaataDueDate || null,
      note: khaataNote.trim() || null
    }]);

    setKhaataName('');
    setKhaataAmount('');
    setKhaataDueDate('');
    setKhaataNote('');
    triggerBanner('Record Saved', 'Hisaab diary me save ho gaya.', 'success');
  };

  const toggleKhaataSettled = async (record: KhaataRecord) => {
    await supabase.from('khaata_records').update({ is_settled: !record.is_settled }).eq('id', record.id);
  };

  const deleteKhaataRecord = async (id: string) => {
    await supabase.from('khaata_records').delete().eq('id', id);
    triggerBanner('Removed', 'Record remove kar diya gaya.', 'info');
  };

  // Gesture Handlers
  const onTouchStartCard = (task: Task, e: React.TouchEvent) => {
    if (isProtectedTask(task)) return;
    touchStartXRef.current = e.touches[0].clientX;
    isSwipingRef.current = false;
    setActiveDragId(task.id);
    setDragOffset(0);
  };

  const onTouchMoveCard = (task: Task, e: React.TouchEvent) => {
    if (isProtectedTask(task) || activeDragId !== task.id) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartXRef.current;

    if (diff < -8) {
      isSwipingRef.current = true;
      const clamped = diff < -120 ? -120 + (diff + 120) * 0.25 : diff;
      setDragOffset(clamped);
    } else {
      setDragOffset(0);
    }
  };

  const onTouchEndCard = (task: Task) => {
    if (isProtectedTask(task) || activeDragId !== task.id) return;
    if (dragOffset < -85) {
      setDeletingId(task.id);
      setDragOffset(-320);
      setTimeout(() => deleteTask(task.id), 350);
    } else {
      setDragOffset(0);
      setTimeout(() => setActiveDragId(null), 200);
    }
    setTimeout(() => { isSwipingRef.current = false; }, 100);
  };

  const getCountdownString = (targetDateStr: string, dueTimeStr?: string | null) => {
    const target = new Date(`${targetDateStr}T${dueTimeStr || '00:00:00'}`);
    const diff = target.getTime() - currentTime.getTime();
    if (diff <= 0) return 'Due Now';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  // Khaata Balance Calculations
  const totalLenaHai = useMemo(() => {
    return khaataRecords
      .filter(r => r.type === 'lena' && !r.is_settled)
      .reduce((acc, cur) => acc + Number(cur.amount), 0);
  }, [khaataRecords]);

  const totalDenaHai = useMemo(() => {
    return khaataRecords
      .filter(r => r.type === 'dena' && !r.is_settled)
      .reduce((acc, cur) => acc + Number(cur.amount), 0);
  }, [khaataRecords]);

  const todayStr = useMemo(() => getDeviceDate(), []);
  const todayTasks = tasks.filter(t => t.target_date === todayStr);
  const upcomingTasks = tasks.filter(t => t.target_date > todayStr);
  const historyTasks = tasks.filter(t => t.is_completed);

  return (
    <main className="min-h-screen bg-black text-white px-4 py-6 sm:py-10 max-w-md mx-auto font-sans antialiased overflow-x-hidden select-none pb-24">
      
      {/* 🟢 iOS Floating Pill */}
      {banner && (
        <div className="fixed top-4 inset-x-0 mx-auto max-w-xs px-4 z-50 animate-in fade-in slide-in-from-top-3">
          <div className="bg-neutral-900/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-3 shadow-2xl flex items-center justify-between gap-3">
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
                <p className="text-[10px] text-neutral-400 line-clamp-1">{banner.message}</p>
              </div>
            </div>
            <button onClick={() => setBanner(null)} className="p-1 text-neutral-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/*  Top App Header */}
      <header className="flex justify-between items-center mb-5">
        <div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-amber-500">Autonomous Assistant</span>
          <h1 className="text-2xl font-black tracking-tight text-white">SARTHI</h1>
        </div>
        <div className="flex items-center gap-1.5 bg-neutral-900/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-xs">
          <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
          <span className="font-semibold text-white">{todayTasks.filter(t => t.is_completed).length}</span>
          <span className="text-neutral-500">/{todayTasks.length}</span>
        </div>
      </header>

      {/*  Module Switcher (Routine / Bazaar / Khaata) */}
      <div className="grid grid-cols-3 bg-neutral-900/90 p-1 rounded-2xl border border-white/10 text-xs font-semibold mb-5">
        <button
          onClick={() => setCurrentModule('routine')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            currentModule === 'routine' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 text-amber-400" /> Routine
        </button>
        <button
          onClick={() => setCurrentModule('bazaar')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            currentModule === 'bazaar' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" /> Bazaar
        </button>
        <button
          onClick={() => setCurrentModule('khaata')}
          className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
            currentModule === 'khaata' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400'
          }`}
        >
          <Wallet className="w-3.5 h-3.5 text-blue-400" /> Khaata
        </button>
      </div>

      {/* ========================================================
          MODULE 1: ROUTINE & ACCOUNTABILITY
      ======================================================== */}
      {currentModule === 'routine' && (
        <>
          {/* Sub Tabs */}
          <div className="grid grid-cols-3 bg-neutral-950 p-1 rounded-xl border border-white/5 text-[11px] font-semibold mb-5">
            <button
              onClick={() => setActiveTab('today')}
              className={`py-1.5 rounded-lg transition ${activeTab === 'today' ? 'bg-neutral-800 text-amber-400' : 'text-neutral-500'}`}
            >
              Today
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`py-1.5 rounded-lg transition ${activeTab === 'upcoming' ? 'bg-neutral-800 text-indigo-400' : 'text-neutral-500'}`}
            >
              Upcoming ({upcomingTasks.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-1.5 rounded-lg transition ${activeTab === 'history' ? 'bg-neutral-800 text-blue-400' : 'text-neutral-500'}`}
            >
              Records
            </button>
          </div>

          {activeTab === 'today' && (
            <>
              {/* Quick Deck Cards */}
              <section className="grid grid-cols-3 gap-2 mb-5">
                {/* Naam Jap */}
                <div className="bg-neutral-900 border border-white/10 rounded-2xl p-2.5 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
                    <Heart className="w-3 h-3 fill-rose-500/20" /> Naam Jap
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400 my-1">{japCount}/108</span>
                  <button 
                    onClick={handleJapIncrement}
                    className="w-full bg-white text-black text-[10px] font-bold py-1 rounded-lg active:scale-95 transition"
                  >
                    +1 Jap
                  </button>
                </div>

                {/* LeetCode Handle */}
                <div className="bg-neutral-900 border border-white/10 rounded-2xl p-2.5 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                    <Code2 className="w-3 h-3" /> LeetCode
                  </span>
                  <input
                    type="text"
                    value={leetcodeUsername}
                    onChange={(e) => setLeetcodeUsername(e.target.value)}
                    placeholder="Handle"
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-1.5 py-1 text-[11px] text-neutral-200 focus:outline-none my-1"
                  />
                  <span className="text-[9px] text-neutral-500 text-center font-mono">IST Strict Check</span>
                </div>

                {/* GitHub Handle */}
                <div className="bg-neutral-900 border border-white/10 rounded-2xl p-2.5 flex flex-col justify-between">
                  <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                    <GitBranch className="w-3 h-3" /> GitHub
                  </span>
                  <input
                    type="text"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="Username"
                    className="w-full bg-black/60 border border-white/10 rounded-lg px-1.5 py-1 text-[11px] text-neutral-200 focus:outline-none my-1"
                  />
                  <span className="text-[9px] text-neutral-500 text-center font-mono">Daily Push Check</span>
                </div>
              </section>

              {/* Task Add Form */}
              <form onSubmit={addTask} className="space-y-3 mb-6 bg-neutral-900/70 border border-white/10 p-3.5 rounded-3xl shadow-lg">
                <input
                  type="text"
                  placeholder={`Task likho ya sidha "${category}" add karo...`}
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                />

                <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {MANUAL_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCategory(cat.label)}
                      className={`px-2.5 py-1 rounded-xl whitespace-nowrap transition-all text-[11px] font-semibold ${
                        category === cat.label 
                          ? 'bg-amber-500 text-black shadow-md' 
                          : 'bg-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

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

              {/* Task List */}
              <div className="space-y-2.5">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 px-1">Today's Focus</h3>

                {todayTasks.map((task) => {
                  const isItemDragging = activeDragId === task.id;
                  const isItemDeleting = deletingId === task.id;
                  const offset = isItemDragging ? dragOffset : 0;
                  const protectedItem = isProtectedTask(task);

                  return (
                    <div 
                      key={task.id}
                      className={`relative overflow-hidden rounded-2xl transition-all duration-300 ${
                        isItemDeleting ? 'max-h-0 opacity-0 mb-0 py-0 scale-95' : 'max-h-28 opacity-100 mb-2.5'
                      }`}
                    >
                      {!protectedItem && (
                        <div className="absolute inset-0 bg-rose-600 rounded-2xl flex items-center justify-end pr-5 text-white">
                          <Trash2 
                            className="w-5 h-5 transition-transform duration-100" 
                            style={{ transform: `scale(${Math.min(1.25, Math.max(0.7, Math.abs(offset) / 70))})` }} 
                          />
                        </div>
                      )}

                      <div 
                        onTouchStart={(e) => onTouchStartCard(task, e)}
                        onTouchMove={(e) => onTouchMoveCard(task, e)}
                        onTouchEnd={() => onTouchEndCard(task)}
                        onClick={() => toggleGeneralTask(task)}
                        style={{
                          transform: `translateX(${offset}px)`,
                          transition: isItemDragging ? 'none' : 'transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)'
                        }}
                        className={`relative z-10 p-3 rounded-2xl border flex items-center justify-between cursor-pointer ${
                          task.is_completed ? 'bg-neutral-900/90 border-white/5 opacity-50' : 'bg-neutral-900 border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 flex-1 mr-2 min-w-0">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            task.is_completed ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-neutral-600'
                          }`}>
                            {task.is_completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>

                          <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-xs font-semibold truncate ${task.is_completed ? 'line-through text-neutral-500' : 'text-neutral-100'}`}>
                                {task.title}
                              </span>
                              {protectedItem && <Lock className="w-2.5 h-2.5 text-neutral-600 shrink-0" />}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[9px] text-neutral-500 uppercase tracking-wider font-semibold">
                                {task.category}
                              </span>
                              {task.due_time && (
                                <span className="text-[9px] text-amber-400 font-mono">• {task.due_time}</span>
                              )}
                              {task.carry_forward_count > 0 && (
                                <span className="text-[8px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 rounded-full flex items-center gap-0.5">
                                  <RotateCcw className="w-2 h-2" /> +{task.carry_forward_count}d
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* LeetCode Verification Button */}
                        {task.category === 'leetcode' && !task.is_completed && (
                          <button
                            onClick={(e) => verifyLeetCode(task.id, e)}
                            disabled={verifyingId === task.id}
                            className="bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold px-2 py-1 rounded-xl flex items-center gap-1 active:scale-95"
                          >
                            <RefreshCw className={`w-3 h-3 ${verifyingId === task.id ? 'animate-spin' : ''}`} />
                            Verify AC
                          </button>
                        )}

                        {/* GitHub Verification Button */}
                        {task.category === 'github' && !task.is_completed && (
                          <button
                            onClick={(e) => verifyGitHub(task.id, e)}
                            disabled={verifyingGithubId === task.id}
                            className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-semibold px-2 py-1 rounded-xl flex items-center gap-1 active:scale-95"
                          >
                            <RefreshCw className={`w-3 h-3 ${verifyingGithubId === task.id ? 'animate-spin' : ''}`} />
                            Verify Push
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Upcoming Tab */}
          {activeTab === 'upcoming' && (
            <section className="space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 px-1">Scheduled Milestones</h3>
              {upcomingTasks.map(task => (
                <div 
                  key={task.id}
                  onClick={() => setEditingTask(task)}
                  className="p-3.5 bg-neutral-900 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <h4 className="text-xs font-bold text-white truncate">{task.title}</h4>
                    <p className="text-[10px] text-neutral-400 mt-0.5 font-mono">{task.target_date} {task.due_time ? `@ ${task.due_time}` : ''}</p>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-1 rounded-xl">
                    {getCountdownString(task.target_date, task.due_time)}
                  </span>
                </div>
              ))}
            </section>
          )}

          {/* Records Tab */}
          {activeTab === 'history' && (
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400 px-1">Completed History</h3>
              {historyTasks.map(task => (
                <div key={task.id} className="p-3 bg-neutral-900/40 border border-white/5 rounded-2xl flex items-center justify-between">
                  <h4 className="text-xs text-neutral-300 line-through truncate">{task.title}</h4>
                  <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-mono">{task.category}</span>
                </div>
              ))}
            </section>
          )}
        </>
      )}

      {/* ========================================================
          MODULE 2: BAZAAR (POCKET SHOPPING VAULT)
      ======================================================== */}
      {currentModule === 'bazaar' && (
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-400" /> Bazaar Pocket Vault
              </h2>
              <p className="text-[10px] text-neutral-400">Ghar se likho, dukaan par ek tap me tick karo</p>
            </div>
            {shoppingItems.some(i => i.is_bought) && (
              <button
                onClick={clearBoughtItems}
                className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 active:scale-95 transition"
              >
                Clear Bought
              </button>
            )}
          </div>

          {/* Quick Input Bar */}
          <form onSubmit={addShoppingItem} className="flex gap-2">
            <input
              type="text"
              placeholder="Item ka naam likho (e.g. Doodh, PVC pipe)..."
              value={newShoppingItem}
              onChange={(e) => setNewShoppingItem(e.target.value)}
              className="flex-1 bg-neutral-900 border border-white/10 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="bg-emerald-500 hover:bg-emerald-400 text-black px-4 rounded-2xl font-bold text-xs flex items-center justify-center active:scale-95 transition"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Add
            </button>
          </form>

          {/* Items Checklist */}
          <div className="space-y-2">
            {shoppingItems.length === 0 ? (
              <div className="text-center py-10 bg-neutral-900/30 border border-white/5 rounded-3xl">
                <p className="text-xs text-neutral-500">Shopping list khali hai. Jo khareedna hai yaha note kar lo!</p>
              </div>
            ) : (
              shoppingItems.map(item => (
                <div
                  key={item.id}
                  onClick={() => toggleShoppingItem(item)}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                    item.is_bought 
                      ? 'bg-neutral-900/30 border-white/5 opacity-50' 
                      : 'bg-neutral-900/80 border-white/10 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      item.is_bought ? 'bg-emerald-500 border-emerald-500 text-black' : 'border-neutral-600'
                    }`}>
                      {item.is_bought && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <span className={`text-xs font-semibold ${item.is_bought ? 'line-through text-neutral-500' : 'text-neutral-100'}`}>
                      {item.title}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* ========================================================
          MODULE 3: KHAATA (UDHAR-JAMA LEDGER)
      ======================================================== */}
      {currentModule === 'khaata' && (
        <section className="space-y-4">
          {/* Net Balance Overview Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-neutral-900/80 border border-emerald-500/20 rounded-2xl p-3.5">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold mb-1">
                <ArrowDownLeft className="w-4 h-4" /> Lena Hai (Aana Hai)
              </div>
              <span className="text-lg font-mono font-bold text-white">₹{totalLenaHai}</span>
            </div>

            <div className="bg-neutral-900/80 border border-rose-500/20 rounded-2xl p-3.5">
              <div className="flex items-center gap-1.5 text-rose-400 text-xs font-semibold mb-1">
                <ArrowUpRight className="w-4 h-4" /> Dena Hai (Wapas Karna)
              </div>
              <span className="text-lg font-mono font-bold text-white">₹{totalDenaHai}</span>
            </div>
          </div>

          {/* New Record Form */}
          <form onSubmit={addKhaataEntry} className="space-y-2.5 bg-neutral-900/60 border border-white/10 p-3.5 rounded-3xl">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setKhaataType('lena')}
                className={`py-1.5 rounded-xl text-xs font-bold transition ${
                  khaataType === 'lena' ? 'bg-emerald-500 text-black' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                + Lena Hai
              </button>
              <button
                type="button"
                onClick={() => setKhaataType('dena')}
                className={`py-1.5 rounded-xl text-xs font-bold transition ${
                  khaataType === 'dena' ? 'bg-rose-500 text-black' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                - Dena Hai
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <input
                type="text"
                placeholder="Kiska naam hai?..."
                value={khaataName}
                onChange={(e) => setKhaataName(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
              />
              <input
                type="number"
                placeholder="Rupaye ₹ (e.g. 500)"
                value={khaataAmount}
                onChange={(e) => setKhaataAmount(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1 bg-black/50 border border-white/10 rounded-xl px-2.5 py-1.5 text-neutral-400">
                <Calendar className="w-3.5 h-3.5" />
                <input
                  type="date"
                  value={khaataDueDate}
                  onChange={(e) => setKhaataDueDate(e.target.value)}
                  className="bg-transparent text-white w-full text-xs focus:outline-none"
                />
              </div>
              <input
                type="text"
                placeholder="Kyun diye / Kis cheez ke?"
                value={khaataNote}
                onChange={(e) => setKhaataNote(e.target.value)}
                className="bg-black/50 border border-white/10 rounded-xl px-3 py-1.5 text-white focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-2.5 rounded-xl transition active:scale-95"
            >
              Hisaab Me Add Karo
            </button>
          </form>

          {/* Khaata Entries List */}
          <div className="space-y-2">
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 px-1">Active Ledger</h3>

            {khaataRecords.length === 0 ? (
              <div className="text-center py-10 bg-neutral-900/30 border border-white/5 rounded-3xl">
                <p className="text-xs text-neutral-500">Khaata ekdum clear hai! Koi lene-dene ka hisaab pending nahi.</p>
              </div>
            ) : (
              khaataRecords.map(record => {
                const isOverdue = record.due_date && record.due_date < todayStr && !record.is_settled;

                return (
                  <div
                    key={record.id}
                    className={`p-3.5 rounded-2xl border transition flex items-center justify-between ${
                      record.is_settled
                        ? 'bg-neutral-900/30 border-white/5 opacity-50'
                        : isOverdue 
                        ? 'bg-rose-950/20 border-rose-500/40' 
                        : 'bg-neutral-900/80 border-white/10'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{record.person_name}</span>
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${
                          record.type === 'lena' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {record.type === 'lena' ? 'Lena Hai' : 'Dena Hai'}
                        </span>
                        {isOverdue && (
                          <span className="text-[9px] bg-rose-600 text-white px-1.5 py-0.5 rounded-md font-bold">
                            OVERDUE!
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px] text-neutral-400 font-mono">
                        <span>₹{record.amount}</span>
                        {record.due_date && <span>• Due: {record.due_date}</span>}
                        {record.note && <span>• "{record.note}"</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleKhaataSettled(record)}
                        className={`text-[11px] font-bold px-2.5 py-1.5 rounded-xl transition active:scale-95 ${
                          record.is_settled 
                            ? 'bg-neutral-800 text-neutral-400' 
                            : 'bg-white text-black hover:bg-neutral-200'
                        }`}
                      >
                        {record.is_settled ? 'Settled ✓' : 'Nipta Diya'}
                      </button>
                      <button
                        onClick={() => deleteKhaataRecord(record.id)}
                        className="p-1.5 text-neutral-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/*  Bottom Sheet: Edit Scheduled Task */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/15 w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-amber-500" /> Edit Milestone
              </h3>
              <button onClick={() => setEditingTask(null)} className="text-neutral-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-neutral-400 block mb-1">Task Title</label>
                <input 
                  type="text" 
                  value={editingTask.title} 
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-neutral-400 block mb-1">Target Date</label>
                  <input 
                    type="date" 
                    value={editingTask.target_date} 
                    onChange={(e) => setEditingTask({ ...editingTask, target_date: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Due Time</label>
                  <input 
                    type="time" 
                    value={editingTask.due_time || ''} 
                    onChange={(e) => setEditingTask({ ...editingTask, due_time: e.target.value })}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {!isProtectedTask(editingTask) && (
                <button 
                  onClick={() => deleteTask(editingTask.id)}
                  className="flex-1 bg-rose-500/15 border border-rose-500/30 text-rose-400 font-bold py-2.5 rounded-xl transition text-xs"
                >
                  Delete
                </button>
              )}
              <button 
                onClick={async () => {
                  await supabase.from('tasks').update({
                    title: editingTask.title,
                    target_date: editingTask.target_date,
                    due_time: editingTask.due_time
                  }).eq('id', editingTask.id);
                  setEditingTask(null);
                  triggerBanner('Updated', 'Milestone save ho gaya.', 'success');
                }}
                className="flex-1 bg-amber-500 text-black font-bold py-2.5 rounded-xl transition text-xs"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}