'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Mic, Volume2, Sparkles, Bot, VolumeX } from 'lucide-react';

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
  type: string;
  note?: string | null;
  is_settled: boolean;
}

interface VoiceAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  khaataRecords: KhaataRecord[];
  todayStr: string;
  japCount: number;
  onSwitchModule: (mod: 'routine' | 'bazaar' | 'khaata') => void;
  onIncrementJap: () => void;
  onAddTask: (task: { title: string; category: string; target_date: string; target_time: string }) => Promise<void>;
  onAddKharcha: (amount: number, item: string) => Promise<void>;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantProps> = ({
  isOpen,
  onClose,
  tasks,
  khaataRecords,
  todayStr,
  japCount,
  onSwitchModule,
  onIncrementJap,
  onAddTask,
  onAddKharcha,
}) => {
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [transcript, setTranscript] = useState('');
  const [assistantReply, setAssistantReply] = useState('');
  const [isMuted, setIsMuted] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Native Speech Synthesis (Bol kar reply dene ke liye)
  const speakReply = (text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window) || isMuted) {
      setStatus('idle');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 1.05;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const hindiVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
    if (hindiVoice) utterance.voice = hindiVoice;

    utterance.onstart = () => setStatus('speaking');
    utterance.onend = () => setStatus('idle');
    utterance.onerror = () => setStatus('idle');

    window.speechSynthesis.speak(utterance);
  };

  // Autonomous Command & Query Processor
  const processCommand = async (rawText: string) => {
    const text = rawText.toLowerCase().trim();
    setStatus('processing');

    // 1. Navigation Commands
    if (text.includes('routine') || text.includes('tasks dikhao') || text.includes('routine kholo')) {
      onSwitchModule('routine');
      const reply = 'Routine open kar diya hai bhai.';
      setAssistantReply(reply);
      speakReply(reply);
      return;
    }

    if (text.includes('bazaar') || text.includes('shopping') || text.includes('bazaar kholo')) {
      onSwitchModule('bazaar');
      const reply = 'Bazaar vault open kar diya hai.';
      setAssistantReply(reply);
      speakReply(reply);
      return;
    }

    if (text.includes('khata') || text.includes('khaata') || text.includes('hisaab') || text.includes('ledger')) {
      onSwitchModule('khaata');
      const reply = 'Khaata diary open kar di hai.';
      setAssistantReply(reply);
      speakReply(reply);
      return;
    }

    // 2. Naam Jap Status & Increment
    if (text.includes('naam jap badhao') || text.includes('jap karo') || text.includes('ek jap')) {
      onIncrementJap();
      const nextCount = japCount + 1;
      const reply = `Har Har Mahadev! Naam Jap ${nextCount} par update ho gaya.`;
      setAssistantReply(reply);
      speakReply(reply);
      return;
    }

    if (text.includes('naam jap kitna') || text.includes('jap count')) {
      const reply = `Abhi tak 108 me se ${japCount} naam jap complete huye hain.`;
      setAssistantReply(reply);
      speakReply(reply);
      return;
    }

    // 3. Bike Vault Status
    if (text.includes('bike') || text.includes('gullak') || text.includes('saving kitni')) {
      const totalBike = khaataRecords
        .filter(r => r.note?.startsWith('[BIKE_SAVING]'))
        .reduce((acc, cur) => acc + Number(cur.amount), 0);

      const reply = `Bike Vault me ab tak ₹${totalBike.toLocaleString('en-IN')} jama ho chuke hain.`;
      setAssistantReply(reply);
      speakReply(reply);
      return;
    }

    // 4. Pending Tasks Query
    if (text.includes('pending task') || text.includes('kya bacha hai') || text.includes('aaj kya karna hai')) {
      const todayTasks = tasks.filter(t => t.target_date === todayStr);
      const pending = todayTasks.filter(t => !t.is_completed);

      if (pending.length === 0) {
        const reply = 'Aaj ke saare routine tasks complete ho chuke hain, shandaar grind!';
        setAssistantReply(reply);
        speakReply(reply);
      } else {
        const topTask = pending[0].title.replace(/^\[(IDEA|SHOOT|EDIT|READY)\]\s*/i, '');
        const reply = `Aaj ke ${pending.length} tasks bache hain. Sabse pehle "${topTask}" par dhyan do.`;
        setAssistantReply(reply);
        speakReply(reply);
      }
      return;
    }

    // 5. Kharcha Logging ("₹X petrol kharcha", "50 chai kharcha")
    const kharchaMatch = text.match(/(\d+).*(kharcha|spent|kharch)/);
    if (kharchaMatch) {
      const amount = parseInt(kharchaMatch[1], 10);
      let item = text
        .replace(/(\d+)/g, '')
        .replace(/(rs|₹|rupaye|rupees|kharcha|kharch|spent|ka|ki|ke|me|mein|hua)/gi, '')
        .trim();
      if (!item) item = 'Daily Expense';

      await onAddKharcha(amount, item);
      const reply = `Noted bhai! ₹${amount} "${item}" ke kharche me add ho gaye.`;
      setAssistantReply(reply);
      speakReply(reply);
      return;
    }

    // 6. Direct Task Scheduling ("gym task add karo", "kal 7 baje chest workout")
    if (text.includes('task add') || text.includes('schedule') || text.includes('gym') || text.includes('study')) {
      let title = rawText
        .replace(/(task|add|karo|schedule|karna|hai)/gi, '')
        .trim();
      if (!title) title = 'Important Work';

      let cat = 'Personal';
      if (text.includes('gym') || text.includes('workout')) cat = 'Gym / Workout';
      else if (text.includes('study') || text.includes('padhai')) cat = 'Study';
      else if (text.includes('edit') || text.includes('work')) cat = 'Editing / Work';

      await onAddTask({
        title,
        category: cat,
        target_date: todayStr,
        target_time: '10:00 AM',
      });

      const reply = `"${title}" routine me schedule kar diya hai.`;
      setAssistantReply(reply);
      speakReply(reply);
      return;
    }

    // Default Fallback
    const fallbackReply = `Sun liya bhai: "${rawText}". Tu mujhe tasks check karne, bike savings janne ya kharcha add karne ko bol sakta hai.`;
    setAssistantReply(fallbackReply);
    speakReply(fallbackReply);
  };

  // Speech Recognition Listener
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'hi-IN';

        recognition.onresult = (event: any) => {
          const result = event.results[0][0].transcript;
          setTranscript(result);
          processCommand(result);
        };

        recognition.onerror = () => setStatus('idle');
        recognition.onend = () => {
          if (status === 'listening') setStatus('idle');
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [tasks, khaataRecords, todayStr, japCount, isMuted]);

  const startListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition support nahi karta. Chrome/Edge/Safari browser use karein.');
      return;
    }
    window.speechSynthesis.cancel();
    setTranscript('');
    setAssistantReply('');
    setStatus('listening');
    try {
      recognitionRef.current.start();
    } catch {
      // ignore if already started
    }
  };

  const stopAll = () => {
    if (recognitionRef.current) recognitionRef.current.abort();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setStatus('idle');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-between p-6 animate-in zoom-in-95 duration-200 select-none">
      {/* Top Controls */}
      <div className="w-full max-w-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-bold block">
              Autonomous Assistant
            </span>
            <h3 className="text-sm font-black text-white">SARTHI Voice Pilot</h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-xl bg-neutral-900 border border-white/10 text-neutral-400 hover:text-white"
            title={isMuted ? 'Unmute Speech' : 'Mute Speech'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={() => {
              stopAll();
              onClose();
            }}
            className="p-2 rounded-xl bg-neutral-900 border border-white/10 text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Central Pulsing AI Voice Waveform Orb */}
      <div className="flex flex-col items-center justify-center my-auto space-y-6">
        <div className="relative flex items-center justify-center">
          {/* Outer Pulsing Rings */}
          <div
            className={`absolute w-44 h-44 rounded-full transition-all duration-700 pointer-events-none ${
              status === 'listening'
                ? 'bg-amber-500/25 animate-ping'
                : status === 'speaking'
                ? 'bg-emerald-500/25 animate-pulse'
                : 'bg-white/5'
            }`}
          />
          <div
            className={`absolute w-36 h-36 rounded-full blur-xl transition-all duration-500 pointer-events-none ${
              status === 'listening'
                ? 'bg-amber-500/40'
                : status === 'speaking'
                ? 'bg-emerald-500/40'
                : 'bg-neutral-800/20'
            }`}
          />

          {/* Core Interactive Mic Sphere */}
          <button
            onClick={status === 'listening' ? stopAll : startListening}
            className={`relative z-10 w-24 h-24 rounded-full border flex items-center justify-center transition-all duration-300 shadow-2xl active:scale-90 ${
              status === 'listening'
                ? 'bg-amber-500 border-amber-400 text-black shadow-amber-500/50'
                : status === 'speaking'
                ? 'bg-emerald-500 border-emerald-400 text-black shadow-emerald-500/50'
                : 'bg-neutral-900 border-white/20 text-white hover:border-amber-400'
            }`}
          >
            {status === 'speaking' ? (
              <Volume2 className="w-8 h-8 animate-bounce" />
            ) : (
              <Mic className={`w-8 h-8 ${status === 'listening' ? 'animate-pulse' : ''}`} />
            )}
          </button>
        </div>

        {/* Live Status Label */}
        <div className="text-center space-y-1">
          <span className="text-[11px] font-mono tracking-widest uppercase font-bold text-neutral-400 block">
            {status === 'listening'
              ? 'Listening... (Bolo bhai)'
              : status === 'processing'
              ? 'Thinking...'
              : status === 'speaking'
              ? 'SARTHI Speaking'
              : 'Tap Mic to Talk'}
          </span>
          <p className="text-xs text-neutral-500 max-w-xs">
            "Aaj ke tasks kya hain?", "Khaata kholo", "Bike saving kitni hui?"
          </p>
        </div>

        {/* Live Voice Subtitles */}
        {(transcript || assistantReply) && (
          <div className="w-full max-w-xs bg-neutral-950/80 border border-white/10 rounded-2xl p-3.5 space-y-2 text-center animate-in fade-in">
            {transcript && (
              <p className="text-xs text-neutral-400 font-mono">
                🗣️ "{transcript}"
              </p>
            )}
            {assistantReply && (
              <p className="text-xs font-semibold text-white leading-relaxed">
                🤖 {assistantReply}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Suggested Quick Triggers */}
      <div className="w-full max-w-sm flex items-center justify-center gap-1.5 flex-wrap">
        {[
          'Pending tasks kya hain?',
          'Khaata kholo',
          'Bike saving kitni hui?',
          '+1 Naam Jap',
        ].map((q, idx) => (
          <button
            key={idx}
            onClick={() => {
              setTranscript(q);
              processCommand(q);
            }}
            className="px-2.5 py-1 rounded-xl bg-neutral-900/80 border border-white/10 text-neutral-300 text-[10px] font-mono hover:text-white hover:border-amber-500/40 active:scale-95 transition"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
};