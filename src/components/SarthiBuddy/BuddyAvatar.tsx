'use client';

import React from 'react';
import { BuddyCharacter } from './buddyDialogues';

export type AvatarState = 'walking' | 'standing' | 'happy' | 'sad';

interface BuddyAvatarProps {
  character: BuddyCharacter;
  state: AvatarState;
  direction?: 'left' | 'right';
  className?: string;
}

export const BuddyAvatar: React.FC<BuddyAvatarProps> = ({
  character,
  state,
  direction = 'right',
  className = '',
}) => {
  const isVeer = character === 'veer';
  const isFlipped = direction === 'left';

  // State-specific 3D Stylized Bitmoji Asset mappings
  // Agar aapke paas custom GIF/WebM hain toh public/avatars/veer-walk.webm yaha laga sakte hain
  return (
    <div
      className={`relative select-none pointer-events-none transition-transform duration-300 ${className}`}
      style={{
        width: '140px',
        height: '240px',
        transform: isFlipped ? 'scaleX(-1)' : 'scaleX(1)',
        transformOrigin: 'bottom center',
      }}
    >
      {/* Dynamic 3D Rigging CSS Physics */}
      <style jsx>{`
        /* True 3/4 Perspective Walk Cycle with Pelvis & Knee Articulation */
        @keyframes bipedWalkBody {
          0% { transform: translateY(0px) rotate(4deg); }
          25% { transform: translateY(-8px) rotate(2deg); }
          50% { transform: translateY(0px) rotate(5deg); }
          75% { transform: translateY(-8px) rotate(3deg); }
          100% { transform: translateY(0px) rotate(4deg); }
        }

        @keyframes legBackAndForthLeft {
          0% { transform: rotate(28deg); }
          50% { transform: rotate(-26deg); }
          100% { transform: rotate(28deg); }
        }

        @keyframes legBackAndForthRight {
          0% { transform: rotate(-26deg); }
          50% { transform: rotate(28deg); }
          100% { transform: rotate(-26deg); }
        }

        @keyframes athleticRunCycle {
          0% { transform: translateY(0px) rotate(12deg); }
          50% { transform: translateY(-14px) rotate(10deg); }
          100% { transform: translateY(0px) rotate(12deg); }
        }

        @keyframes athleticLegL {
          0% { transform: rotate(45deg); }
          50% { transform: rotate(-40deg); }
          100% { transform: rotate(45deg); }
        }

        @keyframes athleticLegR {
          0% { transform: rotate(-40deg); }
          50% { transform: rotate(45deg); }
          100% { transform: rotate(-40deg); }
        }

        @keyframes idleBreathing {
          0%, 100% { transform: translateY(0px) scale(1); }
          50% { transform: translateY(-3px) scale(1.01); }
        }

        .rig-walking {
          animation: bipedWalkBody 0.85s infinite ease-in-out;
        }
        .rig-leg-l {
          animation: legBackAndForthLeft 0.85s infinite ease-in-out;
          transform-origin: 32px 30px;
        }
        .rig-leg-r {
          animation: legBackAndForthRight 0.85s infinite ease-in-out;
          transform-origin: 48px 30px;
        }

        .rig-running {
          animation: athleticRunCycle 0.45s infinite ease-in-out;
        }
        .rig-run-leg-l {
          animation: athleticLegL 0.45s infinite ease-in-out;
          transform-origin: 32px 30px;
        }
        .rig-run-leg-r {
          animation: athleticLegR 0.45s infinite ease-in-out;
          transform-origin: 48px 30px;
        }

        .rig-idle {
          animation: idleBreathing 2.4s infinite ease-in-out;
        }
      `}</style>

      {/* 3D Model Viewport (Profile Angle during Walk, Front Angle during Stop) */}
      <div className={`w-full h-full relative ${
        state === 'walking' ? 'rig-walking' :
        state === 'happy' ? 'rig-running' :
        state === 'standing' ? 'rig-idle' : ''
      }`}>
        
        {/* Floor Contact Ambient Occlusion */}
        <div 
          className="absolute bottom-1 left-4 w-24 h-4 bg-black/40 blur-md rounded-full -z-10"
          style={{ transform: state === 'happy' ? 'scale(1.2)' : 'scale(1)' }}
        />

        {/* 3D Stylized Character Rig (Rendered with 3/4 Human Anatomy) */}
        <svg
          viewBox="0 0 160 260"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_12px_24px_rgba(0,0,0,0.6)]"
        >
          <defs>
            <linearGradient id="denimShade" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#2563EB" />
              <stop offset="60%" stopColor="#1E40AF" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>

            <linearGradient id="hoodiePink" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="70%" stopColor="#BE185D" />
              <stop offset="100%" stopColor="#500724" />
            </linearGradient>

            <linearGradient id="skin3D" x1="0.3" y1="0" x2="0.7" y2="1">
              <stop offset="0%" stopColor="#FFE0C8" />
              <stop offset="70%" stopColor="#F6B88F" />
              <stop offset="100%" stopColor="#D98A5B" />
            </linearGradient>

            <linearGradient id="darkJeans" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0F172A" />
            </linearGradient>
          </defs>

          {/* --- LOWER BODY (Legs with Real Articulation) --- */}
          <g transform="translate(36, 120)">
            {/* Left Leg (Far side) */}
            <g className={state === 'walking' ? 'rig-leg-l' : state === 'happy' ? 'rig-run-leg-l' : ''}>
              <path
                d="M30 20 L24 65 L22 108"
                stroke="url(#darkJeans)"
                strokeWidth="15"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Sneaker */}
              <g transform="translate(10, 105)">
                <path d="M0 8 L6 0 Q18 0 24 4 L28 8 Z" fill={isVeer ? '#F97316' : '#EC4899'} />
                <rect x="0" y="8" width="28" height="6" rx="3" fill="#FFFFFF" />
              </g>
            </g>

            {/* Right Leg (Near side) */}
            <g className={state === 'walking' ? 'rig-leg-r' : state === 'happy' ? 'rig-run-leg-r' : ''}>
              <path
                d="M48 20 L56 65 L58 108"
                stroke="url(#darkJeans)"
                strokeWidth="16"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Sneaker */}
              <g transform="translate(46, 105)">
                <path d="M0 8 L6 0 Q18 0 24 4 L28 8 Z" fill={isVeer ? '#F97316' : '#EC4899'} />
                <rect x="0" y="8" width="28" height="6" rx="3" fill="#FFFFFF" />
              </g>
            </g>
          </g>

          {/* --- TORSO & 3/4 CHEST ANGLE --- */}
          <g transform="translate(36, 68)">
            {/* Layered streetwear inner shirt */}
            <path d="M22 20 L58 20 L56 75 L24 75 Z" fill="#F8FAFC" />

            {/* Bomber Denim Jacket (Veer) / Tech Hoodie (Siya) */}
            <path
              d="M16 16 Q40 10 64 16 L68 76 Q40 82 12 76 Z"
              fill={isVeer ? 'url(#denimShade)' : 'url(#hoodiePink)'}
            />

            {/* Jacket collar and 3D folds */}
            <path d="M24 16 L38 46 L34 76" stroke="#93C5FD" strokeWidth="2" fill="none" opacity="0.6" />
            <path d="M56 16 L44 46 L46 76" stroke="#93C5FD" strokeWidth="2" fill="none" opacity="0.6" />
          </g>

          {/* --- HEAD & 3/4 PROFILE GAZE --- */}
          <g transform="translate(36, 14)">
            {/* Neck */}
            <rect x="33" y="44" width="14" height="18" rx="4" fill="url(#skin3D)" />

            {/* 3D Jawline & Head Structure */}
            {state === 'walking' || state === 'happy' ? (
              // 3/4 Perspective Head (Looking in walk direction!)
              <g>
                <path
                  d="M24 30 C24 10, 56 10, 58 30 C58 48, 52 56, 42 56 C30 56, 24 48, 24 30 Z"
                  fill="url(#skin3D)"
                />
                {/* 3D Hair Swept Forward */}
                <path
                  d="M18 26 C18 6, 48 -2, 60 8 C68 16, 62 30, 58 32 C54 18, 42 16, 32 14 C24 20, 20 22, 18 26 Z"
                  fill="#18181B"
                />
                {/* 3/4 Profile Eye & Brow */}
                <ellipse cx="48" cy="28" rx="3.5" ry="4" fill="#18181B" />
                <circle cx="49" cy="27" r="1.2" fill="#FFFFFF" />
                <path d="M43 23 Q49 20 54 23" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" />
                {/* Nose Profile */}
                <path d="M56 28 L59 34 L54 36" stroke="#C28258" strokeWidth="2" fill="none" />
              </g>
            ) : (
              // Front Facing Head (When stopped to talk to Vedant!)
              <g>
                <path
                  d="M20 28 C20 8, 60 8, 60 28 C60 48, 52 58, 40 58 C28 58, 20 48, 20 28 Z"
                  fill="url(#skin3D)"
                />
                <path
                  d="M16 24 C16 4, 44 -2, 62 4 C68 14, 64 26, 60 28 C54 14, 42 16, 30 12 C22 18, 18 20, 16 24 Z"
                  fill="#18181B"
                />
                {/* Stubble / Beard for Veer */}
                {isVeer && (
                  <path d="M26 44 Q40 58 54 44" stroke="#27272A" strokeWidth="3" opacity="0.6" strokeLinecap="round" />
                )}
                {/* Two Eyes */}
                <circle cx="32" cy="28" r="3.2" fill="#18181B" />
                <circle cx="48" cy="28" r="3.2" fill="#18181B" />
                <circle cx="33" cy="27" r="1" fill="#FFFFFF" />
                <circle cx="49" cy="27" r="1" fill="#FFFFFF" />
                {/* Mouth */}
                <path d="M34 44 Q40 48 46 44" stroke="#18181B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              </g>
            )}
          </g>

          {/* --- ARMS & 3D BOTTLE HELD IN HAND --- */}
          <g transform="translate(36, 74)">
            {/* Left Arm: Holding Water Bottle naturally */}
            <path
              d="M18 16 Q8 40 18 64"
              stroke={isVeer ? 'url(#denimShade)' : 'url(#hoodiePink)'}
              strokeWidth="13"
              strokeLinecap="round"
            />
            {/* Hand */}
            <circle cx="18" cy="64" r="6" fill="url(#skin3D)" />

            {/* 3D Translucent Water Bottle */}
            <g transform="translate(10, 46)">
              <rect x="0" y="6" width="16" height="32" rx="5" fill="#38BDF8" stroke="#FFFFFF" strokeWidth="1.5" />
              <rect x="4" y="0" width="8" height="6" rx="2" fill="#FFFFFF" />
              {/* Water Fill Line */}
              <rect x="2" y="16" width="12" height="20" rx="3" fill="#0284C7" opacity="0.75" />
            </g>

            {/* Right Arm: Natural Swing / Gesture */}
            <path
              d={state === 'happy' ? 'M62 16 Q78 4 72 -14' : 'M62 16 Q76 44 64 68'}
              stroke={isVeer ? 'url(#denimShade)' : 'url(#hoodiePink)'}
              strokeWidth="13"
              strokeLinecap="round"
            />
            <circle cx={state === 'happy' ? 72 : 64} cy={state === 'happy' ? -14 : 68} r="6" fill="url(#skin3D)" />
          </g>
        </svg>
      </div>
    </div>
  );
};