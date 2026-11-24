import React, { useState, useEffect } from 'react';
import { 
  Sparkles, AlertTriangle, CheckCircle2, XCircle, ArrowRight, 
  RefreshCw, ShieldCheck, Database, Layers, Filter, Check, X,
  Clock, DollarSign, Activity, FileText, UserPlus
} from 'lucide-react';
import { WorkforceRecommendation, WorkforceOrganizationalFinding } from '../../types';

interface Props {
  onClose?: () => void;
  onOpenRecruitmentWithFinding?: (finding: WorkforceOrganizationalFinding) => void;
}

export const WorkforceAdvisorPanel: React.FC<Props> = ({
  onClose,
  onOpenRecruitmentWithFinding
}) => {
  const [activeTab, setActiveTab] = useState<'findings' | 'recommendations'>('findings');
  const [findings, setFindings] = useState<WorkforceOrganizationalFinding[]>([]);
  const [recommendations, setRecommendations] = useState<WorkforceRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fRes, rRes] = await Promise.all([
        fetch('/api/workforce/advisor/findings'),
        fetch('/api/workforce/advisor/recommendations?status=all')
      ]);
      if (fRes.ok) setFindings(await fRes.json());
      if (rRes.ok) setRecommendations(await rRes.json());
    } catch (err) {
      console.error('Advisor fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRunScan = async () => {
    setIsScanning(true);
    try {
      const res = await fetch('/api/workforce/advisor/run?force=true', {
        method: 'POST',
        headers: { 'X-Autonomia-Principal': 'arjun_ceo' }
      });
      if (res.ok) {
        setActionMessage('Workforce diagnostic scan completed successfully.');
        await fetchData();
      }
    } finally {
      setIsScanning(false);
    }
  };

  const handleAcceptRec = async (recId: string) => {
    try {
      const res = await fetch(`/api/workforce/advisor/recommendations/${recId}/accept`, {
        method: 'POST',
        headers: { 'X-Autonomia-Principal': 'arjun_ceo' }
      });
      if (res.ok) {
        const data = await res.json();
        setActionMessage(`Recommendation accepted! Approval #${data.approval_id} submitted to CEO.`);
        fetchData();
      }
    } catch (err: any) {
      setActionMessage(`Failed to accept: ${err.message}`);
    }
  };

  const handleDismissRec = async (recId: string) => {
    try {
      const res = await fetch(`/api/workforce/advisor/recommendations/${recId}/dismiss`, {
        method: 'POST',
        headers: { 'X-Autonomia-Principal': 'arjun_ceo' }
      });
      if (res.ok) {
        setActionMessage('Recommendation dismissed.');
        fetchData();
      }
    } catch (err: any) {
      setActionMessage(`Failed to dismiss: ${err.message}`);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'MEDIUM':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Workforce Continuous Improvement & Advisor</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                VERIFIABLE FINDINGS
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Autonomous organizational weakness detection, evidence-backed recommendations, and closed-loop impact verification.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleRunScan}
            disabled={isScanning}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 transition-all shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-orange-400' : 'text-slate-400'}`} />
            <span>{isScanning ? 'Analyzing Telemetry...' : 'Run Diagnostic Scan'}</span>
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

      {actionMessage && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between shrink-0">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800 pb-3 mb-4 shrink-0">
        <button
          onClick={() => setActiveTab('findings')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'findings'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Organizational Findings ({findings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('recommendations')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'recommendations'
              ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Verifiable Recommendations ({recommendations.length})</span>
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {loading ? (
          <div className="p-8 text-center text-xs font-mono text-slate-500">
            Analyzing organizational workforce signals...
          </div>
        ) : activeTab === 'findings' ? (
          findings.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-white">No Systemic Bottlenecks Detected</div>
              <div className="text-xs text-slate-400 mt-1">
                All departments, handoffs, and workflows are operating within normal operational parameters.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {findings.map(f => (
                <div key={f.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${getSeverityBadge(f.severity)}`}>
                          {f.severity}
                        </span>
                        <span className="text-xs font-mono text-slate-400">{f.department}</span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs font-mono text-slate-400">Confidence: {(f.confidence_score * 100).toFixed(0)}%</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1.5">{f.title}</h4>
                      <p className="text-xs text-slate-300 mt-1">{f.description}</p>
                    </div>

                    {f.suggested_action?.toLowerCase().includes('recruit') && onOpenRecruitmentWithFinding && (
                      <button
                        onClick={() => onOpenRecruitmentWithFinding(f)}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/40 text-orange-300 rounded-lg text-xs font-bold transition-all"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Recruit Fix</span>
                      </button>
                    )}
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1">
                    <div className="text-slate-400 font-mono text-[11px] font-bold">SUGGESTED ACTION:</div>
                    <div className="text-slate-200">{f.suggested_action}</div>
                  </div>

                  {f.evidence && Object.keys(f.evidence).length > 0 && (
                    <div className="text-[11px] font-mono text-slate-500 bg-slate-900/60 p-2 rounded border border-slate-800/80">
                      <span className="text-slate-400 font-bold">Evidence: </span>
                      {JSON.stringify(f.evidence)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        ) : (
          recommendations.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-slate-950 border border-slate-800">
              <Sparkles className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <div className="text-sm font-bold text-white">No Active Recommendations</div>
              <div className="text-xs text-slate-400 mt-1">
                The Workforce Advisor generates actionable recommendations when metrics meet diagnostic criteria.
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map(r => (
                <div key={r.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30 uppercase">
                          {r.rec_type}
                        </span>
                        <span className="text-xs font-mono text-slate-400">Agent: {r.target_agent_id}</span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs font-mono text-slate-400">Sample: {r.sample_size} tasks</span>
                        <span className="text-xs text-slate-500">•</span>
                        <span className="text-xs font-mono text-slate-400">Confidence: {(r.confidence_score * 100).toFixed(0)}%</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mt-1.5">{r.title}</h4>
                      <p className="text-xs text-slate-300 mt-1">{r.reasoning}</p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {r.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleAcceptRec(r.id)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-xs font-bold shadow-md shadow-orange-600/30 transition-all"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept (Route to CEO)</span>
                          </button>
                          <button
                            onClick={() => handleDismissRec(r.id)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg text-xs transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                          r.status === 'accepted' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {r.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  {r.evidence && (
                    <div className="text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      <div className="text-slate-300 font-bold mb-1">CITED EVIDENCE RECORDS:</div>
                      <div>Sample IDs: {JSON.stringify(r.evidence.telemetry_sample_ids || r.evidence.evaluated_tasks || [])}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
};
