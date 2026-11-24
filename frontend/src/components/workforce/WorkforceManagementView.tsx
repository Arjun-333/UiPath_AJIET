import React, { useState } from 'react';
import { TalentDashboard } from './TalentDashboard';
import { DepartmentAnalytics } from './DepartmentAnalytics';
import { WorkforceAdvisorPanel } from './WorkforceAdvisorPanel';
import { RecruitmentCentre } from './RecruitmentCentre';
import { AuditLogViewer } from './AuditLogViewer';
import { AgentProfileModal } from './AgentProfileModal';
import { Award, Building2, Sparkles, UserPlus, Shield, Users } from 'lucide-react';
import { WorkforceOrganizationalFinding } from '../../types';

export const WorkforceManagementView: React.FC = () => {
  const [subTab, setSubTab] = useState<'leaderboard' | 'departments' | 'advisor' | 'recruitment' | 'audit'>('leaderboard');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [recruitmentPrefill, setRecruitmentPrefill] = useState<{
    finding?: WorkforceOrganizationalFinding;
  } | null>(null);

  const handleOpenRecruitmentFromFinding = (finding: WorkforceOrganizationalFinding) => {
    setRecruitmentPrefill({ finding });
    setSubTab('recruitment');
  };

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Sub Navigation Bar */}
      <div className="flex items-center justify-between bg-slate-950 p-2 rounded-2xl border border-slate-800 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-orange-600/10 border border-orange-500/20 rounded-xl mr-2">
            <Users className="w-4 h-4 text-orange-400" />
            <span className="text-xs font-bold text-orange-400 uppercase tracking-wide">Workforce Intelligence</span>
          </div>

          <button
            onClick={() => setSubTab('leaderboard')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'leaderboard'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Talent Leaderboard</span>
          </button>

          <button
            onClick={() => setSubTab('departments')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'departments'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Department Analytics</span>
          </button>

          <button
            onClick={() => setSubTab('advisor')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'advisor'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Advisor & Findings</span>
          </button>

          <button
            onClick={() => {
              setRecruitmentPrefill(null);
              setSubTab('recruitment');
            }}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'recruitment'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Recruitment Centre</span>
          </button>

          <button
            onClick={() => setSubTab('audit')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              subTab === 'audit'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Audit Trail</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-400">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>CEO ARJUN AUTHORIZED</span>
        </div>
      </div>

      {/* Main View Area */}
      <div className="flex-1 overflow-hidden">
        {subTab === 'leaderboard' && (
          <TalentDashboard
            onSelectEmployee={setSelectedAgentId}
            onOpenRecruitment={() => setSubTab('recruitment')}
            onOpenAdvisor={() => setSubTab('advisor')}
            onOpenAuditLogs={() => setSubTab('audit')}
          />
        )}

        {subTab === 'departments' && <DepartmentAnalytics />}

        {subTab === 'advisor' && (
          <WorkforceAdvisorPanel
            onOpenRecruitmentWithFinding={handleOpenRecruitmentFromFinding}
          />
        )}

        {subTab === 'recruitment' && (
          <RecruitmentCentre
            prefillDepartment={recruitmentPrefill?.finding?.department}
            prefillTitle={recruitmentPrefill?.finding ? `AI Specialist (${recruitmentPrefill.finding.department})` : undefined}
            findingId={recruitmentPrefill?.finding?.id}
          />
        )}

        {subTab === 'audit' && <AuditLogViewer />}
      </div>

      {/* Agent Dossier Modal */}
      {selectedAgentId && (
        <AgentProfileModal
          agentId={selectedAgentId}
          onClose={() => setSelectedAgentId(null)}
          onRefresh={() => {}}
        />
      )}
    </div>
  );
};
