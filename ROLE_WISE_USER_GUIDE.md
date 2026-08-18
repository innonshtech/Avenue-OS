# Avenue-OS: Role-Wise System User Guide

Welcome to the client-facing **Avenue-OS Role-Wise System User Guide**. This guide provides an overview of all user roles implemented in the system, detailing their permissions, accessible screens, key workflows, and detailed user journeys.

---

## 1. Summary of Roles & Core Responsibilities

The system enforces Role-Based Access Control (RBAC) by mapping system roles to a set of granular permission flags. These flags determine which screens are visible in the sidebar navigation and what actions can be executed.

| Role | Core Responsibility | Dashboard Layout | Primary Action Permissions |
| :--- | :--- | :--- | :--- |
| **ADMIN** | Full system administration and permission overrides. | Management Command Center | All Actions (Project, Task, RFI, Users, settings overrides) |
| **DIRECTOR** | Strategic business oversight and operational monitoring. | Management Command Center | All Actions (Project, Task, RFI, Users) |
| **ASSOCIATE_DIRECTOR** | High-level management and project definition. | Management Command Center | Create/Edit Projects, Create/Assign Tasks, Resolve RFIs |
| **PROJECT_MANAGER** | Operational sprint tracking, task coordination, and timesheet reviews. | Management Command Center | Project CRUD, Task CRUD, Resolve RFIs, Sprint/Target management |
| **LEAD_ENGINEER** | Technical team coordination, task allocation, and RFI resolution. | Member Dashboard | Create/Assign Tasks, Resolve RFIs |
| **DESIGN_ENGINEER** | Design planning, task creation, and technical execution. | Member Dashboard | Create Tasks, Resolve RFIs |
| **ENGINEER** | Task execution, daily progress updates, and timesheet logging. | Member Dashboard | Task updates, timesheet logs (no management actions) |
| **JR_DRAFTSMAN** | Drafting task execution, standups, and hours logging. | Member Dashboard | Task updates, timesheet logs (no management actions) |
| **INTERN** | Engineering support and daily task updates. | Member Dashboard | Task updates, timesheet logs (no management actions) |

---

## 2. Dashboard Layout Configurations

Depending on permissions, users automatically view one of two layouts on the dashboard (**Command Center**):

### A. Management Command Center (ADMIN, DIRECTOR, ASSOCIATE_DIRECTOR, PROJECT_MANAGER)
*   **KPI Tiles**: Quick counts of Active Projects, Active Tasks, Active Blockers, and Weekly Man-Hours.
*   **Target/Sprint Selector**: Dropdown to inspect metrics of a specific active or past Sprint Target.
*   **Sprint Health Panel**: A visual burndown chart, progress percentage bar, and remaining days.
*   **Team Workload Panel**: Breakdown of active task count and story points per team member to prevent overallocation.
*   **Sprint Board Snapshot**: Frequencies of tasks in Backlog, Todo, In Progress, In Review, and Done states.
*   **Team Standup Monitoring**: Real-time status list of team members showing who has submitted today's standup or reported a blocker.
*   **Organization Activity Feed**: A live feed of all recent events (task completion, comments, file uploads).

### B. Member Dashboard (LEAD_ENGINEER, DESIGN_ENGINEER, ENGINEER, JR_DRAFTSMAN, INTERN)
*   **Overview Cards**: Shows personal counts of Tasks Pending, Assigned for Review, Submitted Daily Reports, and Weekly Hours Logged.
*   **My Work Today**: Shows the current user's target focus and tasks scheduled for today.
*   **Mini Sprint Board**: Compact Kanban layout showing the user's own assigned tasks.
*   **Member Activity Feed**: A personalized feed of updates directly relating to the user's tasks.

---

## 3. Detailed Role Workflows & Journeys

---

### 👤 ADMIN
The **Admin** is the ultimate controller of Avenue-OS. They manage organizational structure, user roles, security, and override configurations.

*   **Can Access**: All sidebar modules including Projects, Targets, Target Reports, All Tasks, Kanban Boards, Chat, Progress Reports, Timesheets, Activity Logs, Analytics, Reports, Audit Logs, Feedbacks, Team Management, Calendar, and Settings.
*   **Can Perform**: All project and task operations (create, edit, delete, assign), resolve RFIs, manage users, modify database role permissions (excluding ADMIN permissions), terminate user sessions, and hard delete custom roles.
*   **Cannot Access**: No restrictions.
*   **Step-by-Step Workflow**:
    1.  Log in to Avenue-OS.
    2.  Review overall sprint KPIs, standups, and blockers in the Command Center.
    3.  Access **Settings → Roles & Permissions** to customize permissions or create new roles.
    4.  Navigate to **Team Management** to invite new users or assign them to projects/sprints.
    5.  Verify security metrics and manage active user sessions in the security panel.
    6.  Review full organization **Audit Logs** for security compliance.

