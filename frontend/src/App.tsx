import React, { useState, useEffect } from 'react';
import { Agent, Project, Approval, RosterSummary, AgentMessage, AgentTransitEvent } from './types';
import { VirtualHeadquarters } from './components/VirtualHeadquarters';
import { CeoCommandCenter } from './components/CeoCommandCenter';
import { ApprovalsModal } from './components/ApprovalsModal';
import { EmployeeInspector } from './components/EmployeeInspector';
import { MediaVault } from './components/MediaVault';
import { WorkforceCommsCenter } from './components/WorkforceCommsCenter';
import { VideoQualityInspector } from './components/VideoQualityInspector';
import { WorkforceManagementView } from './components/workforce/WorkforceManagementView';
import { Building2, Terminal, Film, ShieldCheck, Activity, Users, Sparkles, MessageSquare, ShieldAlert } from 'lucide-react';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'hq' | 'command' | 'vault' | 'qa' | 'workforce'>('hq');
  const [activeFloor, setActiveFloor] = useState<number>(0);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('test_proj_01');
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
  const [pendingTransit, setPendingTransit] = useState<AgentTransitEvent | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

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
      if (projRes) setProjects(projRes);
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

      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connectWs, 3000);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.event === 'mascot_update') {
            setOrbiState(msg.data.state || 'idle');
          } else if (msg.event === 'task_started') {
            setOrbiState('working');
            fetchData();
          } else if (msg.event === 'task_completed') {
            fetchData();
          } else if (msg.event === 'project_completed') {
            setOrbiState('celebrating');
            fetchData();
          } else if (msg.event === 'approval_requested') {
            setOrbiState('waiting');
            fetchData();
          } else if (msg.event === 'agent_message') {
            setMessages(prev => [...prev, msg.data]);
          } else if (msg.event === 'agent_transit') {
            setPendingTransit(msg.data);
          } else if (msg.event === 'employee_lifecycle_changed' || msg.event === 'workforce_alert') {
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

  const pendingApprovalsCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <div className="flex flex-col h-screen bg-[#0b0f17] text-slate-100 overflow-hidden font-sans">
      {/* Top Header Navigation */}
      <header className="flex items-center justify-between px-6 py-3 bg-slate-950 border-b border-slate-800 shrink-0">
        <div className="flex items-center space-x-4">
          {/* Logo & Mascot Pair */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center font-pixel text-white text-xs font-bold shadow-md shadow-orange-600/30">
              Ui
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-pixel text-sm text-white tracking-wider">AUTONOMIA</span>
                <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 text-[9px] font-mono font-bold border border-orange-500/30">
                  AJIET MEDIA CO
                </span>
              </div>
              <span className="text-[11px] text-slate-400">Autonomous Digital Media Organization</span>
            </div>
          </div>
        </div>

        {/* Center Tabs */}
        <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('hq')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'hq'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Virtual Headquarters</span>
          </button>

          <button
            onClick={() => setActiveTab('command')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'command'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>CEO Command Centre</span>
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'vault'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Film className="w-4 h-4" />
            <span>Media Vault</span>
          </button>

          <button
            onClick={() => setActiveTab('qa')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'qa'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-orange-400" />
            <span>Video QA Lab</span>
          </button>

          <button
            onClick={() => setActiveTab('workforce')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'workforce'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Users className="w-4 h-4 text-orange-400" />
            <span>Workforce & Talent</span>
          </button>
        </div>

        {/* Right Status, Comms & Approvals */}
        <div className="flex items-center space-x-3">
          {/* Workforce Comms Button */}
          <button
            onClick={() => setShowCommsModal(true)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 transition-all shadow-md shadow-cyan-600/20"
          >
            <MessageSquare className="w-4 h-4 text-cyan-400" />
            <span>Workforce Comms</span>
            {messages.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-bold">
                {messages.length}
              </span>
            )}
          </button>

          {/* WebSocket Status */}
          <div className="flex items-center space-x-1.5 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <span className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            <span>{wsConnected ? 'LIVE FEED' : 'CONNECTING'}</span>
          </div>

          {/* Level 3 Approvals Button */}
          <button
            onClick={() => setShowApprovalsModal(true)}
            className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              pendingApprovalsCount > 0
                ? 'bg-orange-600 text-white border-orange-500 animate-pulse shadow-lg shadow-orange-600/30'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-orange-400" />
            <span>Approvals</span>
            {pendingApprovalsCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-orange-600 text-[10px] font-bold">
                {pendingApprovalsCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden p-6">
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

        {activeTab === 'vault' && <MediaVault />}

        {activeTab === 'qa' && (
          <VideoQualityInspector
            projectId={projects.length > 0 ? projects[0].id : selectedProjectId}
          />
        )}

        {activeTab === 'workforce' && <WorkforceManagementView />}
      </main>

      {/* Modals */}
      {selectedAgent && (
        <EmployeeInspector
          agent={selectedAgent}
          onClose={() => setSelectedAgent(null)}
          orbiState={orbiState}
        />
      )}

      {showApprovalsModal && (
        <ApprovalsModal
          approvals={approvals}
          onResolve={handleResolveApproval}
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
    </div>
  );
};
