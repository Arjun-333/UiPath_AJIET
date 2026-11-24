import React, { useState, useEffect } from 'react';
import { 
  FileText, Shield, Filter, Search, ChevronDown, ChevronRight, 
  RotateCcw, AlertTriangle, CheckCircle2, User, Clock, RefreshCw, X
} from 'lucide-react';
import { WorkforceAuditLog } from '../../types';

interface Props {
  onClose?: () => void;
}

export const AuditLogViewer: React.FC<Props> = ({ onClose }) => {
  const [logs, setLogs] = useState<WorkforceAuditLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [searchTarget, setSearchTarget] = useState<string>('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let url = '/api/workforce/audit/logs?limit=100';
      if (selectedAction !== 'all') url += `&action=${selectedAction}`;
      if (searchTarget.trim()) url += `&target_agent_id=${encodeURIComponent(searchTarget.trim())}`;
      
      const res = await fetch(url);
      if (res.ok) {
        setLogs(await res.json());
      }
    } catch (err) {
      console.error('Audit log fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedAction]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadge = (action: string) => {
    switch (action.toLowerCase()) {
      case 'hire':
      case 'reactivate':
      case 'promote':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'retrain':
      case 'reassign':
      case 'rollback':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'suspend':
      case 'terminate':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Forensic Workforce Audit Trail</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                APPEND-ONLY IMMUTABLE
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Complete tamper-evident log of all consequential personnel lifecycle events and configuration transitions.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchLogs}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh logs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex items-center space-x-3 mb-4 shrink-0">
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {['all', 'hire', 'promote', 'retrain', 'reassign', 'suspend', 'terminate', 'rollback'].map(act => (
            <button
              key={act}
              onClick={() => setSelectedAction(act)}
              className={`px-3 py-1 rounded-lg text-xs font-mono uppercase font-bold transition-all ${
                selectedAction === act
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {act}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by target agent ID (e.g. vid_edit_01)..."
              value={searchTarget}
              onChange={e => setSearchTarget(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold border border-slate-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-y-auto border border-slate-800 rounded-xl">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-slate-500">
            Loading cryptographic audit records...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500">
            No audit records match the current filter criteria.
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {logs.map(log => {
              const isExpanded = expandedLogId === log.id;
              const dateStr = log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A';

              return (
                <div key={log.id} className="bg-slate-950 hover:bg-slate-900/50 transition-colors">
                  <div 
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="p-3.5 flex items-center justify-between cursor-pointer text-xs"
                  >
                    <div className="flex items-center space-x-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getActionBadge(log.action)} uppercase`}>
                        {log.action}
                      </span>
                      <span className="font-bold text-white font-mono">{log.target_agent_id}</span>
                      <span className="text-slate-400">({log.target_agent_name})</span>
                      <span className="text-slate-500">•</span>
                      <span className="text-slate-300 text-[11px] truncate max-w-md">{log.reason}</span>
                    </div>

                    <div className="flex items-center space-x-4 text-right font-mono text-[11px] text-slate-400">
                      <div>
                        <span className="text-slate-300 font-bold">{log.actor_principal}</span>
                        <span className="text-slate-500 text-[10px] ml-1">[{log.actor_role}]</span>
                      </div>
                      <div className="text-slate-500">{dateStr}</div>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-4 bg-slate-900/80 border-t border-slate-800 text-xs font-mono space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">State Before Action</div>
                          <pre className="text-slate-300 text-[11px] overflow-x-auto">
                            {JSON.stringify(log.before_state, null, 2)}
                          </pre>
                        </div>
                        <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                          <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">State After Action</div>
                          <pre className="text-emerald-300 text-[11px] overflow-x-auto">
                            {JSON.stringify(log.after_state, null, 2)}
                          </pre>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800">
                        <div>Linked Approval ID: <span className="text-slate-300">{log.linked_approval_id || 'N/A'}</span></div>
                        <div>Correlation ID: <span className="text-slate-300">{log.correlation_id}</span></div>
                        <div>Record ID: <span className="text-slate-300">{log.id}</span></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
