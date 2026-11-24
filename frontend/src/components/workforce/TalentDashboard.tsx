import React, { useState, useEffect } from 'react';
import { LeaderboardItem, WorkforceEmployee } from '../../types';
import { 
  Award, TrendingUp, AlertTriangle, ShieldCheck, UserCheck, 
  Clock, DollarSign, CheckCircle2, ChevronRight, Filter, 
  Sparkles, Layers, Zap, Info, UserPlus
} from 'lucide-react';

interface Props {
  onSelectEmployee: (agentId: string) => void;
  onOpenRecruitment: () => void;
  onOpenAdvisor: () => void;
  onOpenAuditLogs: () => void;
}

export const TalentDashboard: React.FC<Props> = ({
  onSelectEmployee,
  onOpenRecruitment,
  onOpenAdvisor,
  onOpenAuditLogs
}) => {
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('composite_score');
  const [leaderboard, setLeaderboard] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = `/api/workforce/analytics/leaderboard?period_days=${periodDays}&department=${selectedDept}&sort_by=${sortBy}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load leaderboard');
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [periodDays, selectedDept, sortBy]);

  // Aggregate Stats
  const totalTasks = leaderboard.reduce((acc, item) => acc + item.activity_counts.completed_tasks, 0);
  const validRanked = leaderboard.filter(i => !i.is_insufficient_data);
  const avgQuality = validRanked.length > 0 
    ? (validRanked.reduce((acc, item) => acc + item.metrics.quality_score, 0) / validRanked.length).toFixed(1)
    : 'N/A';
  const totalCost = leaderboard.reduce((acc, item) => acc + (item.metrics.cost_per_task_usd * item.activity_counts.completed_tasks), 0).toFixed(3);

  return (
    <div className="flex flex-col h-full space-y-6 overflow-y-auto pr-2">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              Workforce Intelligence & Talent Management
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                REAL-TIME AUDITED
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Deterministic performance ranking, skill gap diagnostics, and CEO lifecycle governance
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenAuditLogs}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5 transition"
          >
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>Audit Trail</span>
          </button>
          <button
            onClick={onOpenAdvisor}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 flex items-center space-x-1.5 transition"
          >
            <Sparkles className="w-4 h-4 text-orange-400" />
            <span>Workforce Advisor</span>
          </button>
          <button
            onClick={onOpenRecruitment}
            className="px-3.5 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white text-xs font-bold rounded-lg shadow-lg shadow-orange-500/20 flex items-center space-x-1.5 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Recruit AI Employee</span>
          </button>
        </div>
      </div>

      {/* Filter & Period Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-1">
        {/* Department Filter Pills */}
        <div className="flex items-center space-x-2">
          {['all', 'Creative & Video Production', 'Documentation & Campus', 'Technology & Infrastructure'].map((dept) => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                selectedDept === dept
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {dept === 'all' ? 'All Departments' : dept.split('&')[0].trim()}
            </button>
          ))}
        </div>

        {/* Evaluation Period Selector */}
        <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
          <span className="text-slate-500 px-2 font-mono text-[11px]">Period:</span>
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setPeriodDays(days)}
              className={`px-2.5 py-1 rounded font-semibold transition ${
                periodDays === days
                  ? 'bg-slate-800 text-orange-400 border border-slate-700'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Period Deliverables
          </span>
          <div className="text-2xl font-bold text-white">{totalTasks} tasks</div>
          <p className="text-[11px] text-slate-500">Completed in last {periodDays} days</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5 text-orange-400" />
            Average Output Quality
          </span>
          <div className="text-2xl font-bold text-white">{avgQuality} <span className="text-xs text-slate-500 font-normal">/ 100</span></div>
          <p className="text-[11px] text-slate-500">Deterministic QA inspector scores</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-cyan-400" />
            Fleet Inference Cost
          </span>
          <div className="text-2xl font-bold text-white">${totalCost}</div>
          <p className="text-[11px] text-slate-500">Nemotron 3 Ultra token attribution</p>
        </div>

        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            Audited AI Fleet
          </span>
          <div className="text-2xl font-bold text-white">{leaderboard.length} employees</div>
          <p className="text-[11px] text-slate-500">{validRanked.length} ranked with sufficient data</p>
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="font-pixel text-xs text-orange-400">ORGANIZATION LEADERBOARD //</span>
            <span className="text-xs text-slate-400">Minimum Sample Rule: 10 Tasks</span>
          </div>
          <span className="text-[10px] font-mono text-slate-500">COMPOSITE SCORE FORMULA v1.0</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">Computing deterministic workforce statistics...</div>
        ) : error ? (
          <div className="p-8 text-center text-red-400 text-xs">{error}</div>
        ) : leaderboard.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No employees found for this filter.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/50 text-[10px] font-mono uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Rank & Employee</th>
                  <th className="py-3 px-3">Department</th>
                  <th className="py-3 px-3">Lifecycle</th>
                  <th className="py-3 px-3 text-right">Completion</th>
                  <th className="py-3 px-3 text-right">Quality</th>
                  <th className="py-3 px-3 text-right">Accuracy</th>
                  <th className="py-3 px-3 text-right">Exec Time</th>
                  <th className="py-3 px-3 text-right">Cost/Task</th>
                  <th className="py-3 px-3 text-right">Approval</th>
                  <th className="py-3 px-4 text-center">Composite (v1.0)</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {leaderboard.map((item, index) => {
                  const isInsufficient = item.is_insufficient_data;
                  return (
                    <tr
                      key={item.agent_id}
                      className="hover:bg-slate-800/40 transition group cursor-pointer"
                      onClick={() => onSelectEmployee(item.agent_id)}
                    >
                      {/* Rank & Employee */}
                      <td className="py-3 px-4 flex items-center space-x-3">
                        <span className="font-mono text-xs text-slate-500 w-5">
                          {isInsufficient ? '-' : `#${index + 1}`}
                        </span>
                        <div>
                          <span className="font-bold text-white group-hover:text-orange-400 transition block">
                            {item.name}
                          </span>
                          <span className="text-[10px] text-slate-400">{item.title}</span>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-3 text-slate-400">
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono">
                          {item.department.split('&')[0].trim()}
                        </span>
                      </td>

                      {/* Lifecycle */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold uppercase ${
                          item.lifecycle_state === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          item.lifecycle_state === 'in_retraining' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                          item.lifecycle_state === 'suspended' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          'bg-slate-800 text-slate-400'
                        }`}>
                          {item.lifecycle_state}
                        </span>
                      </td>

                      {/* Completion Rate */}
                      <td className="py-3 px-3 text-right font-mono">
                        {item.metrics.completion_rate}%
                      </td>

                      {/* Output Quality */}
                      <td className="py-3 px-3 text-right font-mono font-semibold text-slate-200">
                        {item.metrics.quality_score.toFixed(1)}
                      </td>

                      {/* Accuracy */}
                      <td className="py-3 px-3 text-right font-mono">
                        {item.metrics.accuracy_score.toFixed(1)}%
                      </td>

                      {/* Exec Time */}
                      <td className="py-3 px-3 text-right font-mono text-slate-400">
                        {item.metrics.execution_time_seconds}s
                      </td>

                      {/* Cost Per Task */}
                      <td className="py-3 px-3 text-right font-mono text-cyan-400">
                        ${item.metrics.cost_per_task_usd.toFixed(4)}
                      </td>

                      {/* Approval Rate */}
                      <td className="py-3 px-3 text-right font-mono text-[11px] text-slate-400">
                        {item.metrics.approval_rate_label}
                      </td>

                      {/* Composite Score with Insufficient Data State */}
                      <td className="py-3 px-4 text-center">
                        {isInsufficient ? (
                          <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-amber-950/30 text-amber-400 border border-amber-500/30 text-[10px] font-mono">
                            <AlertTriangle className="w-3 h-3" />
                            <span>INSUFFICIENT DATA ({item.sample_size}/10)</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/30 font-bold font-mono">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{item.composite.score}</span>
                          </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEmployee(item.agent_id);
                          }}
                          className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
