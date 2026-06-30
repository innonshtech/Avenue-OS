import type { TeamMember, UserRole } from "../types/user";

export const USER_ROLES: UserRole[] = [
  "ADMIN",
  "PROJECT_MANAGER",
  "PRINCIPAL_ENGINEER",
  "ENGINEER",
  "DRAFTSMAN",
  "ARCHITECT",
  "CLIENT"
];

export const DEPARTMENTS = [
  "Project Management",
  "Engineering",
  "Drafting",
  "Architecture",
  "Client Relations"
];

export const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: "bg-rose-500/10 text-rose-600 border-rose-200 dark:text-rose-400 dark:border-rose-800",
  PROJECT_MANAGER: "bg-indigo-500/10 text-indigo-600 border-indigo-200 dark:text-indigo-400 dark:border-indigo-800",
  PRINCIPAL_ENGINEER: "bg-amber-500/10 text-amber-600 border-amber-200 dark:text-amber-400 dark:border-amber-800",
  ENGINEER: "bg-blue-500/10 text-blue-600 border-blue-200 dark:text-blue-400 dark:border-blue-800",
  DRAFTSMAN: "bg-teal-500/10 text-teal-600 border-teal-200 dark:text-teal-400 dark:border-teal-800",
  ARCHITECT: "bg-purple-500/10 text-purple-600 border-purple-200 dark:text-purple-400 dark:border-purple-800",
  CLIENT: "bg-slate-500/10 text-slate-600 border-slate-200 dark:text-slate-400 dark:border-slate-800",
};

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: "5a67a900-345d-4159-8547-032139b01e5d",
    name: "Sushil",
    email: "sushil@avenue.com",
    password: "sushil123",
    role: "PROJECT_MANAGER",
    department: "Project Management",
    status: "ONLINE",
    avatar: "https://i.pravatar.cc/150?u=sushil",
    color: "indigo",
  },
  {
    id: "526bbc44-08f1-452c-a889-8a2dcd4b31da",
    name: "Sagar",
    email: "sagar@avenue.com",
    password: "sagar123",
    role: "ENGINEER",
    department: "Engineering",
    status: "ONLINE",
    avatar: "https://i.pravatar.cc/150?u=sagar",
    color: "blue",
  }
];
