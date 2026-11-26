import React, { useState, useEffect } from 'react';
import { WorkforceEmployee } from '../../types';
import { LifecycleActionDialog } from './LifecycleActionDialog';
import { 
  User, Shield, History, Award, AlertTriangle, ArrowLeft, 
  RotateCcw, Sparkles, CheckCircle2, PauseCircle, UserMinus, 
  UserCheck, RefreshCw, Layers
} from 'lucide-react';

interface Props {
  agentId: string;
  onClose: () => void;
  onRefresh: () => void;
}

export const AgentProfileModal: React.FC<Props> = ({ agentId, onClose, onRefresh }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'configs' | 'trends'>('overview');
  const [actionType, setActionType] = useState<any>(null);

  const fetchDossier = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workforce/employees/${agentId}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDossier();
  }, [agentId]);

  if (loading || !data) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 p-8 rounded-2xl text-slate-400 text-xs font-mono">
          Loading personnel dossier for {agentId}...
        </div>
      </div>
    );
  }

  const { employee, metrics, configuration_versions } = data;
  const isSuspended = employee.lifecycle_state === 'suspended';
  const isTerminated = employee.lifecycle_state === 'terminated';

  const handleRollback = async (versionNumber: number) => {
    if (!window.confirm(`Are you sure you want to rollback ${employee.name} to Configuration Version ${versionNumber}?`)) {
      return;
    }
    const res = await fetch(`/api/workforce/employees/${agentId}/rollback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Autonomia-Principal': 'arjun_ceo'
      },
      body: JSON.stringify({
        target_version_number: versionNumber,
        reason: `CEO authorized rollback to verified Version ${versionNumber}`,
        approval_id: `appr_rollback_${Date.now()}`
      })
    });
    if (res.ok) {
      await fetchDossier();
      onRefresh();
    } else {
      const err = await res.json();
      alert(`Rollback failed: ${err.detail || 'Unknown error'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-1">
              <img
                src={
                  employee.avatar_file?.startsWith('/')
                    ? employee.avatar_file
                    : employee.avatar_file?.startsWith('orbi_')
                    ? `/assets/sprites/auri/${employee.avatar_file}`
                    : `/assets/sprites/employees/${employee.avatar_file || `${employee.agent_id}.png`}`
                }
                alt={employee.name}
                className="w-8 h-8 pixelated object-contain"
                onError={(e: any) => { e.target.src = '/assets/sprites/auri/orbi_idle_f0.png'; }}
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">{employee.name}</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  Floor {employee.floor}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 font-mono font-bold">
                  Config v{employee.current_config_version}
                </span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono uppercase font-bold ${
                  employee.lifecycle_state === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                  employee.lifecycle_state === 'suspended' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  'bg-slate-800 text-slate-400'
                }`}>
                  {employee.lifecycle_state}
                </span>
              </div>
              <p className="text-xs text-orange-400 font-medium">{employee.current_title} // {employee.department}</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg">
            ✕
          </button>
        </div>

        {/* Tab Navigation & Action Controls Bar */}
        <div className="px-6 py-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex space-x-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'overview' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Performance & Diagnostics
            </button>
            <button
              onClick={() => setActiveTab('configs')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                activeTab === 'configs' ? 'bg-orange-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Config History ({configuration_versions.length} versions)
            </button>
          </div>

          {/* Quick Lifecycle Action Triggers */}
          <div className="flex items-center space-x-2">
            {isSuspended || isTerminated ? (
              <button
                onClick={() => setActionType('reactivate')}
                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded flex items-center space-x-1"
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Reactivate</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setActionType('promote')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-orange-400 border border-slate-700 font-semibold rounded flex items-center space-x-1"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>Promote</span>
                </button>
                <button
                  onClick={() => setActionType('retrain')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold rounded flex items-center space-x-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retrain</span>
                </button>
                <button
                  onClick={() => setActionType('reassign')}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold rounded flex items-center space-x-1"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Reassign</span>
                </button>
                <button
                  onClick={() => setActionType('suspend')}
                  className="px-2.5 py-1 bg-amber-950/40 hover:bg-amber-900/60 text-amber-400 border border-amber-800/60 font-semibold rounded flex items-center space-x-1"
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>Suspend</span>
                </button>
                <button
                  onClick={() => setActionType('terminate')}
                  className="px-2.5 py-1 bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-800/60 font-semibold rounded flex items-center space-x-1"
                >
                  <UserMinus className="w-3.5 h-3.5" />
                  <span>Terminate</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
                  <span className="text-slate-500 font-mono text-[10px] block">COMPLETION RATE</span>
                  <div className="text-xl font-bold text-white font-mono">{metrics?.metrics?.completion_rate}%</div>
                  <span className="text-[10px] text-slate-500">{metrics?.activity_counts?.completed_tasks} completed / {metrics?.activity_counts?.failed_tasks} failed</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
                  <span className="text-slate-500 font-mono text-[10px] block">OUTPUT QUALITY</span>
                  <div className="text-xl font-bold text-slate-200 font-mono">{metrics?.metrics?.quality_score?.toFixed(1)} / 100</div>
                  <span className="text-[10px] text-slate-500">QA inspector validated</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
                  <span className="text-slate-500 font-mono text-[10px] block">EXECUTION EFFICIENCY</span>
                  <div className="text-xl font-bold text-slate-200 font-mono">{metrics?.metrics?.execution_time_seconds}s</div>
                  <span className="text-[10px] text-slate-500">Excludes approval pauses</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1 text-xs">
                  <span className="text-slate-500 font-mono text-[10px] block">INFERENCE COST</span>
                  <div className="text-xl font-bold text-cyan-400 font-mono">${metrics?.metrics?.cost_per_task_usd?.toFixed(4)}</div>
                  <span className="text-[10px] text-slate-500">Average cost per task</span>
                </div>
              </div>

              {/* Composite Score Breakdown Box */}
              <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-orange-400" />
                    Transparent Composite Score (Version {metrics?.composite?.version})
                  </span>
                  <span className="text-base font-bold font-mono text-orange-400">
                    {metrics?.composite?.score !== null ? `${metrics?.composite?.score} pts` : 'INSUFFICIENT DATA'}
                  </span>
                </div>
                {metrics?.is_insufficient_data ? (
                  <div className="p-3 bg-amber-950/20 border border-amber-800/40 rounded-lg text-amber-300 text-xs">
                    {metrics?.insufficient_data_reason}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono">
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-500 block">Completion (25%)</span>
                      <span className="text-white font-bold">+{metrics?.composite?.components?.completion_rate_contribution} pts</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-500 block">Quality (30%)</span>
                      <span className="text-white font-bold">+{metrics?.composite?.components?.quality_contribution} pts</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-500 block">Accuracy (20%)</span>
                      <span className="text-white font-bold">+{metrics?.composite?.components?.accuracy_contribution} pts</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-500 block">Speed (15%)</span>
                      <span className="text-white font-bold">+{metrics?.composite?.components?.efficiency_contribution} pts</span>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <span className="text-slate-500 block">Approval (10%)</span>
                      <span className="text-white font-bold">+{metrics?.composite?.components?.approval_contribution} pts</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'configs' && (
            <div className="space-y-4">
              <span className="text-xs font-mono text-slate-400 uppercase block font-semibold">
                Immutable Configuration Version History
              </span>
              {configuration_versions.map((cfg: any) => (
                <div key={cfg.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-mono font-bold border border-orange-500/30">
                        VERSION {cfg.version_number}
                      </span>
                      <span className="font-bold text-white text-sm">{cfg.title}</span>
                      <span className="text-slate-500 text-[10px] font-mono">
                        Level {cfg.permission_level} Permission
                      </span>
                    </div>
                    {cfg.version_number !== employee.current_config_version && (
                      <button
                        onClick={() => handleRollback(cfg.version_number)}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded flex items-center space-x-1 font-semibold"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Rollback to v{cfg.version_number}</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 font-mono text-[10px] block">SYSTEM INSTRUCTIONS:</span>
                    <p className="p-2.5 bg-slate-900 rounded border border-slate-800 font-mono text-[11px] text-slate-300">
                      {cfg.system_instructions}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <span className="text-slate-500 font-mono text-[10px] py-0.5">TOOLS WHITELIST:</span>
                    {cfg.tools_whitelist?.map((tool: string) => (
                      <span key={tool} className="px-2 py-0.5 bg-slate-900 text-slate-300 rounded font-mono text-[10px] border border-slate-800">
                        {tool}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-500">
                    <span>Authorized By: {cfg.authorized_by_principal}</span>
                    <span>Reason: {cfg.change_reason}</span>
                    <span>{cfg.created_at ? new Date(cfg.created_at).toLocaleString() : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lifecycle Action Dialog Modal */}
      {actionType && (
        <LifecycleActionDialog
          employee={employee}
          actionType={actionType}
          onClose={() => setActionType(null)}
          onSuccess={async () => {
            setActionType(null);
            await fetchDossier();
            onRefresh();
          }}
        />
      )}
    </div>
  );
};
