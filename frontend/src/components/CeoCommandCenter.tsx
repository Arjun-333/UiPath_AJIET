import React, { useState } from 'react';
import { Agent, Project, Approval, RosterSummary } from '../types';
import { Terminal, Send, Mic, Play, CheckCircle, Clock, AlertTriangle, Video, Sparkles, Film, ShieldCheck } from 'lucide-react';

interface Props {
  summary: RosterSummary;
  projects: Project[];
  approvals: Approval[];
  onSendCommand: (command: string) => Promise<void>;
  onOpenApprovals: () => void;
  orbiState: string;
}

const PRESET_COMMANDS = [
  "Create a YouTube video explaining UiPath Document Understanding",
  "Prepare three Instagram Reels from our latest YouTube video",
  "Schedule the next video for Friday at 6 PM",
  "Generate this week's YouTube performance report",
  "Send a reminder email to all registered Automate Campus Quest students"
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
    <div className="flex flex-col h-full space-y-6 overflow-y-auto pr-2">
      {/* Top CEO Greeting Banner with Mascot */}
      <div className="flex items-center justify-between p-6 bg-gradient-to-r from-orange-950/40 via-slate-900 to-slate-900 border border-orange-500/30 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 rounded-2xl bg-slate-950 border-2 border-orange-500/50 flex items-center justify-center p-1 shadow-lg shadow-orange-500/20">
            <img
              src={`/assets/sprites/orbi/orbi_${orbiState || 'waving'}.gif`}
              alt="AURI Mascot"
              className="w-14 h-14 pixelated object-contain"
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-pixel text-xs text-orange-400">AURI // CHIEF AI ASSISTANT TO CEO ARJUN</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono border border-emerald-500/30">
                LIVE ORCHESTRATION
              </span>
            </div>
            <h1 className="text-xl font-bold text-white mt-1">Welcome back, Arjun</h1>
            <p className="text-xs text-slate-400">
              UiPath Community AJIET Digital Media Operations // Tech, Media & Documentation Departments Active
            </p>
          </div>
        </div>

        {/* Level 3 Approval Gate Quick Indicator */}
        {pendingApprovalsCount > 0 && (
          <button
            onClick={onOpenApprovals}
            className="flex items-center space-x-3 px-5 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl shadow-lg shadow-orange-600/30 font-bold text-sm transition-all animate-pulse"
          >
            <ShieldCheck className="w-5 h-5" />
            <span>{pendingApprovalsCount} Action(s) Require CEO Approval</span>
          </button>
        )}
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-5 gap-4">
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
          <span className="text-xs font-mono text-slate-400">Active Agents</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-white">{summary.active_agents}</span>
            <span className="text-xs text-slate-500">/ {summary.total_agents} total</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
          <span className="text-xs font-mono text-slate-400">Active Projects</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-cyan-400">{projects.length}</span>
            <span className="text-xs text-slate-500">campaigns</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
          <span className="text-xs font-mono text-slate-400">Pending Approvals</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-orange-400">{pendingApprovalsCount}</span>
            <span className="text-xs text-slate-500">Level 3 gates</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
          <span className="text-xs font-mono text-slate-400">Render Pipeline</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-emerald-400">100%</span>
            <span className="text-xs text-slate-500">Native FFmpeg</span>
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-xl">
          <span className="text-xs font-mono text-slate-400">API Cost Guard</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-purple-400">$0.00</span>
            <span className="text-xs text-slate-500">Zero-cost active</span>
          </div>
        </div>
      </div>

      {/* CEO Natural Language Prompt Console */}
      <div className="p-6 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-slate-300">
          <Terminal className="w-5 h-5 text-orange-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-white">Direct Natural Language Dispatch</h3>
        </div>

        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Instruct your company (e.g. 'Create a YouTube video explaining UiPath Document Understanding')..."
            className="w-full pl-5 pr-28 py-4 bg-slate-950 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 text-sm font-medium shadow-inner"
          />

          <div className="absolute right-3 flex items-center space-x-2">
            <button
              type="button"
              onClick={handleVoiceCommand}
              className={`p-2 rounded-lg transition-all ${
                isListening ? 'bg-red-600 text-white animate-pulse' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Voice Input"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !command.trim()}
              className="flex items-center space-x-1.5 px-4 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-md"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSubmitting ? 'Dispatching...' : 'Dispatch'}</span>
            </button>
          </div>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-mono text-slate-500">Presets:</span>
          {PRESET_COMMANDS.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCommand(preset)}
              className="px-3 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs rounded-lg transition-all"
            >
              {preset}
            </button>
          ))}
        </div>
      </div>

      {/* Active Autonomous Pipelines & Project Tracking */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
          <Film className="w-4 h-4 text-cyan-400" />
          <span>Active Production Pipelines</span>
        </h3>

        {projects.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/40 border border-dashed border-slate-800 rounded-xl">
            <p className="text-sm text-slate-400">No active production projects. Dispatch an instruction above to begin.</p>
          </div>
        ) : (
          projects.map((proj) => (
            <div key={proj.id} className="p-5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-bold text-white">{proj.title}</h4>
                  <span className="text-xs text-slate-400 font-mono">ID: {proj.id} // Platform: {proj.target_platform}</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold capitalize ${
                  proj.status === 'completed'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                }`}>
                  {proj.status}
                </span>
              </div>

              {/* Task pipeline sequence */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                {proj.tasks.map((task, idx) => {
                  const isDone = task.status === 'completed';
                  const isCur = task.status === 'in_progress';
                  const isGate = task.status === 'review';

                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-lg border text-xs space-y-1 transition-all ${
                        isDone
                          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                          : isCur
                          ? 'bg-amber-950/30 border-amber-500/60 text-amber-200 animate-pulse shadow-md'
                          : isGate
                          ? 'bg-orange-950/40 border-orange-500 text-orange-200 shadow-lg'
                          : 'bg-slate-950 border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span>STEP 0{idx + 1}</span>
                        {isDone && <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
                        {isCur && <Clock className="w-3.5 h-3.5 text-amber-400" />}
                        {isGate && <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />}
                      </div>
                      <div className="font-semibold truncate">{task.title}</div>
                      <div className="text-[10px] text-slate-500 truncate">{task.department}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
