'use client';

import React, { useState } from 'react';
import { Clipboard, Copy, Check, Trash2, X, Send, Zap, Smartphone } from 'lucide-react';

export interface ClipItem {
  id: string;
  content: string;
}

interface InstantDropModalProps {
  isOpen: boolean;
  onClose: () => void;
  clips: ClipItem[];
  onAddClip: (text: string) => Promise<void>;
  onDeleteClip: (id: string) => Promise<void>;
}

export const InstantDropModal: React.FC<InstantDropModalProps> = ({
  isOpen,
  onClose,
  clips,
  onAddClip,
  onDeleteClip,
}) => {
  const [input, setInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const handleDrop = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending) return;
    setIsSending(true);
    try {
      await onAddClip(input.trim());
      setInput('');
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-neutral-900 border border-white/15 rounded-3xl p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Clipboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                Instant Drop <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              </h3>
              <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                <Smartphone className="w-3 h-3" /> Phone ↔ Laptop Realtime Clipboard
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleDrop} className="space-y-2">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Link, OTP, code snippet ya note yahan drop karo..."
            className="w-full bg-black/60 border border-white/10 focus:border-amber-500/50 rounded-2xl p-3 text-xs text-white placeholder-neutral-500 outline-none resize-none font-mono"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-black font-bold text-xs py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition active:scale-95"
          >
            <Send className="w-3.5 h-3.5" /> Drop to All Devices
          </button>
        </form>

        {/* Active Clips List */}
        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
            Synced Clips ({clips.length})
          </span>

          {clips.length === 0 ? (
            <div className="text-center py-8 bg-neutral-950/50 border border-white/5 rounded-2xl">
              <p className="text-xs text-neutral-500">Clipboard khali hai. Kuch drop karke dekho!</p>
            </div>
          ) : (
            clips.map((clip) => (
              <div
                key={clip.id}
                className="p-3 bg-neutral-950/90 border border-white/10 rounded-2xl flex items-start justify-between gap-2 group"
              >
                <p className="text-xs text-neutral-200 font-mono break-all line-clamp-3 flex-1">
                  {clip.content}
                </p>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleCopy(clip.id, clip.content)}
                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1 transition active:scale-95 ${
                      copiedId === clip.id
                        ? 'bg-emerald-500 text-black'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {copiedId === clip.id ? (
                      <>
                        <Check className="w-3 h-3" /> Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onDeleteClip(clip.id)}
                    className="p-1.5 text-neutral-500 hover:text-rose-400 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};