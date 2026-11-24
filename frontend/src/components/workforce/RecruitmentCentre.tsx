import React, { useState } from 'react';
import { 
  UserPlus, ShieldAlert, CheckCircle2, AlertCircle, Play, 
  Send, Layers, ArrowRight, RefreshCw, X, Shield, Cpu, Code
} from 'lucide-react';
import { CandidateCreateForm, CandidateTestItem, CandidateRecord } from '../../types';

interface Props {
  onClose?: () => void;
  onCandidateDeployed?: () => void;
  prefillDepartment?: string;
  prefillTitle?: string;
  prefillRole?: string;
  findingId?: string;
}

const DEPARTMENT_TOOL_POLICIES: Record<string, string[]> = {
  "Creative & Video Production": ["video_renderer", "tts_engine", "subtitle_generator", "thumbnail_generator", "ffmpeg", "script_editor"],
  "Marketing & Campaign Management": ["campaign_planner", "copywriter", "analytics_tracker", "social_scheduler", "seo_analyzer"],
  "Operations & Community": ["discord_bot", "forum_moderator", "event_organizer", "community_notifier"],
  "Technology & Infrastructure": ["server_telemetry", "database_monitor", "docker_runner", "git_tool", "cache_manager"],
  "Documentation & Campus": ["uipath_doc_retriever", "taxonomy_parser", "video_qa_inspector", "compliance_checker", "email_validator"],
  "Executive Management": ["workflow_orchestrator", "ceo_command_parser", "roster_inspector", "report_exporter"]
};

const DEPARTMENTS = Object.keys(DEPARTMENT_TOOL_POLICIES);