> **User Journey**:
> **Admin → Login → Command Center → Manage Users & Roles → Configure Security Settings → Audit Logs → System Overrides**

---

### 👤 DIRECTOR
The **Director** monitors staff efficiency, operational output, and high-level project progress to guide company strategy.

*   **Can Access**: All sidebar modules (Projects, Targets, Reports, Analytics, Audit Logs, Team Management, Settings, etc.).
*   **Can Perform**: Project creation/management, user creation/management, task creation/assignment/deletion, and RFI resolution.
*   **Cannot Access**: Cannot edit the ADMIN role's permissions or manage sessions of administrators.
*   **Step-by-Step Workflow**:
    1.  Log in and check high-level operational statistics on the Command Center.
    2.  Go to **Analytics** to view company-wide productivity trends, velocity, and average completion times.
    3.  Go to **Reports** to download Sprint, Team, or Project reports.
    4.  Review **Team Management** and staff workload allocations.
    5.  Navigate to **Audit Logs** to view historical operational logs.

> **User Journey**:
> **Director → Login → Command Center → Review Reports & Analytics → Monitor Staff Workload → Assess Sprint Health → Coordinate with PMs**

---

### 👤 ASSOCIATE_DIRECTOR
The **Associate Director** focuses on task scheduling, project definition, and aligning team coordination.

*   **Can Access**: Projects, Targets, Target Reports, All Tasks, Kanban Boards, Chat, Progress Reports, Timesheets, Activity Logs, Analytics, Reports, Feedbacks, Team Directory, Calendar, and Settings.
*   **Can Perform**: Create/edit projects, define targets/sprints, create/assign tasks, and resolve RFIs.
*   **Cannot Access / Perform**:
    *   Cannot delete projects (`DELETE_PROJECT`).
    *   Cannot delete tasks (`DELETE_TASK`).
    *   Cannot manage users or edit roles (`MANAGE_USERS`).
    *   Cannot view the organization's backend Audit Logs (`VIEW_AUDIT_LOG`).
*   **Step-by-Step Workflow**:
    1.  Log in and check the Command Center dashboard.
    2.  Go to **Projects** to set up a new project or update details of active ones.
    3.  Navigate to **Targets** to create milestones (Sprints) for projects.
    4.  Navigate to **Tasks** or **Boards** to schedule work, assign tasks to leads, and set deadlines.
    5.  Collaborate in the **Chat** tool (creating project channels or answering direct queries).
    6.  Review team progress reports and analytics.

> **User Journey**:
> **Associate Director → Login → Command Center → Manage Projects & Targets → Define Tasks & Assignments → Review Team Progress Reports → Chat Collaboration**

---

### 👤 PROJECT_MANAGER
The **Project Manager (PM)** is the primary operational administrator. They drive sprint delivery, manage task cards, resolve blockers, and review timesheets.

*   **Can Access**: Projects, Targets, Target Reports, All Tasks, My Tasks, Kanban Boards, Chat, Progress Reports, Timesheets, Activity Logs, Analytics, Reports, Feedbacks, Team Management, and Calendar.
*   **Can Perform**: Create, edit, and delete projects; manage target sprints; create, assign, and delete tasks; resolve blocker RFIs.
*   **Cannot Access / Perform**:
    *   Cannot manage users, add/remove members, or modify roles (`MANAGE_USERS` is disabled).
    *   Cannot access the **Settings** panel (`VIEW_SETTINGS` is disabled).
    *   Cannot view the system **Audit Logs** (`VIEW_AUDIT_LOG` is disabled).
*   **Step-by-Step Workflow**:
    1.  Log in to check the Command Center KPIs, standups, and blockers.
    2.  Review **Team Standup Monitoring** to see who submitted updates.
    3.  Open the **Tasks** or **Boards** screen to track sprint board cards and shift cards from *In Review* to *Done*.
    4.  Identify blockers/RFIs on task cards, assign helpers, and resolve resolved RFIs with notes.
    5.  Go to **Timesheets** to review all logged hours for the team (PMs see *all* logs).
    6.  Create announcement channels in **Chat** to coordinate project delivery.

> **User Journey**:
> **Project Manager → Login → Command Center → Review Daily Standups & Blockers → Manage Sprint Tasks → Resolve RFIs → Verify Team Timesheets**

---

