import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, DollarSign, Clock, CheckCircle2, 
  TrendingUp, Activity, Layers, ArrowUpRight, ArrowDownRight,
  Shield, Sparkles, Filter
} from 'lucide-react';
import { DepartmentBreakdownResponse, DepartmentSummaryMetric } from '../../types';

export const DepartmentAnalytics: React.FC = () => {
  const [periodDays, setPeriodDays] = useState<number>(30);
  const [data, setData] = useState<Record<string, DepartmentSummaryMetric>>({});
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBreakdown = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/workforce/analytics/department-breakdown?period_days=${periodDays}`);
      if (res.ok) {
        const json: DepartmentBreakdownResponse = await res.json();
        setData(json.departments || {});
      }
    } catch (err) {
      console.error('Failed to load department breakdown', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBreakdown();
  }, [periodDays]);

  const departments = Object.keys(data);
  const totalHeadcount = Object.values(data).reduce((acc, d) => acc + d.headcount, 0);
  const totalTasks = Object.values(data).reduce((acc, d) => acc + d.total_tasks, 0);
  const totalCost = Object.values(data).reduce((acc, d) => acc + d.total_cost_usd, 0);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-slate-100 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <span>Department Workforce Analytics</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                NORMALIZED COMPARISON
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Department-level throughput, unit costs, workload distribution, and execution reliability.
            </p>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {[7, 14, 30, 90].map(days => (
            <button
              key={days}
              onClick={() => setPeriodDays(days)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all ${
                periodDays === days
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* Aggregate Overview Strip */}
      <div className="grid grid-cols-4 gap-4 mb-6 shrink-0">
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 mb-1">
            <Users className="w-4 h-4 text-orange-400" />
            <span>TOTAL ACTIVE STAFF</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">{totalHeadcount}</div>
          <div className="text-[11px] text-slate-500 mt-1">Across 4 physical campus floors</div>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 mb-1">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>TOTAL TASKS IN WINDOW</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">{totalTasks}</div>
          <div className="text-[11px] text-slate-500 mt-1">Telemetry-tracked executions</div>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 mb-1">
            <DollarSign className="w-4 h-4 text-cyan-400" />
            <span>TOTAL INFERENCE COST</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">${totalCost.toFixed(4)}</div>
          <div className="text-[11px] text-slate-500 mt-1">Token pricing across all models</div>
        </div>

        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-400 mb-1">
            <Layers className="w-4 h-4 text-purple-400" />
            <span>AVG UNIT TASK COST</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${totalTasks > 0 ? (totalCost / totalTasks).toFixed(4) : '0.0000'}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Per completed workflow run</div>
        </div>
      </div>

      {/* Department Cards Grid */}
      {loading ? (
        <div className="p-12 text-center text-xs font-mono text-slate-500">
          Calculating normalized departmental performance metrics...
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {departments.map(dept => {
            const m = data[dept];
            const workloadShare = totalTasks > 0 ? (m.total_tasks / totalTasks * 100) : 0;

            return (
              <div key={dept} className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-white">{dept}</h3>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {m.headcount} active agents • {m.total_tasks} tasks ({workloadShare.toFixed(1)}% of total company volume)
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
                    m.completion_rate >= 90 
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}>
                    {m.completion_rate.toFixed(1)}% SUCCESS
                  </span>
                </div>

                {/* Progress bar for workload share */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                    <span>Workload Distribution</span>
                    <span className="font-mono">{workloadShare.toFixed(1)}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-500 rounded-full" 
                      style={{ width: `${Math.min(100, workloadShare)}%` }}
                    />
                  </div>
                </div>

                {/* Metric breakdown row */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block">AVG DURATION</span>
                    <span className="text-slate-200 font-bold">{m.average_duration_seconds.toFixed(1)}s</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">TOTAL DEPT COST</span>
                    <span className="text-slate-200 font-bold">${m.total_cost_usd.toFixed(4)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">COST / TASK</span>
                    <span className="text-slate-200 font-bold">${m.average_cost_usd.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
