import React, { useState } from 'react';
import { Approval } from '../types';
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle, Play, Video, ExternalLink } from 'lucide-react';

interface Props {
  approvals: Approval[];
  onResolve: (approvalId: string, action: 'approve' | 'reject', feedback: string) => Promise<void>;
  onClose: () => void;
}

export const ApprovalsModal: React.FC<Props> = ({ approvals, onResolve, onClose }) => {
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const pendingList = approvals.filter(a => a.status === 'pending');

  const handleAction = async (approvalId: string, action: 'approve' | 'reject') => {
    setSubmittingId(approvalId);
    try {
      await onResolve(approvalId, action, feedbackMap[approvalId] || '');
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">CEO Level 3 Approval Gate</h2>
              <p className="text-xs text-slate-400">Strict permission boundary: No external publishing without human signoff</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800">
            ✕
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {pendingList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <p className="text-base font-bold text-slate-200">No Pending Approvals</p>
              <p className="text-xs text-slate-500">All agent actions are currently cleared and executing normally.</p>
            </div>
          ) : (
            pendingList.map((appr) => (
              <div key={appr.id} className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-xs font-mono font-bold border border-orange-500/30">
                      ACTION: {appr.action_type.toUpperCase()}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{appr.description}</h3>
                    <span className="text-xs text-slate-500 font-mono">Request ID: {appr.id}</span>
                  </div>
                </div>

                {/* Media Preview Box */}
                {appr.preview_url && (
                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg">
                    <span className="text-xs font-mono text-slate-400 block mb-2 font-semibold">PREVIEW ARTIFACT:</span>
                    {appr.preview_url.endsWith('.mp4') ? (
                      <video
                        src={`/media/${appr.preview_url.split('/').slice(-2).join('/')}`}
                        controls
                        className="w-full max-h-64 rounded bg-black object-contain"
                      />
                    ) : (
                      <img
                        src={`/media/${appr.preview_url.split('/').slice(-2).join('/')}`}
                        alt="Preview"
                        className="max-h-56 rounded border border-slate-700 object-contain mx-auto"
                      />
                    )}
                  </div>
                )}

                {/* CEO Feedback Input */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-slate-400">CEO Revision Notes / Feedback (optional):</label>
                  <input
                    type="text"
                    value={feedbackMap[appr.id] || ''}
                    onChange={(e) => setFeedbackMap({ ...feedbackMap, [appr.id]: e.target.value })}
                    placeholder="Enter notes for the agent or leave blank to accept standard release..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-orange-500"
                  />
                </div>

                {/* Approve / Reject Buttons */}
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={() => handleAction(appr.id, 'reject')}
                    disabled={submittingId === appr.id}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-red-950/40 hover:text-red-400 text-slate-300 rounded-lg text-xs font-bold transition-all border border-slate-700"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Request Revision</span>
                  </button>

                  <button
                    onClick={() => handleAction(appr.id, 'approve')}
                    disabled={submittingId === appr.id}
                    className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-600/30"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Publish</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
