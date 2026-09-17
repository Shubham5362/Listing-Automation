import React from 'react';

interface ProductCatalogGraphicProps {
  type: string;
  className?: string;
  large?: boolean;
}

export default function ProductCatalogGraphic({
  type,
  className = 'w-9 h-9',
  large = false,
}: ProductCatalogGraphicProps) {
  const iconSize = large ? 'w-16 h-16' : 'w-7 h-7';

  switch (type) {
    case 'bottle-black':
    case 'SB-1L-001':
      return (
        <div
          className={`${className} rounded-lg bg-slate-900/5 border border-slate-200/80 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs group-hover:border-slate-300 transition-colors`}
        >
          <svg viewBox="0 0 40 40" className={`${iconSize} drop-shadow-xs`}>
            {/* Bottle cap */}
            <rect x="17" y="5" width="6" height="4" rx="1.5" fill="#475569" />
            <rect x="18" y="9" width="4" height="2" fill="#94A3B8" />
            {/* Neck */}
            <path d="M16 11h8l1 3H15l1-3z" fill="#334155" />
            {/* Body */}
            <rect x="14" y="14" width="12" height="20" rx="3" fill="#1E293B" />
            {/* Metallic highlight */}
            <path d="M16 15h2v17h-2z" fill="#475569" opacity="0.6" />
            <rect x="14" y="32" width="12" height="2" rx="1" fill="#0F172A" />
          </svg>
        </div>
      );

    case 'tumbler':
    case 'IT-500-002':
      return (
        <div
          className={`${className} rounded-lg bg-slate-900/5 border border-slate-200/80 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs group-hover:border-slate-300 transition-colors`}
        >
          <svg viewBox="0 0 40 40" className={`${iconSize} drop-shadow-xs`}>
            {/* Lid */}
            <ellipse cx="20" cy="8" rx="8" ry="2" fill="#64748B" />
            <rect x="19" y="6" width="2" height="2" rx="0.5" fill="#94A3B8" />
            {/* Tapered Tumbler Body */}
            <path
              d="M12 9h16l-2.5 22a2 2 0 0 1-2 1.8h-7a2 2 0 0 1-2-1.8L12 9z"
              fill="#334155"
            />
            {/* Gloss line */}
            <path d="M15 10l2 20h2l-2-20z" fill="#475569" opacity="0.5" />
            {/* Base */}
            <ellipse cx="20" cy="31" rx="5.5" ry="1.2" fill="#1E293B" />
          </svg>
        </div>
      );

    case 'mug':
    case 'TM-PR-003':
      return (
        <div
          className={`${className} rounded-lg bg-slate-900/5 border border-slate-200/80 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs group-hover:border-slate-300 transition-colors`}
        >
          <svg viewBox="0 0 40 40" className={`${iconSize} drop-shadow-xs`}>
            {/* Lid */}
            <rect x="12" y="7" width="13" height="3" rx="1.5" fill="#334155" />
            <rect x="13" y="10" width="11" height="1.5" fill="#64748B" />
            {/* Mug Body */}
            <path
              d="M13 11.5h11l-1.5 19a2 2 0 0 1-2 1.8h-4a2 2 0 0 1-2-1.8L13 11.5z"
              fill="#1E293B"
            />
            {/* Ergonomic handle */}
            <path
              d="M24 14h3a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-3"
              fill="none"
              stroke="#334155"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Metallic band */}
            <rect x="13.2" y="16" width="10.6" height="2" fill="#94A3B8" opacity="0.8" />
          </svg>
        </div>
      );

    case 'bottle-blue':
    case 'WB-750-004':
      return (
        <div
          className={`${className} rounded-lg bg-blue-50/70 border border-blue-200/80 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs group-hover:border-blue-300 transition-colors`}
        >
          <svg viewBox="0 0 40 40" className={`${iconSize} drop-shadow-xs`}>
            {/* Flip cap */}
            <rect x="17" y="6" width="6" height="3" rx="1" fill="#0284C7" />
            <path d="M19 4h2v2h-2z" fill="#0369A1" />
            {/* Neck */}
            <rect x="16" y="9" width="8" height="3" fill="#38BDF8" />
            {/* Translucent blue body */}
            <rect x="14" y="12" width="12" height="22" rx="3" fill="#0284C7" />
            {/* Volume indicator markers */}
            <line x1="22" y1="16" x2="24" y2="16" stroke="#BAE6FD" strokeWidth="1" />
            <line x1="21" y1="20" x2="24" y2="20" stroke="#BAE6FD" strokeWidth="1" />
            <line x1="21" y1="24" x2="24" y2="24" stroke="#BAE6FD" strokeWidth="1" />
            <line x1="22" y1="28" x2="24" y2="28" stroke="#BAE6FD" strokeWidth="1" />
            {/* Bottle highlight */}
            <path d="M16 14h1.5v18H16z" fill="#7DD3FC" opacity="0.6" />
          </svg>
        </div>
      );

    case 'bottle-yellow':
    case 'KB-500-005':
      return (
        <div
          className={`${className} rounded-lg bg-amber-50/70 border border-amber-200/80 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs group-hover:border-amber-300 transition-colors`}
        >
          <svg viewBox="0 0 40 40" className={`${iconSize} drop-shadow-xs`}>
            {/* Spout lid */}
            <rect x="16" y="6" width="8" height="4" rx="2" fill="#F59E0B" />
            <circle cx="20" cy="5" r="1.5" fill="#D97706" />
            {/* Straw/Ring */}
            <path d="M15 10h10v2H15z" fill="#FBBF24" />
            {/* Yellow kids body */}
            <rect x="14" y="12" width="12" height="20" rx="3.5" fill="#FBBF24" />
            {/* Fun accent stripe */}
            <circle cx="20" cy="18" r="2" fill="#F59E0B" />
            <circle cx="20" cy="24" r="2" fill="#F59E0B" />
            {/* Base */}
            <rect x="14" y="30" width="12" height="2" rx="1" fill="#D97706" />
          </svg>
        </div>
      );

    case 'shaker-black':
    case 'GS-700-006':
      return (
        <div
          className={`${className} rounded-lg bg-slate-900/5 border border-slate-200/80 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs group-hover:border-slate-300 transition-colors`}
        >
          <svg viewBox="0 0 40 40" className={`${iconSize} drop-shadow-xs`}>
            {/* Dome cap with loop */}
            <path d="M16 8a4 4 0 0 1 8 0v2h-8V8z" fill="#475569" />
            <rect x="22" y="5" width="2" height="3" rx="1" fill="#0F172A" />
            {/* Screw rim */}
            <rect x="13" y="10" width="14" height="3" rx="1" fill="#334155" />
            {/* Body */}
            <path
              d="M14 13h12l-1.8 19a2 2 0 0 1-2 1.8h-4.4a2 2 0 0 1-2-1.8L14 13z"
              fill="#1E293B"
            />
            {/* Grip ridges */}
            <rect x="15" y="17" width="10" height="1.5" fill="#0F172A" />
            <rect x="15.5" y="21" width="9" height="1.5" fill="#0F172A" />
          </svg>
        </div>
      );

    case 'bottle-copper':
    case 'CW-1L-007':
      return (
        <div
          className={`${className} rounded-lg bg-orange-50/70 border border-orange-200/80 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs group-hover:border-orange-300 transition-colors`}
        >
          <svg viewBox="0 0 40 40" className={`${iconSize} drop-shadow-xs`}>
            {/* Copper Cap */}
            <rect x="17" y="5" width="6" height="4" rx="1.5" fill="#B45309" />
            {/* Neck */}
            <rect x="16" y="9" width="8" height="3" fill="#D97706" />
            {/* Lustrous Copper Body */}
            <rect x="14" y="12" width="12" height="22" rx="3" fill="#EA580C" />
            {/* Copper Sheen Highlight */}
            <path d="M16 13h2v20h-2z" fill="#FED7AA" opacity="0.6" />
            <path d="M22 13h1v20h-1z" fill="#9A3412" opacity="0.5" />
          </svg>
        </div>
      );

    case 'bottle-glass':
    case 'GB-1L-008':
      return (
        <div
          className={`${className} rounded-lg bg-cyan-50/60 border border-cyan-200/80 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs group-hover:border-cyan-300 transition-colors`}
        >
          <svg viewBox="0 0 40 40" className={`${iconSize} drop-shadow-xs`}>
            {/* Stainless steel lid */}
            <rect x="17" y="5" width="6" height="4" rx="1.5" fill="#94A3B8" />
            <rect x="18" y="9" width="4" height="2" fill="#CBD5E1" />
            {/* Clear glass body */}
            <rect
              x="14"
              y="11"
              width="12"
              height="23"
              rx="3"
              fill="#E0F2FE"
              stroke="#93C5FD"
              strokeWidth="1.5"
            />
            {/* Water level refraction line */}
            <path d="M15 20c2 1 4-1 5 0s3 1 5 0v12a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2V20z" fill="#BAE6FD" opacity="0.7" />
            {/* Glass reflection streak */}
            <line x1="16" y1="13" x2="16" y2="30" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
      );

    case 'flask-silver':
    case 'TF-1L-009':
      return (
        <div
          className={`${className} rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs group-hover:border-slate-300 transition-colors`}
        >
          <svg viewBox="0 0 40 40" className={`${iconSize} drop-shadow-xs`}>
            {/* Thermos cup cap */}
            <rect x="16" y="5" width="8" height="5" rx="2" fill="#64748B" />
            {/* Stopper line */}
            <rect x="17" y="10" width="6" height="2" fill="#475569" />
            {/* Stainless cylinder flask */}
            <rect x="13.5" y="12" width="13" height="22" rx="2.5" fill="#94A3B8" />
            {/* Metallic brushed vertical bands */}
            <path d="M15.5 13h3v20h-3z" fill="#E2E8F0" opacity="0.8" />
            <path d="M22 13h2v20h-2z" fill="#64748B" opacity="0.4" />
            {/* Base protector ring */}
            <rect x="13.5" y="32" width="13" height="2.5" rx="1" fill="#334155" />
          </svg>
        </div>
      );

    case 'sipper-pink':
    case 'KS-350-010':
      return (
        <div
          className={`${className} rounded-lg bg-rose-50/70 border border-rose-200/80 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs group-hover:border-rose-300 transition-colors`}
        >
          <svg viewBox="0 0 40 40" className={`${iconSize} drop-shadow-xs`}>
            {/* Dome flip cover */}
            <ellipse cx="20" cy="8" rx="5" ry="3" fill="#F43F5E" />
            {/* Dual handles */}
            <path
              d="M14 16c-3 0-5 3-5 7s2 7 5 7"
              fill="none"
              stroke="#FB7185"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M26 16c3 0 5 3 5 7s-2 7-5 7"
              fill="none"
              stroke="#FB7185"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Sipper cup body */}
            <path
              d="M14 11h12l-1.5 19a2 2 0 0 1-2 1.8h-5a2 2 0 0 1-2-1.8L14 11z"
              fill="#FB7185"
            />
            {/* Fun heart/star icon */}
            <circle cx="20" cy="20" r="2" fill="#FFF1F2" />
          </svg>
        </div>
      );

    default:
      return (
        <div
          className={`${className} rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center p-1 overflow-hidden shrink-0`}
        >
          <svg viewBox="0 0 40 40" className={`${iconSize} text-slate-500 fill-current`}>
            <rect x="14" y="10" width="12" height="20" rx="3" />
          </svg>
        </div>
      );
  }
}
