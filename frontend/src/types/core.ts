export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';
export type SprintStatus = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELED';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'BLOCKED' | 'TESTING' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | 'CRITICAL';
export type BlockerSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type BlockerType = 'TECHNICAL' | 'REQUIREMENT' | 'DEPENDENCY' | 'INFRASTRUCTURE' | 'COMMUNICATION' | 'TESTING';

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
}

export interface Sprint {
  id: string;
  name: string;
  goal: string | null;
  startDate: string;
  endDate: string;
  status: SprintStatus;
  projectId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  key: string;
  title: string;
  description: string | null;
  type: string; // STORY, BUG, TASK, EPIC
  status: TaskStatus;
  priority: TaskPriority;
  storyPoints: number | null;
  projectId: string;
  sprintId: string | null;
  assigneeId: string | null;
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Blocker {
  id: string;
  description: string;
  isResolved: boolean;
  severity: BlockerSeverity;
  type: BlockerType;
  estimatedResolutionDate: string | null;
  helperId: string | null;
  taskId: string;
  reporterId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyStandup {
  id: string;
  date: string;
  yesterday: string;
  today: string;
  blockers: string | null;
  userId: string;
  sprintId: string;
  createdAt: string;
  sprint?: Sprint & { project?: Project };
  task?: Task;
  reportedBlockers?: Blocker[];
}
