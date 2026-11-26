import React, { useState, useEffect, Suspense, lazy, Component, ReactNode } from 'react';
import { Agent, Project, Approval, RosterSummary, AgentMessage, AgentTransitEvent } from './types';
import { VirtualHeadquarters } from './components/VirtualHeadquarters';
import { EmployeeInspector } from './components/EmployeeInspector';
import { Header } from './components/Header';
import { CommandPalette } from './components/CommandPalette';
import { ToastProvider, useToast } from './components/Toast';
import { ShortcutsModal } from './components/ShortcutsModal';

class TabErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    if (/dynamically imported module|Loading chunk|ChunkLoadError/i.test(error?.message || '')) {
      window.location.reload();
    }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-xs font-mono text-slate-300">
          <p>A new build was deployed or this view hit an error.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#fa4616] text-white rounded-lg font-bold cursor-pointer"
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const CeoCommandCenter = lazy(() => import('./components/CeoCommandCenter').then(m => ({ default: m.CeoCommandCenter })));
const MediaVault = lazy(() => import('./components/MediaVault').then(m => ({ default: m.MediaVault })));
const VideoQualityInspector = lazy(() => import('./components/VideoQualityInspector').then(m => ({ default: m.VideoQualityInspector })));
const WorkforceManagementView = lazy(() => import('./components/workforce/WorkforceManagementView').then(m => ({ default: m.WorkforceManagementView })));
const ApprovalsModal = lazy(() => import('./components/ApprovalsModal').then(m => ({ default: m.ApprovalsModal })));
const WorkforceCommsCenter = lazy(() => import('./components/WorkforceCommsCenter').then(m => ({ default: m.WorkforceCommsCenter })));

const getInitialTab = (): 'hq' | 'command' | 'vault' | 'qa' | 'workforce' => {
  if (typeof window !== 'undefined') {
    const hash = window.location.hash.replace('#', '');
    if (['hq', 'command', 'vault', 'qa', 'workforce'].includes(hash)) {
      return hash as any;
    }
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['hq', 'command', 'vault', 'qa', 'workforce'].includes(tab)) {
      return tab as any;
    }
  }
  return 'hq';
};

