'use client';

import React, { useEffect } from 'react';
import { 
  Calendar, 
  ShoppingBag, 
  Wallet, 
  Sparkles, 
  Play, 
  Heart, 
  X, 
  Command 
} from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchModule: (mod: 'routine' | 'bazaar' | 'khaata') => void;
  onFocusInput: () => void;
  onTriggerJap: () => void;
  onOpenFocusSprint: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSwitchModule,
  onFocusInput,
  onTriggerJap,
  onOpenFocusSprint,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      title: 'Go to Routine Module',
      shortcut: '1',
      icon: <Calendar className="w-4 h-4 text-amber-400" />,
      action: () => { onSwitchModule('routine'); onClose(); },
    },
    {
      title: 'Go to Bazaar Vault',
      shortcut: '2',
      icon: <ShoppingBag className="w-4 h-4 text-emerald-400" />,
      action: () => { onSwitchModule('bazaar'); onClose(); },
    },
    {
      title: 'Go to Khaata Ledger',
      shortcut: '3',
      icon: <Wallet className="w-4 h-4 text-blue-400" />,
      action: () => { onSwitchModule('khaata'); onClose(); },
    },
    {
      title: 'Focus Universal Input Bar',
      shortcut: '/',
      icon: <Sparkles className="w-4 h-4 text-amber-400" />,
      action: () => { onFocusInput(); onClose(); },
    },
    {
      title: 'Start Deep Work Focus Sprint',
      shortcut: 'F',
      icon: <Play className="w-4 h-4 text-emerald-400" />,
      action: () => { onOpenFocusSprint(); onClose(); },
    },
    {
      title: '+1 Naam Jap Increment',
      shortcut: 'J',
      icon: <Heart className="w-4 h-4 text-rose-400" />,
      action: () => { onTriggerJap(); onClose(); },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-neutral-900 border border-white/15 rounded-3xl p-4 shadow-2xl space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Command className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Quick Actions</h3>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-1">
          {actions.map((item, idx) => (
            <button
              key={idx}
              onClick={item.action}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-800 active:bg-neutral-700 transition text-left group"
            >
              <div className="flex items-center gap-2.5">
                {item.icon}
                <span className="text-xs font-semibold text-neutral-200 group-hover:text-white">
                  {item.title}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-neutral-400">
                {item.shortcut}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};