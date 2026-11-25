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
  Sparkles
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
      label: 'Virtual HQ',
      icon: Building2
    },
    {
      id: 'command' as const,
      label: 'CEO Command',
      icon: Terminal
    },
    {
      id: 'vault' as const,
      label: 'Media Vault',
      icon: Film
    },
    {
      id: 'qa' as const,
      label: 'Video QA',
      icon: ShieldAlert
    },
    {
      id: 'workforce' as const,
      label: 'Workforce',
      icon: Users
    }
  ];

  return (
    <header className="relative w-full z-40 px-6 py-2 shrink-0 select-none">
      {/* Subtle top ambient glow */}
      <div className="absolute top-0 inset-x-12 h-6 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-cyan-500/10 blur-xl pointer-events-none -z-10" />

      {/* Main Streamlined Floating Capsule Dock */}
      <div className="relative w-full max-w-[1400px] mx-auto flex items-center justify-between px-4 py-2 bg-slate-950/85 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-xl shadow-black/60">
        
        {/* Left: Brand & Organization Identity */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Custom Pixel Art Crest Monogram */}
          <div className="relative group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 via-orange-600 to-amber-700 p-0.5 shadow-md shadow-orange-600/30 transition-transform group-hover:scale-105">
              <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center relative overflow-hidden">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: 'linear-gradient(to right, #ea580c 1px, transparent 1px), linear-gradient(to bottom, #ea580c 1px, transparent 1px)',
                    backgroundSize: '4px 4px'
                  }}
                />
                <span className="font-pixel text-[11px] text-orange-400 font-bold tracking-tight drop-shadow-[0_2px_4px_rgba(234,88,12,0.8)]">
                  Ui
                </span>
              </div>
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-slate-950" />
          </div>

          {/* Clean Typography */}
          <div className="flex items-center space-x-2">
            <span className="font-pixel text-xs text-white tracking-widest drop-shadow-sm">
              AUTONOMIA
            </span>
            <span className="px-1.5 py-0.5 rounded-md bg-orange-500/15 text-orange-400 text-[9px] font-mono font-bold border border-orange-500/30">
              AJIET
            </span>
            <span className="hidden md:inline-flex items-center text-[10px] text-slate-500 font-mono">
              <span className="w-1 h-1 rounded-full bg-slate-700 mr-2" />
              CEO: <span className="text-slate-300 font-semibold ml-1">Arjun</span>
            </span>
          </div>
        </div>

        {/* Center: Clean Segmented Capsule Navigation */}
        <nav className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800/80 shadow-inner">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-orange-400'}`} />
                <span className="tracking-wide">{item.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 inset-x-2 h-0.5 bg-white/70 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: Actions & Live Telemetry Suite */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Workforce Comms */}
          <button
            onClick={onOpenComms}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-cyan-950/40 hover:bg-cyan-900/50 text-cyan-300 border border-cyan-500/40 transition-all shadow-sm group"
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

          {/* WebSocket Status Pip */}
          <div
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono bg-slate-900/80 border border-slate-800/80"
            title={wsConnected ? 'Live Telemetry Connected' : 'Connecting to Backend Bus...'}
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

          {/* Approvals Gate */}
          <button
            onClick={onOpenApprovals}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all duration-150 ${
              pendingApprovalsCount > 0
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-400 shadow-md shadow-orange-600/30 animate-pulse'
                : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:bg-slate-800/80 hover:text-white'
            }`}
            title="CEO Level 3 Approval Gate"
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${pendingApprovalsCount > 0 ? 'text-white' : 'text-amber-400'}`} />
            <span>Approvals</span>
            {pendingApprovalsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-orange-600 text-[9.5px] font-bold shadow-sm">
                {pendingApprovalsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
