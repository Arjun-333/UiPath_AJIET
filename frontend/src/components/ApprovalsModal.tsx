import React, { useState } from 'react';
import { Approval } from '../types';
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle, Play, Video, ExternalLink, UserCheck, Sparkles, Award } from 'lucide-react';

interface Props {
  approvals: Approval[];
  onResolve: (approvalId: string, action: 'approve' | 'reject', feedback: string) => Promise<void>;
  onResolveAll?: (action: 'approve' | 'reject', feedback: string) => Promise<void>;
  onClose: () => void;
}

export const ApprovalsModal: React.FC<Props> = ({ approvals, onResolve, onResolveAll, onClose }) => {
  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [confirmBulkAction, setConfirmBulkAction] = useState<'approve' | 'reject' | null>(null);
  const [bulkFeedback, setBulkFeedback] = useState<string>('');
  const [isBulkSubmitting, setIsBulkSubmitting] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'publish' | 'workforce' | 'advisor'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const pendingList = approvals.filter(a => a.status === 'pending');
  const filteredList = pendingList.filter((a) => {
    const matchesCat =
      filterCategory === 'all'
        ? true
        : filterCategory === 'publish'
        ? a.action_type === 'publish_content'
        : filterCategory === 'workforce'
        ? a.action_type.startsWith('workforce_')
        : a.action_type.startsWith('advisor_');
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch = !q || a.description.toLowerCase().includes(q) || a.action_type.toLowerCase().includes(q) || a.id.toLowerCase().includes(q);
    return matchesCat && matchesSearch;
  });

  const handleAction = async (approvalId: string, action: 'approve' | 'reject') => {
    setSubmittingId(approvalId);
    setErrorMessage(null);
    try {
      await onResolve(approvalId, action, feedbackMap[approvalId] || '');
    } catch (err: any) {
      setErrorMessage(err.message || 'Action resolution failed. Please try again.');
    } finally {
      setSubmittingId(null);
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (filteredList.length === 0) return;
    setIsBulkSubmitting(true);
    setErrorMessage(null);
    try {
      const isUnfiltered = filteredList.length === pendingList.length;
      if (isUnfiltered && onResolveAll) {
        await onResolveAll(action, bulkFeedback);
      } else {
        for (const appr of filteredList) {
          await onResolve(appr.id, action, bulkFeedback || feedbackMap[appr.id] || '');
        }
      }
      setConfirmBulkAction(null);
      setBulkFeedback('');
    } catch (err: any) {
      setErrorMessage(err.message || 'Bulk action resolution failed. Please check remaining items.');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  const getActionBadgeColor = (actionType: string) => {
    if (actionType === 'workforce_deploy') {
      return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    }
    if (actionType.startsWith('advisor_')) {
      return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    }
    return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
  };

  const getApproveButtonLabel = (actionType: string) => {
    if (actionType === 'workforce_deploy') return 'Authorize Hire & Deploy';
    if (actionType.startsWith('advisor_')) return 'Authorize Recommendation';
    if (actionType === 'publish_content') return 'Approve & Publish';
    return 'Approve & Authorize';
  };

  const getRejectButtonLabel = (actionType: string) => {
    if (actionType === 'workforce_deploy') return 'Reject Candidate';
    if (actionType.startsWith('advisor_')) return 'Dismiss Recommendation';
    if (actionType === 'publish_content') return 'Request Revision';
    return 'Reject Request';
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
              <p className="text-xs text-slate-400">Strict permission boundary: Human CEO authorization required for publishing, recruitment and lifecycle changes</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors">
            ✕
          </button>
        </div>

        {/* Filter & Bulk Actions Bar */}
        {pendingList.length > 0 && (
          <div className="px-6 py-3 bg-slate-900/95 border-b border-slate-800 flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {(['all', 'publish', 'workforce', 'advisor'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setFilterCategory(cat);
                      setConfirmBulkAction(null);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold uppercase transition-colors cursor-pointer ${
                      filterCategory === cat
                        ? 'bg-[#fa4616] text-white'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter by title or ID..."
                className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#fa4616] w-full sm:w-56"
              />
            </div>

            {filteredList.length > 1 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="text-xs font-mono text-slate-300">
                <strong className="text-[#fa4616]">{filteredList.length}</strong>{filteredList.length !== pendingList.length ? ` of ${pendingList.length}` : ''} pending requests
              </span>
              {confirmBulkAction === null ? (
                <div className="flex items-center space-x-2.5">
                  <button
                    onClick={() => setConfirmBulkAction('reject')}
                    disabled={isBulkSubmitting || submittingId !== null}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-red-950/50 hover:text-red-300 text-slate-300 rounded-lg text-xs font-bold transition-all border border-slate-700 disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject {filteredList.length !== pendingList.length ? 'Filtered' : 'All'} ({filteredList.length})</span>
                  </button>
                  <button
                    onClick={() => setConfirmBulkAction('approve')}
                    disabled={isBulkSubmitting || submittingId !== null}
                    className="flex items-center space-x-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Approve {filteredList.length !== pendingList.length ? 'Filtered' : 'All'} ({filteredList.length})</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      setConfirmBulkAction(null);
                      setBulkFeedback('');
                    }}
                    disabled={isBulkSubmitting}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold border border-slate-700 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleBulkAction(confirmBulkAction)}
                    disabled={isBulkSubmitting}
                    className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
                      confirmBulkAction === 'approve'
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-red-600 hover:bg-red-500 text-white shadow-md shadow-red-600/30'
                    }`}
                  >
                    {confirmBulkAction === 'approve' ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {isBulkSubmitting
                        ? `Processing ${filteredList.length} items...`
                        : `Confirm ${confirmBulkAction === 'approve' ? 'Approve' : 'Reject'} (${filteredList.length})`}
                    </span>
                  </button>
                </div>
              )}
            </div>
            )}

            {confirmBulkAction !== null && (
              <input
                type="text"
                value={bulkFeedback}
                onChange={(e) => setBulkFeedback(e.target.value)}
                disabled={isBulkSubmitting}
                placeholder={`Optional CEO note applied to ${filteredList.length} ${confirmBulkAction === 'approve' ? 'approved' : 'rejected'} requests...`}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              />
            )}
          </div>
        )}

        {errorMessage && (
          <div className="mx-6 mt-4 p-3 bg-red-950/60 border border-red-500/40 rounded-xl flex items-center space-x-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {filteredList.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
              <p className="text-base font-bold text-slate-200">{pendingList.length === 0 ? 'No Pending Approvals' : 'No Matching Approvals'}</p>
              <p className="text-xs text-slate-500">{pendingList.length === 0 ? 'All agent actions are currently cleared and executing normally.' : 'Try clearing the category filter or search query.'}</p>
            </div>
          ) : (
            filteredList.map((appr) => (
              <div key={appr.id} className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold border ${getActionBadgeColor(appr.action_type)}`}>
                      ACTION: {appr.action_type.toUpperCase()}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1.5">{appr.description}</h3>
                    <span className="text-xs text-slate-500 font-mono">Request ID: {appr.id}</span>
                  </div>
                </div>

                {/* Structured Preview Box for Candidate Hire */}
                {appr.action_type === 'workforce_deploy' && appr.preview_data && (
                  <div className="p-4 bg-purple-950/20 border border-purple-500/20 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-purple-300 font-semibold flex items-center gap-1.5">
                        <UserCheck className="w-4 h-4" /> CANDIDATE SPECIFICATION
                      </span>
                      {appr.preview_data.avg_score !== undefined && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                          Sandbox Test Score: {appr.preview_data.avg_score}%
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1">
                      <div><strong className="text-slate-400">Target Role:</strong> {appr.preview_data.title || 'Specialist'}</div>
                      <div><strong className="text-slate-400">Department:</strong> {appr.preview_data.department} (Floor {appr.preview_data.floor})</div>
                      <div><strong className="text-slate-400">Tests Passed:</strong> {appr.preview_data.test_count || 1} standard sandbox evaluations</div>
                      <div><strong className="text-slate-400">Status:</strong> Deployment Gate Awaiting CEO Signature</div>
                    </div>
                  </div>
                )}

                {/* Structured Preview Box for Advisor Recommendation */}
                {appr.action_type.startsWith('advisor_') && appr.preview_data && (
                  <div className="p-4 bg-cyan-950/20 border border-cyan-500/20 rounded-lg space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-cyan-300 font-semibold flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4" /> ADVISOR DIAGNOSTIC FINDINGS
                      </span>
                      {appr.preview_data.confidence !== undefined && (
                        <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                          Confidence: {Math.round(appr.preview_data.confidence * 100)}%
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {appr.preview_data.reasoning || 'Diagnostic evidence collected from 30-day operational telemetry.'}
                    </p>
                  </div>
                )}

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
                    disabled={isBulkSubmitting || submittingId === appr.id}
                    className="flex items-center space-x-1.5 px-4 py-2 bg-slate-800 hover:bg-red-950/40 hover:text-red-400 text-slate-300 rounded-lg text-xs font-bold transition-all border border-slate-700 disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{getRejectButtonLabel(appr.action_type)}</span>
                  </button>

                  <button
                    onClick={() => handleAction(appr.id, 'approve')}
                    disabled={isBulkSubmitting || submittingId === appr.id}
                    className="flex items-center space-x-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {submittingId === appr.id ? 'Processing...' : getApproveButtonLabel(appr.action_type)}
                    </span>
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
