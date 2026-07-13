export type UserRole = string;

export type FeatureFlag = 
  | 'CREATE_PROJECT'
  | 'EDIT_PROJECT'
  | 'DELETE_PROJECT'
  | 'CREATE_TASK'
  | 'ASSIGN_TASK'
  | 'DELETE_TASK'
  | 'RESOLVE_RFI'
  | 'MANAGE_USERS'
  // Sidebar View Permissions
  | 'VIEW_PROJECTS'
  | 'VIEW_TARGETS'
  | 'VIEW_TARGET_REPORTS'
  | 'VIEW_ALL_TASKS'
  | 'VIEW_MY_TASKS'
  | 'VIEW_BOARDS'
  | 'VIEW_CHAT'
  | 'VIEW_PROGRESS_REPORTS'
  | 'VIEW_TIMESHEETS'
  | 'VIEW_ANALYTICS'
  | 'VIEW_REPORTS'
  | 'VIEW_AUDIT_LOG'
  | 'VIEW_FEEDBACKS'
  | 'VIEW_TEAM'
  | 'VIEW_CALENDAR'
  | 'VIEW_ACTIVITY_LOG'
  | 'VIEW_SETTINGS';

export interface SystemRole {
  name: string;
  description?: string;
  permissions: FeatureFlag[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  permissions?: FeatureFlag[];
  avatar?: string;
  status?: "ONLINE" | "OFFLINE";
  color?: string;
}
