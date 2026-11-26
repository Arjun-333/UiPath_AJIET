import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Terminal,
  Film,
  ShieldAlert,
  Users,
  MessageSquare,
  ShieldCheck,
  Search,
  Settings,
  Check,
  ChevronDown,
  Layers,
  Sparkles,
  Command,
  HelpCircle,
  Activity
} from 'lucide-react';

interface Props {
  activeTab: 'hq' | 'command' | 'vault' | 'qa' | 'workforce';
  setActiveTab: (tab: 'hq' | 'command' | 'vault' | 'qa' | 'workforce') => void;
  connectionStatus: 'connected' | 'reconnecting' | 'disconnected';
  messagesCount: number;
  pendingApprovalsCount: number;
  isApprovalsOpen?: boolean;
  onOpenComms: () => void;
  onOpenApprovals: () => void;
  onOpenSearch: () => void;
  viewMode: string;
  onChangeViewMode: (mode: string) => void;
  user?: {
    name: string;
    role: string;
    organization: string;
  };
}

export const Header: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  connectionStatus,
  messagesCount,
  pendingApprovalsCount,
  isApprovalsOpen = false,
  onOpenComms,
  onOpenApprovals,
  onOpenSearch,
  viewMode,
  onChangeViewMode,
  user = { name: 'Arjun', role: 'Chief Executive Officer', organization: 'AJIET' }
}) => {
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.userAgent));
    }
  }, []);

  // Close account menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    if (accountMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [accountMenuOpen]);

  const navItems = [
    { id: 'hq' as const, label: 'Virtual HQ', icon: Building2 },
    { id: 'command' as const, label: 'CEO Command', icon: Terminal },
    { id: 'vault' as const, label: 'Media Vault', icon: Film },
    { id: 'qa' as const, label: 'Video QA', icon: ShieldAlert },
    { id: 'workforce' as const, label: 'Workforce', icon: Users }
  ];

  const formatCount = (count: number) => {
    if (count <= 0) return null;
    return count > 99 ? '99+' : `${count}`;
  };

  const connectionStatusLabel = {
    connected: 'Live Telemetry',
    reconnecting: 'Reconnecting...',
    disconnected: 'Offline'
  }[connectionStatus];

  const connectionDotColor = {
    connected: 'bg-emerald-400',
    reconnecting: 'bg-amber-400 animate-pulse',
    disconnected: 'bg-red-500'
  }[connectionStatus];

  return (
    <>
      {/* 1. Global Sticky Header (Target Desktop Height: ~56px) */}
      <header className="sticky top-0 z-40 w-full h-14 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 md:px-6 select-none shrink-0 flex items-center justify-between">
        {/* LEFT: Branding */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setActiveTab('hq')}
            className="flex items-center space-x-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 rounded-lg p-0.5"
            aria-label="AUTONOMIA Home - Virtual Headquarters"
          >
            {/* Logo Mark: Compact pixel glyph */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-md shadow-orange-600/20 group-hover:scale-105 transition-transform">
              <span className="font-pixel text-[11px] text-white font-bold tracking-tight">
                Ui
              </span>
            </div>
            {/* Wordmark */}
            <span className="font-pixel text-xs text-white tracking-widest group-hover:text-orange-400 transition-colors">
              AUTONOMIA
            </span>
          </button>
        </div>

        {/* CENTER: Primary Navigation (Hidden on mobile <= 768px, icon-only on < 1100px) */}
        <nav
          className="hidden md:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800/60 shadow-inner"
          aria-label="Primary Navigation"
        >
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                title={item.label}
                className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-orange-400'}`} />
                {/* Text label hidden between 768px and 1100px for icon-only presentation */}
                <span className="tracking-wide hidden xl:inline">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* RIGHT: Global Actions (Search, Comms, Approvals, User Avatar) */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* 1. Global Search (⌘K / Ctrl+K hint) */}
          <button
            onClick={onOpenSearch}
            className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/80 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
            title={`Search (${isMac ? '⌘K' : 'Ctrl+K'})`}
            aria-label="Open Global Search"
          >
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] text-slate-500 hidden sm:inline font-mono">
              {isMac ? '⌘K' : 'Ctrl K'}
            </span>
          </button>

          {/* 2. Communications (Neutral muted styling, never brighter than Approvals) */}
          <button
            onClick={onOpenComms}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800/80 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            title="Workforce Communications"
            aria-label={`Workforce Communications${messagesCount > 0 ? `, ${messagesCount} unread messages` : ''}`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden lg:inline">Comms</span>
            {formatCount(messagesCount) && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700 text-[9.5px] font-bold">
                {formatCount(messagesCount)}
              </span>
            )}
          </button>

          {/* 3. Approvals (Highest Priority: Solid Amber/Gold Fill with Dark Text) */}
          <button
            onClick={onOpenApprovals}
            className={`pixel-btn relative flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 ${
              isApprovalsOpen ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-slate-950 ' : ''
            }${pendingApprovalsCount > 0 ? 'animate-pixel-pulse ' : ''}bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-500/20`}
            title="CEO Level 3 Approvals Gate"
            aria-label={`Approvals Gate, ${pendingApprovalsCount} pending approvals`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-slate-950 stroke-[2.5]" />
            <span className="tracking-wide">Approvals</span>
            {formatCount(pendingApprovalsCount) && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-950 text-amber-300 text-[9.5px] font-extrabold shadow-sm">
                {formatCount(pendingApprovalsCount)}
              </span>
            )}
          </button>

          {/* 4. User Avatar / Account Dropdown with Sole Real-Time Connection Dot */}
          <div className="relative" ref={accountMenuRef}>
            <button
              onClick={() => setAccountMenuOpen(prev => !prev)}
              className="relative p-0.5 rounded-full hover:ring-2 hover:ring-slate-700 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              aria-expanded={accountMenuOpen}
              aria-haspopup="true"
              aria-label="User account settings and application preferences"
            >
              {/* User Avatar Circle */}
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold font-mono text-slate-200">
                {user.name.charAt(0)}
              </div>
              {/* Single Real-Time Connection Dot on the Avatar Corner */}
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ${connectionDotColor} border-2 border-slate-950`}
                title={`System Connection: ${connectionStatusLabel}`}
              />
            </button>

            {/* Account Dropdown Menu */}
            {accountMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 divide-y divide-slate-800/80 font-mono text-xs animate-in fade-in-50 duration-100"
                role="menu"
              >
                {/* User & Organization Info */}
                <div className="p-3.5 bg-slate-950/60">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-bold text-white text-sm shadow">
                      {user.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-slate-100 truncate text-sm">
                        {user.name}
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {user.role} • <span className="text-orange-400 font-semibold">{user.organization}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connection Status (TEXT ONLY, NO SECOND DOT) */}
                <div className="px-3.5 py-2.5 bg-slate-900/90 flex items-center justify-between text-slate-300">
                  <span className="text-slate-400">Connection Status</span>
                  <span className="font-semibold text-slate-200">{connectionStatusLabel}</span>
                </div>

                {/* View Mode Setting (Isometric vs Legacy generic viewMode) */}
                <div className="p-3.5 space-y-2">
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                    Virtual HQ View Mode
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-xl border border-slate-800/80">
                    <button
                      onClick={() => onChangeViewMode('isometric')}
                      className={`flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        viewMode === 'isometric'
                          ? 'bg-orange-600 text-white shadow-sm font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Isometric</span>
                    </button>
                    <button
                      onClick={() => onChangeViewMode('legacy')}
                      className={`flex items-center justify-center space-x-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        viewMode === 'legacy'
                          ? 'bg-orange-600 text-white shadow-sm font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>Legacy</span>
                    </button>
                  </div>
                </div>

                {/* Action Items */}
                <div className="p-2 space-y-0.5">
                  <button
                    onClick={() => {
                      setAccountMenuOpen(false);
                      setActiveTab('workforce');
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors text-left"
                  >
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Manage AI Workforce</span>
                  </button>
                  <button
                    onClick={() => {
                      setAccountMenuOpen(false);
                      onOpenSearch();
                    }}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-xl transition-colors text-left"
                  >
                    <Search className="w-3.5 h-3.5 text-slate-400" />
                    <span>Global Command Palette</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. Responsive Mobile Bottom Tab Bar (At <= 768px) */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-2xl border-t border-slate-800/80 px-2 pt-1 pb-[calc(0.5rem+env(safe-area-inset-bottom))] flex items-center justify-around select-none shadow-2xl"
        aria-label="Mobile Navigation"
      >
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-col items-center justify-center min-w-[56px] min-h-[44px] py-1 px-2 rounded-xl text-[10px] font-mono font-bold transition-all ${
                isActive
                  ? 'text-orange-400 bg-orange-600/15'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-orange-400' : 'text-slate-400'}`} />
              <span className="truncate max-w-[64px]">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
