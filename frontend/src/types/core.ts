export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type StageStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED';
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
  stages?: Stage[];
  tasks?: Task[];
}

export interface Stage {
  id: string;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  status: StageStatus;
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
  type: string; // DESIGN, DRAFTING, MODELING, ANALYSIS, SITE_CHECK, REVIEW
  status: TaskStatus;
  priority: TaskPriority;
  storyPoints: number | null;
  drawingNumber: string | null;
  revisionNumber: string | null;
  projectId: string;
  stageId: string | null;
  assigneeId: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;

  // Optional relations and extra fields returned by API
  project?: Project;
  stage?: Stage;
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
  stageId: string;
  createdAt: string;
  stage?: Stage & { project?: Project };
  task?: Task;
  reportedRFIs?: RFI[];
}
