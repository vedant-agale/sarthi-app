'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { BuddyAvatar, AvatarState } from './BuddyAvatar';
import { 
  BuddyCharacter, 
  TriggerType, 
  DialoguePayload, 
  getBuddyDialogue 
} from './buddyDialogues';
import { Sparkles, X, Volume2, VolumeX, Clock } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  category: string;
  target_date: string;
  is_completed: boolean;
}

interface SarthiBuddyProps {
  tasks?: Task[];
}

type BuddyStage = 'hidden' | 'walking_in' | 'prompting' | 'exiting_happy' | 'exiting_sad';

export const SarthiBuddy: React.FC<SarthiBuddyProps> = ({ tasks = [] }) => {
  const [character, setCharacter] = useState<BuddyCharacter>('veer');
  const [stage, setStage] = useState<BuddyStage>('hidden');
  const [avatarState, setAvatarState] = useState<AvatarState>('walking');
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [positionX, setPositionX] = useState<string>('-200px');
  const [dialogue, setDialogue] = useState<DialoguePayload | null>(null);
  const [activeSpeech, setActiveSpeech] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isAnswering, setIsAnswering] = useState<boolean>(false);

  // Load preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedChar = localStorage.getItem('sarthi_buddy_char') as BuddyCharacter;
      if (savedChar === 'veer' || savedChar === 'siya') {
        setCharacter(savedChar);
      }
    }
  }, []);

  const switchCharacter = (char: BuddyCharacter) => {
    setCharacter(char);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sarthi_buddy_char', char);
    }
  };

  const playChime = (type: 'happy' | 'sad' | 'pop') => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'happy') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === 'sad') {
        osc.frequency.setValueAtTime(329.63, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(220.00, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
        osc.start();
        osc.stop(ctx.currentTime + 0.08);
      }
    } catch {
      // AudioContext fallback
    }
  };

  // 🚶 Natural Human Walk-In Routine (3.5 Seconds Calm Pace)
  const triggerBuddy = (type: TriggerType = 'water') => {
    if (stage !== 'hidden') return;

    const chosenDialogue = getBuddyDialogue(type, character);
    setDialogue(chosenDialogue);
    setActiveSpeech(chosenDialogue.question);
    setIsAnswering(false);

    // Initial off-screen left position
    setDirection('right');
    setAvatarState('walking');
    setStage('walking_in');
    setPositionX('-200px');

    playChime('pop');

    // Walk gently to 32px inside the screen
    setTimeout(() => {
      setPositionX('32px');
    }, 60);

    // Arrive smoothly after 3.2s, halt and start prompting
    setTimeout(() => {
      setAvatarState('standing');
      setStage('prompting');
    }, 3200);
  };

  // 🟢 AUTOMATIC TRIGGERS (Auto Walk-In)
  useEffect(() => {
    // 1. Initial Welcome Trigger: App open hone ke theek 8 second baad apne aap aayega
    const welcomeTimer = setTimeout(() => {
      triggerBuddy('water');
    }, 8000);

    // 2. Real-World Scheduled Intervals (Har 45 minutes me auto check)
    const routineInterval = setInterval(() => {
      const today = new Date().toISOString().split('T')[0];
      const hasPendingLeetcode = tasks.some(t => t.category === 'leetcode' && !t.is_completed && t.target_date === today);
      const hasPendingGithub = tasks.some(t => t.category === 'github' && !t.is_completed && t.target_date === today);

      if (hasPendingLeetcode && Math.random() > 0.4) {
        triggerBuddy('leetcode');
      } else if (hasPendingGithub && Math.random() > 0.4) {
        triggerBuddy('github');
      } else {
        const triggers: TriggerType[] = ['water', 'posture'];
        triggerBuddy(triggers[Math.floor(Math.random() * triggers.length)]);
      }
    }, 45 * 60 * 1000);

    return () => {
      clearTimeout(welcomeTimer);
      clearInterval(routineInterval);
    };
  }, [tasks, character]);

  // 🏃 Response: User Clicked YES (Calm 3.8s Jog Exit)
  const handleYes = () => {
    if (!dialogue || isAnswering) return;
    setIsAnswering(true);
    setAvatarState('happy');
    setActiveSpeech(dialogue.onYes);
    playChime('happy');
    confetti({ particleCount: 70, spread: 65, origin: { x: 0.15, y: 0.85 } });

    // Allow user to read praise dialogue, then smoothly jog to the right
    setTimeout(() => {
      setStage('exiting_happy');
      setDirection('right');
      setPositionX('115vw'); // Smooth jog exit
    }, 1500);

    // Reset to hidden after jog is finished (3.8s duration)
    setTimeout(() => {
      setStage('hidden');
      setPositionX('-200px');
      setAvatarState('standing');
    }, 5300);
  };

  // 🚶 Response: User Clicked NO (Dejected 4.2s Walk-Back Left)
  const handleNo = () => {
    if (!dialogue || isAnswering) return;
    setIsAnswering(true);
    setAvatarState('sad');
    setActiveSpeech(dialogue.onNo);
    playChime('sad');

    // Turn around left & slowly walk back
    setTimeout(() => {
      setStage('exiting_sad');
      setDirection('left');
      setPositionX('-220px'); // Slow sad exit back to left
    }, 1600);

    // Reset to hidden after sad walk finishes
    setTimeout(() => {
      setStage('hidden');
      setPositionX('-200px');
      setAvatarState('standing');
    }, 5800);
  };

  const isVisible = stage !== 'hidden';

  return (
    <>
      {/* 🟢 Bottom Floating Companion Controls */}
      <div className="fixed bottom-3 right-3 z-40 flex items-center gap-2 bg-neutral-900/95 backdrop-blur-2xl border border-white/10 px-3 py-1.5 rounded-full shadow-2xl">
        <div className="flex items-center gap-1 text-[11px] font-bold">
          <button
            onClick={() => switchCharacter('veer')}
            className={`px-2.5 py-0.5 rounded-full transition ${
              character === 'veer' ? 'bg-blue-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Veer
          </button>
          <button
            onClick={() => switchCharacter('siya')}
            className={`px-2.5 py-0.5 rounded-full transition ${
              character === 'siya' ? 'bg-pink-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Siya
          </button>
        </div>

        <div className="h-3.5 w-px bg-white/10" />

        {/* Quick Manual Summon for instant testing */}
        <button
          onClick={() => triggerBuddy('water')}
          title="Instant Summon Test"
          className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 active:scale-95 transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Summon</span>
        </button>

        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="text-neutral-500 hover:text-neutral-300 p-0.5 transition"
          title={soundEnabled ? 'Mute Chimes' : 'Enable Chimes'}
        >
          {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-neutral-500" />}
        </button>
      </div>

      {/* 🟢 Live Character On-Screen Layer */}
      {isVisible && (
        <div
          className="fixed bottom-0 z-50 pointer-events-auto select-none"
          style={{
            left: positionX,
            transition: stage === 'walking_in' 
              ? 'left 4.0s cubic-bezier(0.25, 0.46, 0.45, 0.94)' 
              : stage === 'exiting_happy' 
              ? 'left 2.6s cubic-bezier(0.55, 0.085, 0.68, 0.53)' 
              : stage === 'exiting_sad' 
              ? 'left 4.5s ease-in-out' 
              : 'none',
          }}
        >
          <div className="relative flex flex-col items-start">
            
            {/* 💬 Apple Glassmorphism Speech Bubble */}
            {(stage === 'prompting' || stage === 'exiting_happy' || stage === 'exiting_sad') && (
              <div 
                className="absolute -top-36 left-12 w-64 bg-neutral-900/95 backdrop-blur-2xl border border-white/15 p-4 rounded-3xl shadow-2xl animate-in zoom-in-95 fade-in duration-300"
                style={{ zIndex: 60 }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                    character === 'veer' ? 'bg-blue-500/20 text-blue-400' : 'bg-pink-500/20 text-pink-400'
                  }`}>
                    {character === 'veer' ? 'Veer • Bro' : 'Siya • Accountability'}
                  </span>
                  
                  {!isAnswering && (
                    <button 
                      onClick={handleNo}
                      className="text-neutral-500 hover:text-white p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-xs font-semibold text-neutral-100 leading-snug">
                  {activeSpeech}
                </p>

                {/* YES / NO Interactive Buttons */}
                {!isAnswering && stage === 'prompting' && (
                  <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/10">
                    <button
                      onClick={handleYes}
                      className="flex-1 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-black font-black text-[11px] py-2 rounded-xl transition shadow-md"
                    >
                      ✓ Haan, Kiya!
                    </button>
                    <button
                      onClick={handleNo}
                      className="flex-1 bg-neutral-800 hover:bg-neutral-700 active:scale-95 text-rose-300 font-bold text-[11px] py-2 rounded-xl transition border border-white/5"
                    >
                      ✕ Nahi Kiya
                    </button>
                  </div>
                )}

                {/* Arrow Pointer */}
                <div 
                  className="absolute -bottom-2 left-6 w-3.5 h-3.5 bg-neutral-900/95 border-r border-b border-white/15 transform rotate-45"
                />
              </div>
            )}

            {/* 🧍 Humanoid Sprite Visual */}
            <BuddyAvatar
              character={character}
              state={avatarState}
              direction={direction}
              className="drop-shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
};