### 👤 LEAD_ENGINEER
The **Lead Engineer** bridges management and execution. They coordinate engineering assignments, create technical tasks, and resolve technical RFIs.

*   **Can Access**: Projects directory, My Tasks, Kanban Boards, Chat, Progress Reports, Timesheets, Activity Log, Feedbacks, Team Management, Calendar, and Settings.
*   **Can Perform**: Create tasks, assign tasks to others, and resolve RFIs.
*   **Cannot Access / Perform**:
    *   Cannot create, edit, or delete projects/targets.
    *   Cannot delete tasks (`DELETE_TASK`).
    *   Cannot manage user accounts/permissions.
    *   Cannot view high-level analytics, target reports, org-wide reports, or audit logs.
    *   Cannot view other members' timesheets (only see their own and the Project Manager's timesheets).
*   **Step-by-Step Workflow**:
    1.  Log in and view personal overview and today's schedule on the Member Dashboard.
    2.  Navigate to **Kanban Boards** to check task distribution.
    3.  Create engineering sub-tasks and assign them to engineers, draftsmen, or interns.
    4.  Navigate to **Progress Reports** to submit their daily standup update.
    5.  Review RFIs raised by team members and resolve them by posting technical notes.
    6.  Log hours in **Timesheets** for the tasks they worked on.

> **User Journey**:
> **Lead Engineer → Login → Member Dashboard → Coordinate Tasks on Kanban Board → Assign Engineering Cards → Resolve Team RFIs → Submit Standup & Timesheet**

---

### 👤 DESIGN_ENGINEER
The **Design Engineer** plans and designs technical details, creates design tasks, and helps resolve design RFIs.

*   **Can Access**: Target Reports, My Tasks, Kanban Boards, Chat, Progress Reports, Timesheets, Activity Log, Feedbacks, Team Management, Calendar, and Settings.
*   **Can Perform**: Task creation (`CREATE_TASK`), and RFI resolution (`RESOLVE_RFI`).
*   **Cannot Access / Perform**:
    *   Cannot manage, assign, or reassign tasks to others (`ASSIGN_TASK` is disabled). Can only assign tasks to themselves or leave them unassigned.
    *   Cannot edit project details or targets.
    *   Cannot delete tasks.
    *   Cannot view the Projects Directory.
*   **Step-by-Step Workflow**:
    1.  Log in to view pending design tasks and today's focus.
    2.  Navigate to **Kanban Boards** to pick up cards from the backlog.
    3.  Create draft task cards for drawings or models that need to be made.
    4.  Update card status to *In Progress* and then *Internal Review*.
    5.  Submit a daily standup stating yesterday's achievements and today's design plans.
    6.  Log daily design hours in the **Timesheets** portal.

> **User Journey**:
> **Design Engineer → Login → Member Dashboard → Claim Backlog Tasks → Execute Design Work → Submit Daily Standup → Log Design Hours**

---

### 👤 ENGINEER / JR_DRAFTSMAN / INTERN
These roles focus on execution, moving task cards, submitting daily progress reports, raising RFIs when stuck, and logging timesheets.

*   **Can Access**: My Tasks, Kanban Boards, Chat, Progress Reports, Timesheets, Activity Log, Team Directory, and Calendar (Jr. Draftsman and Intern also have access to Feedbacks and Settings).
*   **Can Perform**: Update task details, add subtasks, upload attachments, write comments, raise RFIs/blockers, submit daily progress reports, and log timesheets.
*   **Cannot Access / Perform**:
    *   Cannot create new tasks or assign/reassign tasks.
    *   Cannot delete tasks or resolve RFIs.
    *   Cannot edit or delete other users' comments.
    *   Cannot access Projects, Targets, Target Reports, Analytics, Reports, or Audit Logs.
    *   Cannot create channels in chat or post in Announcement channels (restricted to authorized roles and email addresses).
*   **Step-by-Step Workflow**:
    1.  Log in to view assigned tasks on the Member Dashboard.
    2.  Navigate to **My Tasks** or **Kanban Boards** to view detailed instructions, checklists, and attachments.
    3.  Update the task card status (e.g., drag from *Todo* to *In Progress*).
    4.  If blocked (e.g., waiting for architectural details), open the task, click **Raise RFI**, select the blocker type, type a description, and select a helper.
    5.  Submit the daily progress report detailing today's accomplishments.
    6.  Log actual hours in **Timesheets** before logging out.

> **User Journey**:
> **Engineer → Login → Member Dashboard → Open Kanban Board → Update Task Status → Raise Blocker RFI (if stuck) → Submit Standup Update → Log Timesheet**