const AppInner: React.FC = () => {
  const { addToast } = useToast();
  const [activeTab, setActiveTabState] = useState<'hq' | 'command' | 'vault' | 'qa' | 'workforce'>(getInitialTab);

  const setActiveTab = (tab: 'hq' | 'command' | 'vault' | 'qa' | 'workforce') => {
    setActiveTabState(tab);
    if (typeof window !== 'undefined') {
      window.history.replaceState(null, '', '#' + tab);
    }
  };
  const [activeFloor, setActiveFloor] = useState<number>(0);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [selectedProjectId, setSelectedProjectIdState] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('project') || 'proj_02bbb199';
    }
    return 'proj_02bbb199';
  });

  const setSelectedProjectId = (idOrUpdater: string | ((prev: string) => string)) => {
    setSelectedProjectIdState((prev) => {
      const next = typeof idOrUpdater === 'function' ? idOrUpdater(prev) : idOrUpdater;
      if (typeof window !== 'undefined' && next) {
        const url = new URL(window.location.href);
        url.searchParams.set('project', next);
        window.history.replaceState(null, '', url.pathname + url.search + window.location.hash);
      }
      return next;
    });
  };
  const [summary, setSummary] = useState<RosterSummary>({
    total_agents: 14,
    active_agents: 0,
    idle_agents: 14,
    error_agents: 0,
    floors_count: 6
  });
  const [orbiState, setOrbiState] = useState<string>('idle');
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showApprovalsModal, setShowApprovalsModal] = useState<boolean>(false);
  const [showCommsModal, setShowCommsModal] = useState<boolean>(false);
  const [showCommandPalette, setShowCommandPalette] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [pendingTransit, setPendingTransit] = useState<AgentTransitEvent | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'reconnecting' | 'disconnected'>('disconnected');

  // Generic View Mode Setting (stored in localStorage)
  const [viewMode, setViewMode] = useState<'isometric' | 'legacy'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('view') === 'legacy') return 'legacy';
      const saved = localStorage.getItem('autonomia_preferences_view_mode');
      return saved === 'legacy' ? 'legacy' : 'isometric';
    }
    return 'isometric';
  });

  const handleViewModeChange = (mode: string) => {
    const normalized: 'isometric' | 'legacy' = mode === 'legacy' ? 'legacy' : 'isometric';
    setViewMode(normalized);
    if (typeof window !== 'undefined') {
      localStorage.setItem('autonomia_preferences_view_mode', normalized);
    }
  };

  // Load initial REST data
  const fetchData = async () => {
    try {
      const [agentsRes, projRes, apprRes, msgRes] = await Promise.all([
        fetch('/api/agents').then(r => r.json()),
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/approvals').then(r => r.json()),
        fetch('/api/messages').then(r => r.json()).catch(() => [])
      ]);

      if (agentsRes.agents) setAgents(agentsRes.agents);
      if (agentsRes.summary) setSummary(agentsRes.summary);
      if (projRes && Array.isArray(projRes)) {
        setProjects(projRes);
        setSelectedProjectId(prev => {
          if (prev && (prev === 'proj_02bbb199' || projRes.some((p: any) => p.id === prev))) {
            return prev;
          }
          const ready = projRes.find((p: any) => p.id === 'proj_02bbb199') || projRes.find((p: any) => p.status === 'completed') || projRes[0];
          return ready ? ready.id : 'proj_02bbb199';
        });
      }
      if (apprRes) setApprovals(apprRes);
      if (Array.isArray(msgRes)) setMessages(msgRes);
    } catch (err) {
      console.warn("API poll notice:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 4000);

    // WebSocket setup
    let ws: WebSocket | null = null;
    const connectWs = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      ws = new WebSocket(wsUrl);

      ws.onopen = () => setConnectionStatus('connected');
      ws.onclose = () => {
        setConnectionStatus('reconnecting');
        setTimeout(connectWs, 3000);
      };
      ws.onerror = () => {
        setConnectionStatus('disconnected');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === 'mascot_update') {
            setOrbiState(msg.data.state || 'idle');
          } else if (msg.event === 'task_started') {
            setOrbiState('working');
            addToast({
              type: 'info',
              title: 'Pipeline Task Started',
              message: msg.data?.title || msg.data?.agent_id || 'Agent began executing a workflow step.'
            });
            fetchData();
          } else if (msg.event === 'task_completed') {
            fetchData();
          } else if (msg.event === 'project_completed') {
            setOrbiState('celebrating');
            addToast({
              type: 'success',
              title: 'Production Pipeline Completed',
              message: msg.data?.title || 'Media assets are ready in Media Vault.'
            });
            fetchData();
          } else if (msg.event === 'approval_requested') {
            setOrbiState('waiting');
            addToast({
              type: 'approval',
              title: 'Approval Required (Level 3)',
              message: msg.data?.description || 'A release or workforce gate awaits your review.'
            });
            fetchData();
          } else if (msg.event === 'agent_message') {
            setMessages(prev => {
              const incoming = msg.data;
              const key = incoming?.id || `${incoming?.created_at}-${incoming?.sender_id}-${incoming?.content}`;
              if (prev.some(m => (m.id || `${m.created_at}-${m.sender_id}-${m.content}`) === key)) {
                return prev;
              }
              return [...prev, incoming];
            });
          } else if (msg.event === 'agent_transit') {
            setPendingTransit(msg.data);
          } else if (msg.event === 'employee_lifecycle_changed' || msg.event === 'workforce_alert') {
            if (msg.event === 'workforce_alert') {
              addToast({
                type: 'warning',
                title: 'Workforce Alert',
                message: msg.data?.message || 'Check Workforce & Talent Advisor for details.'
              });
            }
            fetchData();
          }
        } catch (e) {
          console.error("WS parse error", e);
        }
      };
    };

    connectWs();
    const handleCustomRefresh = () => fetchData();
    window.addEventListener('autonomia_refresh_data', handleCustomRefresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('autonomia_refresh_data', handleCustomRefresh);
      if (ws) ws.close();
    };
  }, []);

  const handleSendCommand = async (command: string) => {
    setOrbiState('thinking');
    const res = await fetch('/api/ceo/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command })
    });
    fetchData();
  };

  const handleResolveApproval = async (approvalId: string, action: 'approve' | 'reject', feedback: string) => {
    try {
      const res = await fetch(`/api/approvals/${approvalId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, feedback })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: 'Failed to process approval.' }));
        throw new Error(errorData.detail || errorData.error || 'Server rejected approval resolution.');
      }
    } finally {
      await fetchData();
    }
  };

  const handleResolveAllApprovals = async (action: 'approve' | 'reject', feedback: string) => {
    const pending = approvals.filter(a => a.status === 'pending');
    const errors: string[] = [];
    for (const appr of pending) {
      const res = await fetch(`/api/approvals/${appr.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, feedback })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ detail: `Failed on ${appr.id}` }));
        errors.push(errorData.detail || errorData.error || `Failed on ${appr.id}`);
      }
    }
    await fetchData();
    if (errors.length > 0) {
      throw new Error(`${errors.length} of ${pending.length} approvals failed: ${errors[0]}`);
    }
  };

  const handleSendMessage = async (senderId: string, recipientId: string, content: string, messageType: string) => {
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_id: senderId,
        recipient_id: recipientId,
        content: content,
        message_type: messageType
      })
    });
    const data = await res.json();
    if (data.message) {
      setMessages(prev => [...prev, data.message]);
    }
  };

  const handleTriggerTransit = (agentId: string, fromFloor: number, toFloor: number, targetAgentId: string, purpose: string) => {
    setPendingTransit({
      agent_id: agentId,
      agent_name: agentId,
      from_floor: fromFloor,
      to_floor: toFloor,
      target_agent_id: targetAgentId,
      purpose: purpose
    });
  };

  // Global Keyboard Shortcuts (Cmd+K, 0-5 floor jumps)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput = activeEl && (
        activeEl.tagName === 'INPUT' ||
        activeEl.tagName === 'TEXTAREA' ||
        (activeEl as HTMLElement).isContentEditable
      );
      if (isInput) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
        return;
      }

      if (e.key === 'Escape') {
        setShowShortcuts(false);
        return;
      }

      if (['0', '1', '2', '3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        setActiveTab('hq');
        setActiveFloor(parseInt(e.key, 10));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const pendingApprovalsCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <div className="flex flex-col h-screen pixel-grid-bg text-slate-100 overflow-hidden font-sans">
      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        connectionStatus={connectionStatus}
        messagesCount={messages.length}
        pendingApprovalsCount={pendingApprovalsCount}
        isApprovalsOpen={showApprovalsModal}
        onOpenComms={() => setShowCommsModal(true)}
        onOpenApprovals={() => setShowApprovalsModal(true)}
        onOpenSearch={() => setShowCommandPalette(true)}
        viewMode={viewMode}
        onChangeViewMode={handleViewModeChange}
        user={{ name: 'Arjun R', role: 'UiPath Student Developer Champion (SDC)', organization: 'AJIET' }}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden px-2 md:px-6 pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-6">
        <TabErrorBoundary>
        <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs font-mono text-slate-400">Loading module...</div>}>
          <div key={activeTab} className="flex-1 flex flex-col min-h-0 animate-pixel-enter">
            {activeTab === 'hq' && (
              <VirtualHeadquarters
                agents={agents}
                onSelectAgent={setSelectedAgent}
                activeFloor={activeFloor}
                setActiveFloor={setActiveFloor}
                orbiState={orbiState}
                onOpenComms={() => setShowCommsModal(true)}
                recentMessages={messages}
                pendingTransit={pendingTransit}
                viewModePreference={viewMode}
              />
            )}

            {activeTab === 'command' && (
              <CeoCommandCenter
                summary={summary}
                projects={projects}
                approvals={approvals}
                onSendCommand={handleSendCommand}
                onOpenApprovals={() => setShowApprovalsModal(true)}
                orbiState={orbiState}
              />
            )}

            {activeTab === 'vault' && <MediaVault projectId={selectedProjectId} />}

            {activeTab === 'qa' && (
              <VideoQualityInspector
                projectId={selectedProjectId || (projects.length > 0 ? projects[0].id : 'proj_02bbb199')}
                projects={projects}
                onSelectProject={(id) => setSelectedProjectId(id)}
              />
            )}

            {activeTab === 'workforce' && <WorkforceManagementView />}
          </div>
        </Suspense>
        </TabErrorBoundary>
      </main>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        activeTab={activeTab}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onSelectFloor={(floor) => setActiveFloor(floor)}
        onSelectAgent={(agent) => setSelectedAgent(agent)}
        onSelectProject={(id) => setSelectedProjectId(id)}
        onOpenApprovals={() => setShowApprovalsModal(true)}
        onOpenComms={() => setShowCommsModal(true)}
        agents={agents}
        projects={projects}
      />

      <ShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />

      {/* Modals */}
      {selectedAgent && (
        <EmployeeInspector
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          orbiState={orbiState}
        />
      )}

      <Suspense fallback={null}>
        {showApprovalsModal && (
          <ApprovalsModal
            approvals={approvals}
            onResolve={handleResolveApproval}
            onResolveAll={handleResolveAllApprovals}
            onClose={() => setShowApprovalsModal(false)}
          />
        )}

        {showCommsModal && (
          <WorkforceCommsCenter
            agents={agents}
            messages={messages}
            onSendMessage={handleSendMessage}
            onTriggerTransit={handleTriggerTransit}
            isOpen={showCommsModal}
            onClose={() => setShowCommsModal(false)}
          />
        )}
      </Suspense>
    </div>
  );
};

export const App: React.FC = () => (
  <ToastProvider>
    <AppInner />
  </ToastProvider>
);
