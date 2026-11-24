import React, { useState, useEffect, useRef } from 'react';
import { Agent, AgentMessage } from '../types';
import { 
  MessageSquare, Send, Users, ArrowUpRight, ArrowDownRight, 
  Building2, Sparkles, Filter, Hash, CheckCircle2, Bot, CornerDownRight
} from 'lucide-react';

interface Props {
  agents: Agent[];
  messages: AgentMessage[];
  onSendMessage: (senderId: string, recipientId: string, content: string, messageType: string) => Promise<void>;
  onTriggerTransit?: (agentId: string, fromFloor: number, toFloor: number, targetAgentId: string, purpose: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const CHANNELS = [
  { id: '#general', name: 'general-hq', subtitle: 'Company-Wide Media Operations', floor: 0 },
  { id: '#floor-0-executive', name: 'executive-boardroom', subtitle: 'CEO Arjun, Marcus & AURI', floor: 0 },
  { id: '#floor-1-media', name: 'media-creative-studio', subtitle: 'Video, Scripts & Reels', floor: 1 },
  { id: '#floor-4-campus-docs', name: 'campus-and-compliance', subtitle: 'Outreach & Documentation', floor: 4 },
  { id: '#floor-5-tech-systems', name: 'tech-infrastructure', subtitle: 'Servers, DB & DevOps', floor: 5 }
];

export const WorkforceCommsCenter: React.FC<Props> = ({
  agents,
  messages,
  onSendMessage,
  onTriggerTransit,
  isOpen,
  onClose
}) => {
  const [activeChannel, setActiveChannel] = useState<string>('#general');
  const [inputText, setInputText] = useState<string>('');
  const [selectedSenderId, setSelectedSenderId] = useState<string>('arjun_ceo');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [requireCrossFloorVisit, setRequireCrossFloorVisit] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeChannel]);

  if (!isOpen) return null;

