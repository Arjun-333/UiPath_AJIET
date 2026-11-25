import React from 'react';
import {
  Building2,
  Terminal,
  Film,
  ShieldAlert,
  Users,
  MessageSquare,
  ShieldCheck,
  Radio,
  Sparkles,
  Zap
} from 'lucide-react';

interface Props {
  activeTab: 'hq' | 'command' | 'vault' | 'qa' | 'workforce';
  setActiveTab: (tab: 'hq' | 'command' | 'vault' | 'qa' | 'workforce') => void;
  wsConnected: boolean;
  messagesCount: number;
  pendingApprovalsCount: number;
  onOpenComms: () => void;
  onOpenApprovals: () => void;
}

export const Header: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  wsConnected,
  messagesCount,
  pendingApprovalsCount,
  onOpenComms,
  onOpenApprovals
}) => {
  const navItems = [
    {
      id: 'hq' as const,
      label: 'Virtual Headquarters',
      shortLabel: 'Virtual HQ',
      icon: Building2,
      badge: '2.0 ISO',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    },
    {
      id: 'command' as const,
      label: 'CEO Command Centre',
      shortLabel: 'Command',
      icon: Terminal,
      badge: 'EXEC',
      badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30'
    },
    {
      id: 'vault' as const,
      label: 'Media Vault',
      shortLabel: 'Vault',
      icon: Film,
      badge: '1080P',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    },
    {
      id: 'qa' as const,
      label: 'Video QA Lab',
      shortLabel: 'QA Lab',
      icon: ShieldAlert,
      badge: 'NEMO',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    },
    {
      id: 'workforce' as const,
      label: 'Workforce & Talent',
      shortLabel: 'Talent',
      icon: Users,
      badge: 'HR AI',
      badgeColor: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
    }
  ];

  return (
    <div className="relative w-full z-40 px-6 pt-3 pb-2 shrink-0 select-none">
      {/* 1. Subtle Retro Isometric Grid Watermark (Reference 2 Inspiration) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20 overflow-hidden"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 0%, rgba(249, 115, 22, 0.15) 0%, transparent 60%),
            linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 24px 24px, 24px 24px'
        }}
      />

      {/* 2. Top System Status Micro-Ticker (Reference 4 Top Banner Inspiration) */}
      <div className="relative w-full max-w-[1400px] mx-auto flex items-center justify-between px-4 py-1 text-[10px] font-mono tracking-wider text-slate-400 bg-slate-950/80 backdrop-blur-md rounded-t-xl border-t border-x border-slate-800/60 shadow-sm">
        <div className="flex items-center space-x-2">
          <span className="flex items-center space-x-1.5 text-emerald-400 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>● SYSTEM OPERATIONAL</span>
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-300 font-semibold truncate">
            AJIET DIGITAL MEDIA ENTERPRISE • AUTONOMOUS WORKFORCE ENGINE
          </span>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <span className="text-slate-400 hidden sm:inline">
            COORDINATOR: <span className="text-orange-400 font-bold">ARJUN (CEO)</span>
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-cyan-400 flex items-center space-x-1">
            <Radio className="w-3 h-3 text-cyan-400" />
            <span>2:1 ISOMETRIC TWIN // ONLINE</span>
          </span>
        </div>
      </div>

      {/* 3. Layered Card Depth Structure (Reference 4 Multi-Layered Floating Dock Inspiration) */}
      <div className="relative w-full max-w-[1400px] mx-auto">
        {/* Layer 1: Ambient Glow Shadow */}
        <div className="absolute -inset-1 bg-gradient-to-r from-orange-600/20 via-indigo-600/20 to-cyan-600/20 rounded-3xl blur-md opacity-75 group-hover:opacity-100 transition duration-1000 -z-10" />

        {/* Layer 2: Stacked Offset Card Silhouette (Reference 4 Visual Layer Effect) */}
        <div className="absolute -top-1 inset-x-3 h-full bg-gradient-to-b from-slate-800/40 to-slate-900/60 rounded-2xl border border-white/5 -z-10" />

        {/* Layer 3: Main Glassmorphic Capsule Dock */}
        <header className="relative flex items-center justify-between px-4 py-2 bg-slate-950/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl shadow-black/80">
          {/* A. Brand Crest & Identity (Reference 2 Pixel Art Logo + Ref 3 Styling) */}
          <div className="flex items-center space-x-3 shrink-0">
            {/* Custom Pixel Art Crest Monogram */}
            <div className="relative group cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 via-orange-600 to-amber-700 p-0.5 shadow-lg shadow-orange-600/30 transition-transform group-hover:scale-105">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center relative overflow-hidden">
                  <div
                    className="absolute inset-0 opacity-25"
                    style={{
                      backgroundImage: 'linear-gradient(to right, #ea580c 1px, transparent 1px), linear-gradient(to bottom, #ea580c 1px, transparent 1px)',
                      backgroundSize: '4px 4px'
                    }}
                  />
                  <span className="font-pixel text-[12px] text-orange-400 font-bold tracking-tight drop-shadow-[0_2px_4px_rgba(234,88,12,0.8)]">
                    Ui
                  </span>
                </div>
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border-2 border-slate-950" />
            </div>

            {/* Typography & Subtitle */}
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="font-pixel text-[11px] text-white tracking-widest drop-shadow-sm">
                  AUTONOMIA
                </span>
                <span className="px-1.5 py-0.5 rounded-full bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 text-[8.5px] font-mono font-bold border border-orange-500/40 shadow-sm shadow-orange-500/10">
                  AJIET MEDIA CO
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-[9.5px] text-slate-400 font-mono">
                <span>Digital Media Org</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 font-semibold">v2.4 Core</span>
              </div>
            </div>
          </div>

          {/* B. Center Segmented Capsule Navigation Dock (Reference 4 Capsule Dock Style) */}
          <nav className="flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80 shadow-inner shrink-0">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`group relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-lg shadow-orange-600/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-orange-400'}`} />
                  <span className="tracking-wide">{item.label}</span>

                  {/* Micro badge indicator */}
                  <span
                    className={`ml-1 text-[8.5px] px-1 py-0.2 rounded border transition-colors ${
                      isActive
                        ? 'bg-black/30 text-white/90 border-white/20'
                        : `${item.badgeColor} opacity-70 group-hover:opacity-100`
                    }`}
                  >
                    {item.badge}
                  </span>

                  {/* Active bottom neon glow bar */}
                  {isActive && (
                    <span className="absolute bottom-0 inset-x-2 h-0.5 bg-white/80 rounded-full shadow-[0_0_8px_#fff]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* C. Right Status & Executive Action Suite */}
          <div className="flex items-center space-x-2 shrink-0">
            {/* Workforce Comms Button with Notification Count */}
            <button
              onClick={onOpenComms}
              className="relative flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-500/40 transition-all shadow-md shadow-cyan-950/40 group"
              title="Open Workforce Communications Feed"
            >
              <MessageSquare className="w-3.5 h-3.5 text-cyan-400 transition-transform group-hover:scale-110" />
              <span>Comms</span>
              {messagesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-cyan-400 text-slate-950 text-[9.5px] font-bold shadow-sm">
                  {messagesCount}
                </span>
              )}
            </button>

            {/* WebSocket Telemetry Status Beacon */}
            <div
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono bg-slate-900/80 border border-slate-800/80 shadow-inner"
              title={wsConnected ? 'WebSocket Live Telemetry Connected' : 'Connecting to Backend Bus...'}
            >
              <span className="relative flex h-2 w-2">
                {wsConnected && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${wsConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              </span>
              <span className={`text-[10px] font-bold ${wsConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                {wsConnected ? 'LIVE' : 'SYNCING'}
              </span>
            </div>

            {/* Level 3 Approval Gate Button (Strict CEO Permission Boundary) */}
            <button
              onClick={onOpenApprovals}
              className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all duration-200 ${
                pendingApprovalsCount > 0
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-400 shadow-lg shadow-orange-600/30 animate-pulse'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800/80 hover:text-white'
              }`}
              title="CEO Level 3 Approval Gate: Authorize Consequential Actions"
            >
              <ShieldCheck className={`w-3.5 h-3.5 ${pendingApprovalsCount > 0 ? 'text-white' : 'text-amber-400'}`} />
              <span>Approvals</span>
              {pendingApprovalsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white text-orange-600 text-[9.5px] font-bold shadow">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          </div>
        </header>
      </div>
    </div>
  );
};