export const RecruitmentCentre: React.FC<Props> = ({
  onClose,
  onCandidateDeployed,
  prefillDepartment,
  prefillTitle,
  prefillRole,
  findingId
}) => {
  const [step, setStep] = useState<'define' | 'test' | 'deploy'>('define');
  const [formData, setFormData] = useState<CandidateCreateForm>({
    name: '',
    department: prefillDepartment || DEPARTMENTS[0],
    target_role: prefillRole || 'video_editor',
    title: prefillTitle || 'AI Video Production Specialist',
    floor: 2,
    model_name: 'gemini-1.5-pro',
    system_instructions: 'Execute high-precision digital media production tasks strictly adhering to brand guidelines and taxonomy.',
    tools_whitelist: DEPARTMENT_TOOL_POLICIES[prefillDepartment || DEPARTMENTS[0]].slice(0, 3),
    responsibilities: ['Automated rendering', 'Subtitle margin checking', 'Visual pacing'],
    shirt_color: '#3B82F6',
    suggested_by_finding_id: findingId
  });

  const [createdCandidate, setCreatedCandidate] = useState<CandidateRecord | null>(null);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentApproval, setDeploymentApproval] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDepartmentChange = (dept: string) => {
    const allowed = DEPARTMENT_TOOL_POLICIES[dept] || [];
    setFormData(prev => ({
      ...prev,
      department: dept,
      tools_whitelist: allowed.slice(0, 3)
    }));
  };

  const handleToolToggle = (tool: string) => {
    setFormData(prev => {
      const exists = prev.tools_whitelist.includes(tool);
      if (exists) {
        return { ...prev, tools_whitelist: prev.tools_whitelist.filter(t => t !== tool) };
      } else {
        return { ...prev, tools_whitelist: [...prev.tools_whitelist, tool] };
      }
    });
  };

  const handleCreateCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please provide a candidate name.');
      return;
    }
    setError(null);

    try {
      const res = await fetch('/api/workforce/recruitment/candidates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Autonomia-Principal': 'arjun_ceo'
        },
        body: JSON.stringify(formData)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Candidate creation failed');
      }
      const data = await res.json();
      setCreatedCandidate(data);
      setStep('test');
    } catch (err: any) {
      setError(err.message || 'Failed to create candidate specification');
    }
  };

  const handleRunTests = async () => {
    if (!createdCandidate) return;
    setIsTesting(true);
    setError(null);
    try {
      const res = await fetch(`/api/workforce/recruitment/candidates/${createdCandidate.candidate_id}/test`, {
        method: 'POST',
        headers: {
          'X-Autonomia-Principal': 'arjun_ceo'
        }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Test execution failed');
      }
      const data = await res.json();
      setTestResults(data.tests || []);
      setOverallScore(data.overall_score);
      if (data.can_deploy) {
        setStep('deploy');
      }
    } catch (err: any) {
      setError(err.message || 'Error running sandboxed tests');
    } finally {
      setIsTesting(false);
    }
  };

  const handleDeployRequest = async () => {
    if (!createdCandidate) return;
    setIsDeploying(true);
    setError(null);
    try {
      const res = await fetch(`/api/workforce/recruitment/candidates/${createdCandidate.candidate_id}/deploy-request`, {
        method: 'POST',
        headers: {
          'X-Autonomia-Principal': 'arjun_ceo'
        }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Deployment request failed');
      }
      const data = await res.json();
      setDeploymentApproval(data);
      if (onCandidateDeployed) onCandidateDeployed();
    } catch (err: any) {
      setError(err.message || 'Error requesting deployment');
    } finally {
      setIsDeploying(false);
    }
  };

  const availableTools = DEPARTMENT_TOOL_POLICIES[formData.department] || [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>AI Recruitment Centre</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                SANDBOXED GATED HIRING
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Department least-privilege policies, isolated evaluation sandbox, and strict Level 3 CEO authorization gate.
            </p>
          </div>
        </div>
        {onClose && (
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Stepper Progress */}
      <div className="grid grid-cols-3 gap-3 mb-6 shrink-0">
        <div className={`p-3 rounded-xl border flex items-center space-x-3 transition-colors ${
          step === 'define' ? 'bg-orange-500/10 border-orange-500/40 text-orange-400' : 'bg-slate-950 border-slate-800 text-slate-500'
        }`}>
          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold font-mono">1</div>
          <span className="text-xs font-bold">1. Define Candidate</span>
        </div>
        <div className={`p-3 rounded-xl border flex items-center space-x-3 transition-colors ${
          step === 'test' ? 'bg-orange-500/10 border-orange-500/40 text-orange-400' : 'bg-slate-950 border-slate-800 text-slate-500'
        }`}>
          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold font-mono">2</div>
          <span className="text-xs font-bold">2. Sandboxed Tests</span>
        </div>
        <div className={`p-3 rounded-xl border flex items-center space-x-3 transition-colors ${
          step === 'deploy' ? 'bg-orange-500/10 border-orange-500/40 text-orange-400' : 'bg-slate-950 border-slate-800 text-slate-500'
        }`}>
          <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold font-mono">3</div>
          <span className="text-xs font-bold">3. CEO Deployment Gate</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center space-x-2 shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: DEFINE CANDIDATE */}
      {step === 'define' && (
        <form onSubmit={handleCreateCandidate} className="space-y-4 max-w-3xl">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Candidate Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Maya Lin"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Job Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Video Quality Specialist"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Department</label>
              <select
                value={formData.department}
                onChange={e => handleDepartmentChange(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              >
                {DEPARTMENTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Floor Assignment</label>
              <select
                value={formData.floor}
                onChange={e => setFormData({ ...formData, floor: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value={1}>Floor 1 (Reception & Ops)</option>
                <option value={2}>Floor 2 (Creative & Media)</option>
                <option value={3}>Floor 3 (Engineering & Tech)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Model Backbone</label>
              <select
                value={formData.model_name}
                onChange={e => setFormData({ ...formData, model_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              >
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Reasoning)</option>
                <option value="gemini-1.5-flash">Gemini 1.5 Flash (High Throughput)</option>
                <option value="nvidia/nemotron-3-ultra-550b-a55b">Nemotron 3 Ultra (QA Engine)</option>
                <option value="heuristic-offline">Deterministic Rule Engine</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">System Instructions</label>
            <textarea
              rows={3}
              value={formData.system_instructions}
              onChange={e => setFormData({ ...formData, system_instructions: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 flex items-center space-x-1">
                <Shield className="w-3.5 h-3.5 text-orange-400" />
                <span>Department Least-Privilege Tool Whitelist</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Only tools permitted by department policy
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950 border border-slate-800 rounded-xl">
              {availableTools.map(tool => (
                <label key={tool} className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer hover:text-white">
                  <input
                    type="checkbox"
                    checked={formData.tools_whitelist.includes(tool)}
                    onChange={() => handleToolToggle(tool)}
                    className="rounded border-slate-700 text-orange-600 focus:ring-0"
                  />
                  <span className="font-mono text-[11px]">{tool}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/30 transition-all"
            >
              <span>Initialize Candidate & Generate Sandbox</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 2: SANDBOXED TESTING */}
      {step === 'test' && createdCandidate && (
        <div className="space-y-6 max-w-3xl">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-mono">CANDIDATE ID: {createdCandidate.candidate_id}</div>
              <div className="text-sm font-bold text-white">{formData.name} — {formData.title}</div>
              <div className="text-xs text-slate-400 mt-1">Status: Ready for sandboxed evaluation benchmarks</div>
            </div>
            <button
              onClick={handleRunTests}
              disabled={isTesting}
              className="flex items-center space-x-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-orange-600/30 transition-all"
            >
              {isTesting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating in Sandbox...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Execute Benchmark Suite</span>
                </>
              )}
            </button>
          </div>

          {testResults.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Benchmark Test Results</h3>
              <div className="space-y-2">
                {testResults.map((t, idx) => (
                  <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white flex items-center space-x-2">
                        <span>{t.test_type}</span>
                        <span className={`px-2 py-0.2 rounded text-[10px] font-mono font-bold ${
                          t.passed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {t.passed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{t.feedback}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-white">{t.score.toFixed(1)}%</div>
                      <div className="text-[10px] text-slate-500">Threshold: {t.pass_threshold}%</div>
                    </div>
                  </div>
                ))}
              </div>

              {overallScore !== null && (
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  overallScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
                }`}>
                  <div className="flex items-center space-x-3">
                    {overallScore >= 80 ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-400 shrink-0" />
                    )}
                    <div>
                      <div className="text-sm font-bold text-white">
                        Aggregate Benchmark Score: {overallScore.toFixed(1)}%
                      </div>
                      <div className="text-xs text-slate-400">
                        {overallScore >= 80 
                          ? 'Candidate meets the strict >= 80% deployment qualification threshold.' 
                          : 'Candidate failed deployment gate (>= 80% required). Refinement needed.'}
                      </div>
                    </div>
                  </div>

                  {overallScore >= 80 && (
                    <button
                      onClick={() => setStep('deploy')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center space-x-1"
                    >
                      <span>Proceed to Gate</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* STEP 3: CEO DEPLOYMENT GATE */}
      {step === 'deploy' && createdCandidate && (
        <div className="space-y-6 max-w-3xl">
          <div className="p-5 rounded-xl bg-orange-500/10 border border-orange-500/30 space-y-3">
            <div className="flex items-center space-x-2 text-orange-400">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold">Mandatory Human CEO Deployment Gate</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              In accordance with AUTONOMIA Principle 1 & 7, AI agents have zero autonomous hiring authority.
              Submitting this request creates an official Level 3 Approval for human CEO <strong>Arjun</strong>.
              Upon CEO approval, the candidate will be initialized into active workforce with Configuration Version 1.
            </p>
          </div>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <div className="text-xs font-bold text-white mb-2">Candidate Summary for CEO Review:</div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-300">
              <div>Agent ID: <span className="text-white">{createdCandidate.candidate_id}</span></div>
              <div>Name: <span className="text-white">{formData.name}</span></div>
              <div>Department: <span className="text-white">{formData.department}</span></div>
              <div>Floor: <span className="text-white">Floor {formData.floor}</span></div>
              <div>Model: <span className="text-white">{formData.model_name}</span></div>
              <div>Benchmark Score: <span className="text-emerald-400 font-bold">{overallScore?.toFixed(1)}%</span></div>
            </div>
          </div>

          {!deploymentApproval ? (
            <button
              onClick={handleDeployRequest}
              disabled={isDeploying}
              className="flex items-center space-x-2 px-6 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg shadow-orange-600/30 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>{isDeploying ? 'Submitting to CEO...' : 'Submit Deployment Request to CEO Arjun'}</span>
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center space-x-3 text-emerald-400">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div>
                <div className="text-sm font-bold">Deployment Request Submitted to CEO Approvals!</div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Approval ID: {deploymentApproval.approval_id}. Check the Approvals modal in header to authorize deployment.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
