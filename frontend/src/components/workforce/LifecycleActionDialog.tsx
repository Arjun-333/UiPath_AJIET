import React, { useState } from 'react';
import { WorkforceEmployee } from '../../types';
import { AlertTriangle, ShieldAlert, CheckCircle2, X } from 'lucide-react';

interface Props {
  employee: WorkforceEmployee;
  actionType: 'promote' | 'retrain' | 'reassign' | 'suspend' | 'terminate' | 'reactivate';
  onClose: () => void;
  onSuccess: () => void;
}

export const LifecycleActionDialog: React.FC<Props> = ({
  employee,
  actionType,
  onClose,
  onSuccess
}) => {
  const [reason, setReason] = useState('');
  const [typedConfirm, setTypedConfirm] = useState('');
  const [newTitle, setNewTitle] = useState(employee.current_title);
  const [newRole, setNewRole] = useState(employee.current_title);
  const [newPermLevel, setNewPermLevel] = useState(2);
  const [newDept, setNewDept] = useState(employee.department);
  const [newFloor, setNewFloor] = useState(employee.floor);
  const [updatedInstructions, setUpdatedInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isTermination = actionType === 'terminate';
  const isNameConfirmed = isTermination 
    ? typedConfirm.trim().toLowerCase() === employee.name.trim().toLowerCase()
    : true;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A mandatory business justification reason is required for the audit trail.');
      return;
    }
    if (isTermination && !isNameConfirmed) {
      setError(`You must type '${employee.name}' exactly to confirm termination.`);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        action: actionType,
        agent_id: employee.agent_id,
        approval_id: `appr_exec_${Date.now()}`,
        reason: reason.trim()
      };

      if (actionType === 'promote') {
        payload.new_title = newTitle;
        payload.new_role = newRole;
        payload.new_permission_level = newPermLevel;
      } else if (actionType === 'retrain') {
        payload.updated_instructions = updatedInstructions || 'Refined prompt guidelines and stricter rubric validation.';
        payload.updated_tools = ['video_renderer', 'tts_engine', 'ffmpeg'];
      } else if (actionType === 'reassign') {
        payload.new_department = newDept;
        payload.new_floor = Number(newFloor);
      } else if (actionType === 'terminate') {
        payload.typed_confirmation_name = typedConfirm;
      }

      const res = await fetch('/api/workforce/lifecycle/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Autonomia-Principal': 'arjun_ceo'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Lifecycle action execution failed');
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Error executing action');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          isTermination ? 'bg-rose-950/60 border-rose-800' : 'bg-slate-950 border-slate-800'
        }`}>
          <div className="flex items-center space-x-2.5">
            <ShieldAlert className={`w-5 h-5 ${isTermination ? 'text-rose-400' : 'text-orange-400'}`} />
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                CEO Authorization // {actionType}
              </h2>
              <p className="text-[11px] text-slate-400">Target: {employee.name} ({employee.current_title})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/80 rounded-lg text-rose-300">
              {error}
            </div>
          )}

          {/* Action-Specific Inputs */}
          {actionType === 'promote' && (
            <div className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1 font-mono">New Official Title:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1 font-mono">Role Key:</label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1 font-mono">Permission Level:</label>
                  <select
                    value={newPermLevel}
                    onChange={(e) => setNewPermLevel(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  >
                    <option value={2}>Level 2 (Standard Autonomous)</option>
                    <option value={3}>Level 3 (Senior Execution Gate)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {actionType === 'reassign' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1 font-mono">Target Department:</label>
                <select
                  value={newDept}
                  onChange={(e) => setNewDept(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  <option value="Creative & Video Production">Creative & Video Production</option>
                  <option value="Documentation & Campus">Documentation & Campus</option>
                  <option value="Technology & Infrastructure">Technology & Infrastructure</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1 font-mono">Target Floor:</label>
                <input
                  type="number"
                  min={0}
                  max={5}
                  value={newFloor}
                  onChange={(e) => setNewFloor(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  required
                />
              </div>
            </div>
          )}

          {actionType === 'retrain' && (
            <div>
              <label className="text-slate-400 block mb-1 font-mono">Updated System Instructions & Rubric:</label>
              <textarea
                value={updatedInstructions}
                onChange={(e) => setUpdatedInstructions(e.target.value)}
                rows={3}
                placeholder="Enter refined prompt instructions, output format rules, and edge-case guardrails..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                required
              />
            </div>
          )}

          {/* Mandatory Business Reason */}
          <div>
            <label className="text-slate-400 block mb-1 font-mono">
              Mandatory CEO Justification / Reason:
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Audit log justification (e.g. Completed benchmark evaluation...)"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
              required
            />
          </div>

          {/* Strict Typed Confirmation for Termination */}
          {isTermination && (
            <div className="p-4 bg-rose-950/30 border border-rose-800/80 rounded-xl space-y-2">
              <span className="text-[11px] font-mono text-rose-300 font-bold block">
                SAFETY GUARD: Typed Confirmation Required
              </span>
              <p className="text-[11px] text-slate-400">
                To confirm permanent soft-termination and archiving, type <span className="font-bold text-white underline">{employee.name}</span> below:
              </p>
              <input
                type="text"
                value={typedConfirm}
                onChange={(e) => setTypedConfirm(e.target.value)}
                placeholder={`Type '${employee.name}' to confirm`}
                className="w-full px-3 py-2 bg-slate-950 border border-rose-800/80 rounded-lg text-rose-300 font-mono"
                required
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || (isTermination && !isNameConfirmed)}
              className={`px-4 py-2 font-bold rounded-lg text-white transition ${
                isTermination
                  ? 'bg-rose-600 hover:bg-rose-500 disabled:opacity-50'
                  : 'bg-orange-500 hover:bg-orange-400 disabled:opacity-50'
              }`}
            >
              {submitting ? 'Executing...' : `Authorize & Execute ${actionType.toUpperCase()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
