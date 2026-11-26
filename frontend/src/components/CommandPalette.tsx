import React, { useState, useEffect, useRef } from 'react';
import { Search, Building2, Terminal, Film, ShieldAlert, Users, Layers, User, X, CornerDownLeft, FolderGit2, CheckSquare, MessageSquare } from 'lucide-react';
import { Agent, Project } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onNavigateTab: (tab: 'hq' | 'command' | 'vault' | 'qa' | 'workforce') => void;
  onSelectFloor: (floor: number) => void;
  onSelectAgent: (agent: Agent) => void;
  onSelectProject?: (projectId: string) => void;
  onOpenApprovals?: () => void;
  onOpenComms?: () => void;
  agents: Agent[];
  projects?: Project[];
}

export const CommandPalette: React.FC<Props> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onSelectFloor,
  onSelectAgent,
  onSelectProject,
  onOpenApprovals,
  onOpenComms,
  agents,
  projects = []
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const pages = [
    { id: 'hq', name: 'Virtual Headquarters', category: 'Navigation', icon: Building2 },
    { id: 'command', name: 'CEO Command Centre', category: 'Navigation', icon: Terminal },
    { id: 'vault', name: 'Media Vault', category: 'Navigation', icon: Film },
    { id: 'qa', name: 'Video QA Lab', category: 'Navigation', icon: ShieldAlert },
    { id: 'workforce', name: 'Workforce & Talent', category: 'Navigation', icon: Users }
  ];

  const floors = [
    { floor: 0, name: 'Floor 0: Executive Suite', subtitle: 'Arjun CEO, Marcus COO, AURI Mascot' },
    { floor: 1, name: 'Floor 1: Media Studio', subtitle: 'Darshan, Shrinithi, Vaishnavi, Shreyank' },
    { floor: 2, name: 'Floor 2: Marketing & Growth', subtitle: 'Ananya, Rohit' },
    { floor: 3, name: 'Floor 3: AI Video QA Lab', subtitle: 'Tarun QA, Kavya Compliance' },
    { floor: 4, name: 'Floor 4: Campus Outreach', subtitle: 'Iffah Quest, Jiya Research' },
    { floor: 5, name: 'Floor 5: RPA & Engineering Lab', subtitle: 'Pratham Tech Lead, Srijana' }
  ];

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const quickActions = [
    ...(onOpenApprovals ? [{ id: 'approvals', name: 'Open Approvals Queue', subtitle: 'Review pending Level 3 release & workforce gates', icon: CheckSquare }] : []),
    ...(onOpenComms ? [{ id: 'comms', name: 'Open Workforce Comms', subtitle: 'View inter-agent messages & send dispatches', icon: MessageSquare }] : []),
  ];

  const filteredActions = quickActions.filter(a => a.name.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q));
  const filteredPages = pages.filter(p => p.name.toLowerCase().includes(q));
  const filteredProjects = projects.filter(p =>
    (p.title || '').toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
  );
  const filteredFloors = floors.filter(f => f.name.toLowerCase().includes(q) || f.subtitle.toLowerCase().includes(q));
  const filteredAgents = agents.filter(a =>
    a.name.toLowerCase().includes(q) ||
    a.role.toLowerCase().includes(q) ||
    a.department.toLowerCase().includes(q)
  );

  const allResults: Array<{
    type: 'action' | 'page' | 'project' | 'floor' | 'agent';
    id: string;
    title: string;
    subtitle?: string;
    icon: any;
    data: any;
  }> = [
    ...filteredActions.map(a => ({
      type: 'action' as const,
      id: `action-${a.id}`,
      title: a.name,
      subtitle: a.subtitle,
      icon: a.icon,
      data: a.id
    })),
    ...filteredPages.map(p => ({
      type: 'page' as const,
      id: `page-${p.id}`,
      title: p.name,
      subtitle: 'Primary Navigation Page',
      icon: p.icon,
      data: p.id
    })),
    ...filteredProjects.map(p => ({
      type: 'project' as const,
      id: `project-${p.id}`,
      title: p.title || p.id,
      subtitle: `Project ${p.id} • ${p.status} (Open in Media Vault)`,
      icon: FolderGit2,
      data: p.id
    })),
    ...filteredFloors.map(f => ({
      type: 'floor' as const,
      id: `floor-${f.floor}`,
      title: f.name,
      subtitle: f.subtitle,
      icon: Layers,
      data: f.floor
    })),
    ...filteredAgents.map(a => ({
      type: 'agent' as const,
      id: `agent-${a.agent_id}`,
      title: a.name,
      subtitle: `${a.role} • Floor ${a.floor} (${a.status.replace('_', ' ')})`,
      icon: User,
      data: a
    }))
  ];

  const handleSelect = (index: number) => {
    const item = allResults[index];
    if (!item) return;
    if (item.type === 'action') {
      if (item.data === 'approvals') onOpenApprovals?.();
      if (item.data === 'comms') onOpenComms?.();
    } else if (item.type === 'page') {
      onNavigateTab(item.data);
    } else if (item.type === 'project') {
      onSelectProject?.(item.data);
      onNavigateTab('vault');
    } else if (item.type === 'floor') {
      onNavigateTab('hq');
      onSelectFloor(item.data);
    } else if (item.type === 'agent') {
      onNavigateTab('hq');
      onSelectFloor(item.data.floor);
      onSelectAgent(item.data);
    }
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, allResults.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + allResults.length) % Math.max(1, allResults.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSelect(selectedIndex);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Global Search Command Palette"
    >
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-slate-950/60">
          <Search className="w-5 h-5 text-slate-400 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search pages, floors, AI employees..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-500 hover:text-slate-300 rounded"
              title="Clear query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="ml-2 hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 border border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-slate-800/40">
          {allResults.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500 font-mono">
              No matching pages, floors, or employees found.
            </div>
          ) : (
            allResults.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(idx)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                    isSelected ? 'bg-orange-600/20 text-orange-200 border border-orange-500/30' : 'text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold truncate text-slate-100">
                        {item.title}
                      </div>
                      {item.subtitle && (
                        <div className="text-[10px] text-slate-400 font-mono truncate">
                          {item.subtitle}
                        </div>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <CornerDownLeft className="w-3.5 h-3.5 text-orange-400 shrink-0 ml-2" />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px] font-mono text-slate-500">
          <div className="flex items-center space-x-3">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
            <span>ESC Close</span>
          </div>
          <span className="text-slate-400 font-semibold">AUTONOMIA Global Search</span>
        </div>
      </div>
    </div>
  );
};
