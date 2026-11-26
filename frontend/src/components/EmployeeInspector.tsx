import React from 'react';
import { Agent } from '../types';
import { User, Shield, Briefcase, Layers, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  agent: Agent;
  onClose: () => void;
  orbiState: string;
}

export const EmployeeInspector: React.FC<Props> = ({ agent, onClose, orbiState }) => {
  const isAuri = agent.agent_id === 'auri_ceo_interface' || agent.agent_id === 'orbi_ceo_interface';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className="font-pixel text-[10px] text-orange-400">PERSONNEL DOSSIER //</span>
            <span className="text-xs font-mono text-slate-400 uppercase">{agent.agent_id}</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800">
            ✕
          </button>
        </div>

        {/* Profile Card */}
        <div className="p-6 space-y-6">
          <div className="flex items-center space-x-5">
            <div className="w-24 h-24 rounded-2xl bg-slate-950 border-2 border-slate-800 flex items-center justify-center p-2 shadow-inner">
              <img
                src={
                  isAuri
                    ? `/assets/sprites/auri/orbi_${orbiState || 'idle'}.gif`
                    : agent.avatar_file?.startsWith('/')
                    ? agent.avatar_file
                    : agent.avatar_file?.startsWith('orbi_')
                    ? `/assets/sprites/auri/${agent.avatar_file}`
                    : `/assets/sprites/employees/${agent.avatar_file || `${agent.agent_id}.png`}`
                }
                alt={agent.name}
                className="w-20 h-20 pixelated object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/assets/sprites/auri/orbi_idle_f0.png';
                }}
              />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{agent.name}</h2>
              <p className="text-sm text-orange-400 font-semibold">{agent.role}</p>
              <div className="flex items-center space-x-2 mt-2">
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                  Floor {agent.floor}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300">
                  Level {agent.permission_level} Permission
                </span>
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-2.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-mono">Department:</span>
              <span className="text-slate-200 font-semibold">{agent.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-mono">Reporting Manager:</span>
              <span className="text-slate-200">{agent.manager_id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-mono">Current Status:</span>
              <span className="capitalize text-emerald-400 font-bold">{agent.status}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-mono">Tasks Completed:</span>
              <span className="text-slate-200">{agent.completed_tasks_count} tasks</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-mono">Error Record:</span>
              <span className={agent.error_count > 0 ? 'text-red-400' : 'text-slate-400'}>
                {agent.error_count} incidents
              </span>
            </div>
          </div>

          {/* Active Workstation Assignment */}
          <div className="p-4 bg-orange-950/20 border border-orange-500/30 rounded-xl space-y-1">
            <span className="text-[10px] font-mono uppercase text-orange-400 font-bold block">Assigned Workstation</span>
            <p className="text-xs text-slate-300">
              {agent.current_task_title ? agent.current_task_title : "Idle at designated departmental desk. Ready for task dispatch."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
