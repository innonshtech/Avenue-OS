export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type TargetStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'INTERNAL_REVIEW' | 'EXTERNAL_REVIEW' | 'MODIFICATION_REQUIRED' | 'APPROVED' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';
export type RFISeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RFIType = 'ARCHITECTURAL_CLARIFICATION' | 'CLIENT_APPROVAL_PENDING' | 'SITE_DISCREPANCY' | 'RESOURCE_UNAVAILABLE';

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: string;
}

export interface Project {
  id: string;
  key: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  ownerId: string;
  members: ProjectMember[];
  createdAt: string;
  updatedAt: string;
  startDate?: string | null;
  deadline?: string | null;
  targets?: Target[];
  tasks?: Task[];
}

export interface Target {
  id: string;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  status: TargetStatus;
  budgetedHours?: number | null;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  project?: Project;
  tasks?: Task[];
}

export interface Task {
  id: string;
  key: string;
  title: string;
  description: string | null;
  taskCategory?: string | null;
  type: string; // DESIGN, DRAFTING, MODELING, ANALYSIS, SITE_CHECK, REVIEW
  status: TaskStatus;
  priority: TaskPriority;
  storyPoints: number | null;
  estimatedHours?: number | null;
  actualHours?: number | null;
  drawingNumber: string | null;
  revisionNumber: string | null;
  projectId: string;
  targetId: string | null;
  assigneeId: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;

  // Optional relations and extra fields returned by API
  project?: Project;
  target?: Target;
  assignee?: any;
  creator?: any;
  comments?: any[];
  activities?: any[];
  attachments?: any[];
  rfis?: RFI[];
  subtasks?: any[];
  progressReports?: ProgressReport[];
  isArchived?: boolean;
  archivedAt?: string | null;
  archivedById?: string | null;
  completedAt?: string | null;
  completedById?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  labels?: string[];
  acceptanceCriteria?: string | null;
}

export interface RFI {
  id: string;
  description: string;
  isResolved: boolean;
  severity: RFISeverity;
  type: RFIType;
  estimatedResolutionDate: string | null;
  helperId: string | null;
  taskId: string;
  reporterId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressReport {
  id: string;
  date: string;
  yesterday: string;
  today: string;
  blockers: string | null;
  userId: string;
  targetId: string;
  createdAt: string;
  target?: Target & { project?: Project };
  task?: Task;
  reportedRFIs?: RFI[];
}
