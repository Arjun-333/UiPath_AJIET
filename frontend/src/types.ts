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

