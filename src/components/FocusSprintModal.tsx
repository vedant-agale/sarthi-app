'use client';

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Play, Pause, RotateCcw, X, CheckCircle2, Flame } from 'lucide-react';

interface FocusSprintProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle?: string;
  onCompleteTask?: () => void;
}

export const FocusSprintModal: React.FC<FocusSprintProps> = ({
  isOpen,
  onClose,
  taskTitle = 'Deep Work Session',
  onCompleteTask,
}) => {
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setTimeLeft(durationMinutes * 60);
    setIsActive(false);
  }, [durationMinutes]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isActive) {
      setIsActive(false);
      confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      if (onCompleteTask) onCompleteTask();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onCompleteTask]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progressPercent = ((durationMinutes * 60 - timeLeft) / (durationMinutes * 60)) * 100;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6 animate-in zoom-in-95 duration-200">
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-2 rounded-full bg-neutral-900 border border-white/10 text-neutral-400 hover:text-white"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="w-full max-w-xs text-center space-y-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
          <Flame className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span>Deep Work Zen Sprint</span>
        </div>

        <h2 className="text-base font-bold text-white truncate max-w-xs">
          {taskTitle}
        </h2>

        {/* Circular Display */}
        <div className="relative w-56 h-56 mx-auto flex flex-col items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="#262626"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="#F59E0B"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={276.46}
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-4xl font-black font-mono tracking-tight text-white">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest mt-1">Remaining</span>
          </div>
        </div>

        {/* Preset Selector */}
        {!isActive && (
          <div className="flex justify-center gap-2">
            {[15, 25, 45].map((m) => (
              <button
                key={m}
                onClick={() => setDurationMinutes(m)}
                className={`px-3 py-1 rounded-xl text-xs font-bold font-mono transition ${
                  durationMinutes === m
                    ? 'bg-amber-500 text-black'
                    : 'bg-neutral-900 border border-white/10 text-neutral-400 hover:text-white'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        )}

        {/* Timer Controls */}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setTimeLeft(durationMinutes * 60)}
            className="p-3 rounded-2xl bg-neutral-900 border border-white/10 text-neutral-400 hover:text-white active:scale-95 transition"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsActive(!isActive)}
            className="px-6 py-3 rounded-2xl bg-white text-black font-black text-xs flex items-center gap-2 active:scale-95 transition shadow-lg"
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-black" />}
            <span>{isActive ? 'Pause' : 'Start Focus'}</span>
          </button>

          {onCompleteTask && (
            <button
              onClick={() => {
                onCompleteTask();
                onClose();
              }}
              className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 active:scale-95 transition"
              title="Mark as Complete"
            >
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};