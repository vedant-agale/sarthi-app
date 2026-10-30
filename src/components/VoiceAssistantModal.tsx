'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Mic, Volume2, Bot, VolumeX } from 'lucide-react';

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
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const recognitionRef = useRef<any>(null);

  // 1. Natural Human Voices Cache (Google / Microsoft Neural Voices Load Karna)
  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // 2. Best Human-Like Voice Picker
  const getBestNaturalVoice = useCallback(() => {
    if (voices.length === 0) return null;

    // Preference 1: Natural / Neural Hindi Voice (e.g. Google हिन्दी, Microsoft Swara Online)
    const naturalHindi = voices.find(
      v => (v.lang.startsWith('hi') || v.lang.includes('IN')) && 
           (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Neural'))
    );
    if (naturalHindi) return naturalHindi;

    // Preference 2: Any Hindi Voice
    const anyHindi = voices.find(v => v.lang.startsWith('hi'));
    if (anyHindi) return anyHindi;

    // Preference 3: Natural Indian English Voice (Hinglish ke liye natural sound karta hai)
    const indianEnglish = voices.find(
      v => v.lang === 'en-IN' && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('India'))
    );
    if (indianEnglish) return indianEnglish;

    return voices[0];
  }, [voices]);

  // 3. Human Cadence Speech Delivery (No Robotic Rush)
  const speakReply = useCallback((text: string) => {
    if (isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setStatus('idle');
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      const naturalVoice = getBestNaturalVoice();
      if (naturalVoice) {
        utterance.voice = naturalVoice;
        utterance.lang = naturalVoice.lang;
      } else {
        utterance.lang = 'hi-IN';
      }

      // Natural Human Cadence & Pitch tuning
      utterance.rate = 0.94; // Thoda sa thehraav, robotic rush nahi
      utterance.pitch = 1.0; // Natural chest-tone pitch

      utterance.onstart = () => setStatus('speaking');
      utterance.onend = () => setStatus('idle');
      utterance.onerror = () => setStatus('idle');

      window.speechSynthesis.speak(utterance);
    } catch {
      setStatus('idle');
    }
  }, [isMuted, getBestNaturalVoice]);

  // 4. Smart Bilingual Autonomous Brain (Devanagari + Roman Hinglish)
  const processCommand = async (rawText: string) => {
    const text = rawText.toLowerCase().trim();
    setStatus('processing');

    const todayTasks = tasks.filter(t => t.target_date === todayStr);
    const pendingTasks = todayTasks.filter(t => !t.is_completed);

    // Intent A: Tasks Query ("कितने टास्क बचे", "pending tasks", "आज क्या बाकी है", "काम बताओ")
    const isTaskQuery =
      text.includes('टास्क') ||
      text.includes('task') ||
      text.includes('बचे') ||
      text.includes('बाकी') ||
      text.includes('bacha') ||
      text.includes('pending') ||
      text.includes('काम') ||
      text.includes('kya karna hai') ||
      text.includes('aaj kya hai');

    if (isTaskQuery && !text.includes('add') && !text.includes('जोड़') && !text.includes('जोड़')) {
      if (pendingTasks.length === 0) {
        const reply = 'Bhai aaj ke saare tasks khatam ho chuke hain! Full grind complete, ab chill karo ya naya milestone set karo.';
        setAssistantReply(reply);
        speakReply(reply);
      } else {
        const firstTask = pendingTasks[0].title.replace(/^\[(IDEA|SHOOT|EDIT|READY)\]\s*/i, '');
        const reply = `Vedant bhai, aaj ke ${pendingTasks.length} tasks pending hain. Sabse pehle "${firstTask}" execute kar lo!`;
        setAssistantReply(reply);
        speakReply(reply);
      }
      return;
    }

    // Intent B: Navigation ("Routine", "Bazaar", "Khaata" kholo)
    if (text.includes('routine') || text.includes('रूटीन') || text.includes('शेड्यूल')) {
      onSwitchModule('routine');
      const reply = 'Routine board open kar diya hai bhai.';
      setAssistantReply(reply);
      speakReply(reply);
      return;
    }

    if (text.includes('bazaar') || text.includes('बाजार') || text.includes('shopping') || text.includes('सामान')) {
      onSwitchModule('bazaar');
      const reply = 'Bazaar shopping pocket open kar di.';
      setAssistantReply(reply);
      speakReply(reply);
      return;
    }

    if (text.includes('khata') || text.includes('khaata') || text.includes('खाता') || text.includes('उधार') || text.includes('हिसाब') || text.includes('hisaab')) {
      onSwitchModule('khaata');
      const reply = 'Khaata aur daily expenses open ho gaye.';
      setAssistantReply(reply);
      speakReply(reply);
      return;
    }

    // Intent C: Bike Vault Status ("Bike saving", "गुल्लक", "बुलेट", "बाइक")
    if (text.includes('bike') || text.includes('बाइक') || text.includes('बुलेट') || text.includes('gullak') || text.includes('गुल्लक') || text.includes('saving')) {
      const totalBike = khaataRecords
        .filter(r => r.note?.startsWith('[BIKE_SAVING]'))
        .reduce((acc, cur) => acc + Number(cur.amount), 0);

      const reply = `Mission Garage Vault me ab tak ₹${totalBike.toLocaleString('en-IN')} jama ho chuke hain. Dream bike jaldi aayegi!`;
      setAssistantReply(reply);
      speakReply(reply);
      return;
    }

    // Intent D: Naam Jap ("नाम जाप", "jap", "जाप")
    if (text.includes('जाप') || text.includes('jap') || text.includes('naam')) {
      if (text.includes('बढ़ा') || text.includes('badhao') || text.includes('karo') || text.includes('+1')) {
        onIncrementJap();
        const reply = `Har Har Mahadev! Naam Jap ${japCount + 1} count ho gaya.`;
        setAssistantReply(reply);
        speakReply(reply);
      } else {
        const reply = `Aaj 108 me se ${japCount} naam jap complete ho chuke hain.`;
        setAssistantReply(reply);
        speakReply(reply);
      }
      return;
    }

    // Intent E: Kharcha Logging ("50 petrol kharcha", "20 chai", "१०० रुपये खर्च")
    const amountMatch = text.match(/(\d+)/);
    const isKharchaIntent = text.includes('kharcha') || text.includes('खर्च') || text.includes('spent') || text.includes('दिए');

    if (amountMatch && isKharchaIntent) {
      const amount = parseInt(amountMatch[1], 10);
      let item = text
        .replace(/(\d+)/g, '')
        .replace(/(rs|₹|rupaye|rupees|रुपये|kharcha|kharch|खर्चा|खर्च|spent|का|की|के|में|me|mein|hua)/gi, '')
        .trim();
      if (!item) item = 'Daily Expense';

      await onAddKharcha(amount, item);
      const reply = `Note kar liya Vedant bhai! ₹${amount} "${item}" ke kharche me add ho gaye.`;
      setAssistantReply(reply);
      speakReply(reply);
      return;
    }

    // Intent F: Direct Task Creation ("gym add karo", "kal padhai task likho")
    if (text.includes('add') || text.includes('जोड़') || text.includes('जोड़') || text.includes('likho') || text.includes('लिखो')) {
      let title = rawText
        .replace(/(task|add|karo|schedule|karna|hai|टास्क|जोड़ो|जोड़ो|लिखो|डालो)/gi, '')
        .trim();
      if (!title) title = 'Important Work';

      let cat = 'Personal';
      if (text.includes('gym') || text.includes('कसरत') || text.includes('workout')) cat = 'Gym / Workout';
      else if (text.includes('study') || text.includes('पढ़ाई') || text.includes('पढ़ाई') || text.includes('padhai')) cat = 'Study';
      else if (text.includes('edit') || text.includes('video') || text.includes('वीडियो') || text.includes('work')) cat = 'Editing / Work';

      await onAddTask({
        title,
        category: cat,
        target_date: todayStr,
        target_time: '10:00 AM',
      });

      const reply = `"${title}" ko ${cat} routine me set kar diya hai!`;
      setAssistantReply(reply);
      speakReply(reply);
      return;
    }

    // Intent G: Friendly Companion Chit-Chat
    if (text.includes('kaise ho') || text.includes('kya haal') || text.includes('हेलो') || text.includes('hello') || text.includes('hi')) {
      const reply = `Main ekdum badiya hu Vedant bhai! Batao aaj kya execute karna hai?`;
      setAssistantReply(reply);
      speakReply(reply);
      return;
    }

    if (text.includes('kaun ho') || text.includes('who are you') || text.includes('kya ho')) {
      const reply = `Main SARTHI hu—tera autonomous personal cockpit aur AI chief of staff. Tera schedule, leetcode, bike saving aur finances sab mere radar par hain!`;
      setAssistantReply(reply);
      speakReply(reply);
      return;
    }

    // Intent H: Intelligent Dynamic Fallback (No boring repetitive line)
    const reply = `Sun liya bhai. Aaj ke ${pendingTasks.length} tasks bache hain aur Jap count ${japCount}/108 hai. Kisi specific task, bike saving ya kharche ke baare me bolo.`;
    setAssistantReply(reply);
    speakReply(reply);
  };

  // 5. Silent Speech Recognition Listener (Zero Sound on Mic Tap)
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
  }, [tasks, khaataRecords, todayStr, japCount, isMuted, voices]);

  // Clean Silent Mic Trigger
  const startListening = () => {
    if (!recognitionRef.current) {
      alert('Aapke browser me speech recognition support nahi karta. Chrome browser use karein.');
      return;
    }

    // Mic start hone se pehle koi purani speech cut off karega, silent start
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    setTranscript('');
    setAssistantReply('');
    setStatus('listening');

    try {
      recognitionRef.current.start();
    } catch {
      // Already running
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
      {/* Top Bar */}
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
            className="p-2 rounded-xl bg-neutral-900 border border-white/10 text-neutral-400 hover:text-white transition"
            title={isMuted ? 'Voice Unmute' : 'Voice Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={() => {
              stopAll();
              onClose();
            }}
            className="p-2 rounded-xl bg-neutral-900 border border-white/10 text-neutral-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center Interactive Futuristic Waveform Orb */}
      <div className="flex flex-col items-center justify-center my-auto space-y-6">
        <div className="relative flex items-center justify-center">
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
            <Mic className={`w-8 h-8 ${status === 'listening' ? 'animate-pulse' : ''}`} />
          </button>
        </div>

        {/* Live Status Subtitle */}
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
            "कितने टास्क बचे हैं?", "बाइक सेविंग कितनी हुई?", "खाता खोलो"
          </p>
        </div>

        {/* Subtitles Box */}
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

      {/* Quick Prompts */}
      <div className="w-full max-w-sm flex items-center justify-center gap-1.5 flex-wrap">
        {[
          'कितने टास्क बचे हैं?',
          'Bike saving kitni hui?',
          'Khaata kholo',
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