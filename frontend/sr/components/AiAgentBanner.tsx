import React from 'react';
import { MessageSquare, Package, BarChart3, Target } from 'lucide-react';

interface AiAgentBannerProps {
  onActionClick: (prompt: string) => void;
}

export const Bot3DAvatar = ({ className = 'w-16 h-16' }: { className?: string }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    {/* Outer animated concentric rings */}
    <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-ping opacity-30" />
    <div className="absolute -inset-2 rounded-full border border-blue-400/20" />
    <div className="absolute -inset-4 rounded-full border border-blue-500/10" />

    {/* Bot Sphere Container */}
    <div className="w-full h-full rounded-full bg-gradient-to-tr from-blue-700 via-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-cyan-500/30 flex items-center justify-center">
      <div className="w-full h-full rounded-full bg-[#0d1730] flex items-center justify-center relative overflow-hidden">
        {/* Ambient glow inside */}
        <div className="absolute top-0 w-8 h-8 bg-cyan-400/30 blur-md rounded-full" />

        {/* Headphones left and right */}
        <div className="absolute left-0.5 w-1.5 h-4 bg-cyan-400 rounded-full shadow-xs shadow-cyan-300" />
        <div className="absolute right-0.5 w-1.5 h-4 bg-cyan-400 rounded-full shadow-xs shadow-cyan-300" />

        {/* Bot Face Visor */}
        <div className="w-10 h-6 rounded-full bg-[#050b18] border border-cyan-500/50 flex items-center justify-center gap-2 relative shadow-inner">
          {/* Eyes */}
          <div className="w-2 h-2 rounded-full bg-cyan-300 shadow-sm shadow-cyan-300 animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-cyan-300 shadow-sm shadow-cyan-300 animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

export default function AiAgentBanner({ onActionClick }: AiAgentBannerProps) {
  const actions = [
    { label: 'What needs attention?', icon: MessageSquare, prompt: 'What needs my attention today?' },
    { label: 'Check inventory', icon: Package, prompt: 'Show my low stock products' },
    { label: 'Analyze sales', icon: BarChart3, prompt: 'Analyze last 7 days sales' },
    { label: 'Optimize listings', icon: Target, prompt: 'Optimize my listings' },
  ];

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#0b1428] via-[#132247] to-[#1c1a4e] p-5 sm:p-6 text-white border border-blue-900/40 shadow-xl shadow-blue-950/10">
      {/* Background radial highlight & decorative geometry */}
      <div className="absolute -right-16 -bottom-16 w-64 h-64 rounded-full bg-blue-600/15 blur-3xl pointer-events-none" />
      <div className="absolute left-1/3 top-0 w-48 h-48 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        {/* Left Avatar + Title + Pills */}
        <div className="flex items-start sm:items-center gap-4 sm:gap-5">
          <Bot3DAvatar className="w-16 h-16 sm:w-20 sm:h-20 shrink-0" />
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
              Your AI Seller Agent is ready
            </h2>
            <p className="text-xs text-indigo-200/90 mt-0.5">
              Analyze. Optimize. Grow. — All in one place.
            </p>

            {/* Quick Action Pills */}
            <div className="flex flex-wrap gap-2 mt-3.5">
              {actions.map((act, index) => {
                const Icon = act.icon;
                return (
                  <button
                    key={index}
                    onClick={() => onActionClick(act.prompt)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-white/95 border border-white/15 text-xs font-medium backdrop-blur-xs transition-all cursor-pointer"
                  >
                    <Icon className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                    <span>{act.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Floating Quote Card */}
        <div className="hidden lg:block shrink-0 max-w-[260px]">
          <div className="rounded-2xl bg-white/8 backdrop-blur-md border border-white/15 p-3.5 text-xs text-indigo-100 font-medium leading-relaxed shadow-lg">
            &ldquo;Turn your seller data into bigger opportunities. 🚀&rdquo;
          </div>
        </div>
      </div>
    </section>
  );
}
