export interface Agent {
  agent_id: string;
  name: string;
  department: string;
  role: string;
  floor: number;
  permission_level: number;
  manager_id: string;
  status: 'idle' | 'working' | 'reviewing' | 'waiting_approval' | 'error';
  current_task_id?: string;
  current_task_title?: string;
  completed_tasks_count: number;
  error_count: number;
  avatar_file: string;
  x?: number;
  y?: number;
}

export interface Task {
  id: string;
  title: string;
  department: string;
  assigned_agent_id: string;
  status: 'pending' | 'in_progress' | 'review' | 'completed' | 'failed';
  permission_level: number;
  output_data?: Record<string, any>;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  target_platform: string;
  created_at: string;
  tasks: Task[];
}

export interface Approval {
  id: string;
  task_id: string;
  action_type: string;
  description: string;
  preview_url?: string;
  status: 'pending' | 'approved' | 'rejected';
  ceo_feedback?: string;
  created_at: string;
}

export interface RosterSummary {
  total_agents: number;
  active_agents: number;
  idle_agents: number;
  error_agents: number;
  floors_count: number;
}

export interface AgentMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_floor: number;
  recipient_id: string;
  recipient_name: string;
  recipient_floor: number;
  message_type: 'task_brief' | 'handoff' | 'inquiry' | 'review_status' | 'general_chat' | 'cross_floor_visit';
  content: string;
  project_id?: string;
  created_at: string;
}

export interface AgentTransitEvent {
  agent_id: string;
  agent_name: string;
  from_floor: number;
  to_floor: number;
  target_agent_id?: string;
  purpose: string;
}

// Workforce Intelligence & Talent Management Interfaces
export interface WorkforceEmployee {
  agent_id: string;
  name: string;
  current_title: string;
  department: string;
  floor: number;
  current_config_version: number;
  lifecycle_state: 'candidate' | 'in_testing' | 'active' | 'in_retraining' | 'suspended' | 'terminated';
  hire_date?: string;
  avatar_file: string;
  shirt_color?: string;
  is_archived: boolean;
}

export interface WorkforceMetrics {
  completion_rate: number;
  quality_score: number;
  accuracy_score: number;
  execution_time_seconds: number;
  cost_per_task_usd: number;
  failure_rate: number;
  collaboration_score: number;
  approval_rate: number;
  approval_rate_label: string;
}

export interface LeaderboardItem {
  agent_id: string;
  name: string;
  title: string;
  department: string;
  floor: number;
  lifecycle_state: string;
  current_config_version: number;
  period_days: number;
  sample_size: number;
  min_sample_size: number;
  is_insufficient_data: boolean;
  insufficient_data_reason?: string;
  metrics: WorkforceMetrics;
  composite: {
    score: number | null;
    version: string;
    components: {
      completion_rate_contribution: number;
      quality_contribution: number;
      accuracy_contribution: number;
      efficiency_contribution: number;
      approval_contribution: number;
    };
  };
  activity_counts: {
    completed_tasks: number;
    failed_tasks: number;
    total_messages: number;
    handoff_messages: number;
    approvals_submitted: number;
    approvals_approved: number;
  };
}

export interface WorkforceRecommendation {
  id: string;
  rec_type: string;
  target_agent_id: string;
  department: string;
  title: string;
  reasoning: string;
  evidence: Record<string, any>;
  confidence_score: number;
  sample_size: number;
  data_window_days: number;
  status: 'pending' | 'accepted' | 'dismissed' | 'expired';
  created_at: string;
}

export interface WorkforceOrganizationalFinding {
  id: string;
  finding_type: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  department: string;
  title: string;
  description: string;
  suggested_action: string;
  evidence: Record<string, any>;
  confidence_score: number;
  status: 'active' | 'addressed' | 'dismissed';
  linked_draft_id?: string;
  created_at: string;
}

export interface WorkforceAuditLog {
  id: string;
  actor_principal: string;
  actor_role: string;
  action: string;
  target_agent_id: string;
  target_agent_name: string;
  before_state: Record<string, any>;
  after_state: Record<string, any>;
  reason: string;
  linked_approval_id: string;
  correlation_id: string;
  timestamp: string;
}

export interface DepartmentSummaryMetric {
  headcount: number;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  completion_rate: number;
  average_duration_seconds: number;
  total_cost_usd: number;
  average_cost_usd: number;
}

export interface DepartmentBreakdownResponse {
  period_days: number;
  departments: Record<string, DepartmentSummaryMetric>;
}

export interface CandidateCreateForm {
  name: string;
  department: string;
  target_role: string;
  title: string;
  floor: number;
  model_name: string;
  system_instructions: string;
  tools_whitelist: string[];
  responsibilities: string[];
  shirt_color: string;
  suggested_by_finding_id?: string;
}

export interface CandidateTestItem {
  id: string;
  test_type: string;
  score: number;
  status: 'pending' | 'passed' | 'failed';
  feedback: string;
  duration_seconds: number;
}

export interface CandidateRecord {
  candidate_id: string;
  name: string;
  lifecycle_state: string;
  department: string;
  test_task_ids: string[];
  status: string;
}


