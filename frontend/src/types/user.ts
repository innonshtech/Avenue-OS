export type UserRole = 
  | "ADMIN"
  | "PROJECT_MANAGER"
  | "PRINCIPAL_ENGINEER"
  | "ENGINEER"
  | "DRAFTSMAN"
  | "ARCHITECT"
  | "CLIENT";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  department: string;
  avatar?: string;
  status?: "ONLINE" | "OFFLINE";
  color?: string;
}
