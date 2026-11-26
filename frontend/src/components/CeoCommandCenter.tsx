import React, { useState } from 'react';
import { Agent, Project, Approval, RosterSummary } from '../types';
import { Terminal, Send, Mic, CheckCircle, Clock, Film, ShieldCheck, Trash2, XCircle, ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  summary: RosterSummary;
  projects: Project[];
  approvals: Approval[];
  onSendCommand: (command: string) => Promise<void>;
  onOpenApprovals: () => void;
  orbiState: string;
}

const PRESET_COMMANDS = [
  { label: "YouTube Explainer", prompt: "Create a YouTube video explaining UiPath Document Understanding" },
  { label: "3 Instagram Reels", prompt: "Prepare three Instagram Reels from our latest YouTube video" },
  { label: "Weekly Report", prompt: "Generate this week's YouTube performance report" }
];

export const CeoCommandCenter: React.FC<Props> = ({
  summary,
  projects,
  approvals,
  onSendCommand,
  onOpenApprovals,
  orbiState
}) => {
  const [command, setCommand] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [filter, setFilter] = useState<'all' | 'running' | 'completed' | 'failed'>('all');
  const [isCleaning, setIsCleaning] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSendCommand(command.trim());
      setCommand('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
      // Trigger a parent refresh if available, or dispatch custom event
      window.dispatchEvent(new CustomEvent('autonomia_refresh_data'));
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const handleCleanupStale = async () => {
    setIsCleaning(true);
    try {
      await fetch('/api/projects/cleanup', { method: 'POST' });
      window.dispatchEvent(new CustomEvent('autonomia_refresh_data'));
    } catch (err) {
      console.error('Failed to cleanup pipelines:', err);
    } finally {
      setIsCleaning(false);
    }
  };

  const filteredProjects = projects.filter((proj) => {
    if (filter === 'running') return proj.status === 'in_progress';
    if (filter === 'completed') return proj.status === 'completed';
    if (filter === 'failed') return proj.status === 'failed' || (proj.status as string) === 'interrupted';
    return true;
  });

  const runningCount = projects.filter(p => p.status === 'in_progress').length;
  const completedCount = projects.filter(p => p.status === 'completed').length;
  const failedCount = projects.filter(p => p.status === 'failed' || (p.status as string) === 'interrupted').length;

  const handleVoiceCommand = () => {
    // Web Speech API Voice Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your command.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event: any) => {
      const speechResult = event.results[0][0].transcript;
      setCommand(speechResult);
    };

    recognition.start();
  };

  const pendingApprovalsCount = approvals.filter(a => a.status === 'pending').length;

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto space-y-5 overflow-y-auto pr-1 py-1">
      {/* Compact CEO Header + Inline Telemetry */}
      <div className="pixel-card flex flex-wrap items-center justify-between gap-4 px-5 py-4 bg-gradient-to-r from-[#fa4616]/12 via-slate-900 to-slate-900 border border-[#fa4616]/30 rounded-2xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-[#fa4616]/50 flex items-center justify-center p-1 shrink-0">
            <img
              src={`/assets/sprites/orbi/orbi_${orbiState || 'waving'}.gif`}
              alt="AURI Mascot"
              className="w-10 h-10 pixelated object-contain animate-pixel-float"
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-white">Welcome back, Arjun</h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                LIVE
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono text-slate-400 mt-1">
              <span><strong className="text-white">{summary.active_agents}</strong>/{summary.total_agents} Agents</span>
              <span className="text-slate-700">&bull;</span>
              <span><strong className="text-white">{projects.length}</strong> Campaigns</span>
              <span className="text-slate-700">&bull;</span>
              <span>FFmpeg <strong className="text-emerald-400">100%</strong></span>
              <span className="text-slate-700">&bull;</span>
              <span>Cost <strong className="text-white">$0.00</strong></span>
            </div>
          </div>
        </div>

        {pendingApprovalsCount > 0 && (
          <button
            onClick={onOpenApprovals}
            className="pixel-btn animate-pixel-pulse flex items-center space-x-2 px-4 py-2.5 bg-[#fa4616] hover:bg-orange-500 text-white rounded-xl font-bold text-xs shadow-lg shadow-orange-600/25"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{pendingApprovalsCount} Approvals Pending</span>
          </button>
        )}
      </div>

      {/* CEO Natural Language Prompt Console */}
      <div className="pixel-card p-4 bg-slate-900/95 border border-slate-800 rounded-2xl space-y-3">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <Terminal className="w-4 h-4 text-[#fa4616] absolute left-4 pointer-events-none" />
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Instruct your team (e.g. 'Create a YouTube video explaining UiPath Document Understanding')..."
            className="w-full pl-11 pr-28 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-[#fa4616] text-sm"
          />

          <div className="absolute right-2.5 flex items-center space-x-1.5">
            <button
              type="button"
              onClick={handleVoiceCommand}
              className={`pixel-btn p-2 rounded-lg ${
                isListening ? 'bg-red-600 text-white animate-pulse' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Voice Input"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !command.trim()}
              className="pixel-btn flex items-center space-x-1.5 px-3.5 py-2 bg-[#fa4616] hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Sending...' : 'Dispatch'}</span>
            </button>
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono text-slate-500">Quick:</span>
          {PRESET_COMMANDS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCommand(preset.prompt)}
              className="pixel-btn px-2.5 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-[#fa4616]/50 text-slate-300 hover:text-white text-[11px] font-mono rounded-lg"
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active Autonomous Pipelines & Project Tracking */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <Film className="w-4 h-4 text-cyan-400" />
              <span>Production Pipelines</span>
            </h3>

            {/* Filter Tabs */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded font-bold transition-all ${filter === 'all' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                All ({projects.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('running')}
                className={`px-2.5 py-1 rounded font-bold transition-all ${filter === 'running' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Active ({runningCount})
              </button>
              <button
                type="button"
                onClick={() => setFilter('completed')}
                className={`px-2.5 py-1 rounded font-bold transition-all ${filter === 'completed' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Completed ({completedCount})
              </button>
              {failedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setFilter('failed')}
                  className={`px-2.5 py-1 rounded font-bold transition-all ${filter === 'failed' ? 'bg-red-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  Failed ({failedCount})
                </button>
              )}
            </div>
          </div>

          {/* Quick Cleanup Button */}
          {projects.length > 3 && (
            <button
              type="button"
              onClick={handleCleanupStale}
              disabled={isCleaning}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-xs text-slate-300 rounded-lg transition-all"
              title="Clears failed and inactive test pipelines"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{isCleaning ? 'Clearing...' : 'Clear Inactive Pipelines'}</span>
            </button>
          )}
        </div>

        {filteredProjects.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-xl">
            <p className="text-sm text-slate-400">
              {filter === 'running'
                ? 'No actively running pipelines right now. Dispatch an instruction above to begin.'
                : 'No production projects match this filter.'}
            </p>
          </div>
        ) : (
          filteredProjects.map((proj) => {
            const isExpanded = expandedIds[proj.id] ?? proj.status === 'in_progress';
            const doneCount = proj.tasks.filter(t => t.status === 'completed').length;
            return (
              <div key={proj.id} className="pixel-card p-4 bg-slate-900/95 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => toggleExpand(proj.id)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0 group"
                  >
                    {isExpanded
                      ? <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />
                      : <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white shrink-0" />}
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-[#fa4616] transition-colors">{proj.title}</h4>
                      <span className="text-[11px] text-slate-500 font-mono">ID: {proj.id} &bull; {doneCount}/{proj.tasks.length} steps</span>
                    </div>
                  </button>

                  {/* Mini 7-step progress bar */}
                  <div className="hidden sm:flex items-center gap-1">
                    {proj.tasks.map((t) => (
                      <span
                        key={t.id}
                        className={`w-3.5 h-1.5 rounded-sm ${
                          t.status === 'completed'
                            ? 'bg-emerald-500'
                            : t.status === 'in_progress'
                            ? 'bg-amber-400 animate-pulse'
                            : t.status === 'review'
                            ? 'bg-[#fa4616]'
                            : t.status === 'failed'
                            ? 'bg-red-500'
                            : 'bg-slate-800'
                        }`}
                        title={t.title}
                      />
                    ))}
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold capitalize ${
                      proj.status === 'completed'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : proj.status === 'failed' || (proj.status as string) === 'interrupted'
                        ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30 animate-pulse'
                    }`}>
                      {proj.status}
                    </span>

                    <button
                      onClick={() => handleDeleteProject(proj.id)}
                      className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-colors"
                      title="Delete Pipeline"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Collapsible 7-Step Sequence */}
                {isExpanded && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 animate-pixel-enter">
                    {proj.tasks.map((task, idx) => {
                      const isDone = task.status === 'completed';
                      const isCur = task.status === 'in_progress';
                      const isGate = task.status === 'review';
                      const isFail = task.status === 'failed';

                      return (
                        <div
                          key={task.id}
                          className={`p-2.5 rounded-lg border text-xs space-y-1 transition-all ${
                            isDone
                              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                              : isCur
                              ? 'bg-amber-950/30 border-amber-500/60 text-amber-200 animate-pulse'
                              : isGate
                              ? 'bg-orange-950/40 border-[#fa4616] text-orange-200'
                              : isFail
                              ? 'bg-red-950/30 border-red-500/40 text-red-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400'
                          }`}
                        >
                          <div className="flex items-center justify-between font-mono text-[10px]">
                            <span>STEP 0{idx + 1}</span>
                            {isDone && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                            {isCur && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                            {isGate && <ShieldCheck className="w-3.5 h-3.5 text-[#fa4616]" />}
                            {isFail && <XCircle className="w-3.5 h-3.5 text-red-400" />}
                          </div>
                          <div className="font-semibold truncate">{task.title}</div>
                          <div className="text-[10px] text-slate-500 truncate">{task.department}</div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