  // Filter messages for current channel or DM
  const filteredMessages = messages.filter(m => {
    if (activeChannel.startsWith('#')) {
      if (activeChannel === '#general') return true;
      if (activeChannel === '#floor-0-executive') return m.sender_floor === 0 || m.recipient_floor === 0 || m.recipient_id === '#floor-0-executive';
      if (activeChannel === '#floor-1-media') return m.sender_floor === 1 || m.recipient_floor === 1 || m.recipient_id === '#floor-1-media';
      if (activeChannel === '#floor-4-campus-docs') return m.sender_floor === 4 || m.recipient_floor === 4 || m.recipient_id === '#floor-4-campus-docs';
      if (activeChannel === '#floor-5-tech-systems') return m.sender_floor === 5 || m.recipient_floor === 5 || m.recipient_id === '#floor-5-tech-systems';
      return m.recipient_id === activeChannel;
    } else {
      // Direct message between selected agent and anyone
      return m.sender_id === activeChannel || m.recipient_id === activeChannel;
    }
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    try {
      const msgType = requireCrossFloorVisit ? 'cross_floor_visit' : 'general_chat';
      await onSendMessage(selectedSenderId, activeChannel, inputText.trim(), msgType);

      // If user wanted cross floor transit, trigger it
      if (requireCrossFloorVisit && onTriggerTransit && !activeChannel.startsWith('#')) {
        const sender = agents.find(a => a.agent_id === selectedSenderId);
        const recipient = agents.find(a => a.agent_id === activeChannel);
        if (sender && recipient && sender.floor !== recipient.floor) {
          onTriggerTransit(sender.agent_id, sender.floor, recipient.floor, recipient.agent_id, inputText.trim());
        }
      }

      setInputText('');
      setRequireCrossFloorVisit(false);
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const getBadgeStyle = (type: string) => {
    switch (type) {
      case 'task_brief':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'handoff':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'cross_floor_visit':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'review_status':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600/40';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-5xl h-[85vh] bg-[#0c121e] border-2 border-slate-800 rounded-3xl shadow-2xl flex overflow-hidden">
        
        {/* Left Sidebar: Channels & Agent Direct Messages */}
        <div className="w-72 bg-[#090d15] border-r border-slate-800/80 flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-orange-600/20 border border-orange-500/40 rounded-xl text-orange-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white flex items-center space-x-1.5">
                    <span>WORKFORCE COMMS</span>
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400">Inter-Department Relay</p>
                </div>
              </div>
            </div>

            {/* Department Channels */}
            <div className="p-3">
              <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Department Channels</span>
                <span className="text-orange-400 font-pixel text-[8px]">{CHANNELS.length}</span>
              </div>
              <div className="space-y-1 mt-1">
                {CHANNELS.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChannel(ch.id)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono transition-all flex items-center justify-between ${
                      activeChannel === ch.id
                        ? 'bg-orange-600/20 text-orange-300 border border-orange-500/40 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Hash className="w-3.5 h-3.5 text-slate-500" />
                      <span>{ch.name}</span>
                    </div>
                    <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">F{ch.floor}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Colleague Comms */}
            <div className="p-3 pt-0 max-h-56 overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Direct Personnel Comms</span>
                <span className="text-cyan-400 font-pixel text-[8px]">{agents.length}</span>
              </div>
              <div className="space-y-1 mt-1">
                {agents.map(a => (
                  <button
                    key={a.agent_id}
                    onClick={() => setActiveChannel(a.agent_id)}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center justify-between ${
                      activeChannel === a.agent_id
                        ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span className={`w-2 h-2 rounded-full ${a.status === 'working' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                      <span className="truncate">{a.name}</span>
                    </div>
                    <span className="text-[9px] text-slate-500">F{a.floor}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* User CEO Identifier in sidebar footer */}
          <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span className="font-bold text-slate-200">Arjun (CEO Suite)</span>
            </div>
            <span className="text-[10px] bg-orange-950 text-orange-400 border border-orange-800 px-1.5 py-0.5 rounded">F0 Main</span>
          </div>
        </div>

        {/* Right Main Chat & Transmission Feed */}
        <div className="flex-1 flex flex-col bg-[#0d1424]">
          {/* Channel Header */}
          <div className="px-6 py-4 bg-[#090e1a] border-b border-slate-800 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="font-pixel text-xs text-orange-400">
                  {activeChannel.startsWith('#') ? '#' : '@'}{activeChannel.replace('#', '')}
                </span>
                <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
                  {activeChannel.startsWith('#') ? 'Department Channel' : 'Direct Agent Channel'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {activeChannel.startsWith('#')
                  ? CHANNELS.find(c => c.id === activeChannel)?.subtitle || 'Autonomous Cross-Department Workforce'
                  : agents.find(a => a.agent_id === activeChannel)?.role || 'Personnel Consultation'
                }
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors font-mono text-xs"
            >
              ESC / Close ✕
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            {filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-2">
                <MessageSquare className="w-10 h-10 text-slate-600" />
                <p className="text-sm font-mono">No messages logged in this channel yet.</p>
                <p className="text-xs text-slate-600">Send an instruction or initiate a cross-floor consultation below.</p>
              </div>
            ) : (
              filteredMessages.map(msg => {
                const isCrossFloor = msg.sender_floor !== msg.recipient_floor;
                return (
                  <div key={msg.id} className="p-4 bg-slate-900/70 border border-slate-800 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="font-bold text-sm text-slate-100">{msg.sender_name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-800 text-slate-400 rounded border border-slate-700">
                          Floor {msg.sender_floor}
                        </span>
                        {isCrossFloor && (
                          <span className="flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded border border-amber-500/40">
                            <CornerDownRight className="w-3 h-3" />
                            <span>Escalator to Floor {msg.recipient_floor}</span>
                          </span>
                        )}
                        <span className={`text-[9px] font-mono px-2 py-0.5 rounded border uppercase font-bold ${getBadgeStyle(msg.message_type)}`}>
                          {msg.message_type.replace('_', ' ')}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-sm text-slate-200 leading-relaxed font-sans">{msg.content}</p>

                    <div className="pt-1 flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span>Target: <strong className="text-slate-400">{msg.recipient_name}</strong></span>
                      {msg.project_id && (
                        <span className="text-orange-400/80">Project: {msg.project_id}</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box & Cross-Floor Escalator Switch */}
          <form onSubmit={handleSend} className="p-4 bg-[#090e1a] border-t border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400">
              <div className="flex items-center space-x-2">
                <span>Send As:</span>
                <select
                  value={selectedSenderId}
                  onChange={(e) => setSelectedSenderId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 focus:outline-none focus:border-orange-500"
                >
                  <option value="arjun_ceo">Arjun (Founder & CEO - Floor 0)</option>
                  <option value="coo_01">Marcus Vance (COO - Floor 0)</option>
                  <option value="darshan_director">Darshan (Media Director - Floor 1)</option>
                  <option value="shrinithi_script">Shrinithi (Scriptwriter - Floor 1)</option>
                  <option value="vaishnavi_design">Vaishnavi (Visual Designer - Floor 1)</option>
                  <option value="shreyank_editor">Shreyank (Video Editor - Floor 1)</option>
                  <option value="iffah_doc">Iffah (Campus Outreach - Floor 4)</option>
                  <option value="jiya_research">Jiya (Technical Docs - Floor 4)</option>
                  <option value="srijana_quality">Srijana (Quality Inspector - Floor 4)</option>
                  <option value="pratham_cto">Pratham (CTO & Arch - Floor 5)</option>
                  <option value="mallika_tech">Mallika (API & DB - Floor 5)</option>
                  <option value="vaibhav_devops">Vaibhav (DevOps & Security - Floor 5)</option>
                  <option value="faazil_sysadmin">Faazil (Storage & SysAdmin - Floor 5)</option>
                </select>
              </div>

              {!activeChannel.startsWith('#') && (
                <label className="flex items-center space-x-2 cursor-pointer hover:text-amber-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={requireCrossFloorVisit}
                    onChange={(e) => setRequireCrossFloorVisit(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>Dispatch via Escalator/Stairs in HQ</span>
                </label>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message ${activeChannel}...`}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500 font-sans"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isSending}
                className="px-5 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl font-bold font-mono text-sm flex items-center space-x-2 transition-all shadow-lg shadow-orange-600/30"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};
