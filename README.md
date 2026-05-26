# Innonsh SprintOS

An enterprise-grade internal product management system combining features of Jira, Azure DevOps, and Agile Management platforms.

## Overview
Innonsh SprintOS is a comprehensive platform for:
- Sprint Planning
- Task Assignments
- Daily Standups
- Developer Accountability
- Blockers & Impediments Tracking
- Sprint Retrospectives
- Team Analytics

## Tech StackYou are a senior full-stack software architect and enterprise SaaS engineer.

Your task is to setup a COMPLETE production-ready project boilerplate for a modern enterprise internal product management system named:

"Innonsh SprintOS"

The product is a hybrid of:
- Atlassian Jira
- Azure DevOps Boards
- Sprint Planning Systems
- Team Accountability Systems
- Agile Management Platforms

The system will be used internally inside a software company to manage:
- Sprint planning
- Task assignments
- Daily standups
- Developer accountability
- Blockers
- Feedback systems
- Sprint retrospectives
- Analytics
- Team productivity

====================================================
TECH STACK
====================================================

Frontend:
- React
- TypeScript
- Vite
- TailwindCSS
- shadcn/ui
- React Router DOM
- Zustand
- React Query
- Axios
- Framer Motion
- React Hook Form
- Zod
- TanStack Table
- DND Kit (for Kanban drag-drop)
- Lucide React

Backend:
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- bcrypt
- multer
- socket.io
- cors
- dotenv
- helmet
- morgan

Database:
- Supabase PostgreSQL

Deployment:
- Frontend -> Vercel
- Backend -> Render

====================================================
IMPORTANT REQUIREMENTS
====================================================

The setup must be:
- Enterprise grade
- Scalable
- Clean architecture
- Modular
- Production ready
- Fully typed
- Reusable
- Maintainable

Generate:
- Full folder structure
- Package installation commands
- Config files
- Boilerplate files
- Environment setup
- Prisma schema
- Initial database models
- Routing architecture
- API structure
- State management setup
- Reusable UI system
- Theme system
- Landing page UI
- Authentication skeleton
- Dashboard layout skeleton

DO NOT SKIP ANY FILE.

====================================================
PROJECT STRUCTURE
====================================================

Create a monorepo structure:

innonsh-sprintos/
│
├── frontend/
├── backend/
├── docs/
├── docker/
├── .github/
├── README.md

====================================================
FRONTEND REQUIREMENTS
====================================================

Setup frontend with:

- Vite + React + TypeScript
- TailwindCSS
- shadcn/ui
- Clean folder structure
- Absolute imports
- Protected routes
- Public routes
- Dark/light mode
- Responsive design
- Enterprise dashboard layout
- Sidebar navigation
- Top navbar
- Toast system
- Loading states
- Error boundaries
- Global API client
- React Query provider
- Zustand auth store
- Axios interceptors

====================================================
FRONTEND FOLDER STRUCTURE
====================================================

frontend/src/
│
├── api/
├── assets/
├── components/
│   ├── common/
│   ├── forms/
│   ├── tables/
│   ├── modals/
│   ├── kanban/
│   ├── charts/
│   ├── layout/
│   └── ui/
│
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── projects/
│   ├── sprints/
│   ├── tasks/
│   ├── standups/
│   ├── feedbacks/
│   ├── analytics/
│   └── settings/
│
├── hooks/
├── layouts/
├── pages/
├── providers/
├── routes/
├── services/
├── store/
├── styles/
├── types/
├── utils/
├── constants/
└── lib/

====================================================
LANDING PAGE REQUIREMENTS
====================================================

Create a PREMIUM modern SaaS landing page for:

"Innonsh SprintOS"

Design style:
- Linear.app
- Jira
- Notion
- Vercel
- Azure DevOps
- Modern glassmorphism
- Enterprise SaaS

Landing page sections:
1. Hero Section
2. Trusted Team Section
3. Features Grid
4. Sprint Workflow Visualization
5. Kanban Preview
6. Daily Standup Section
7. Accountability Tracking Section
8. Analytics Dashboard Preview
9. Feedback Intelligence Section
10. CTA Section
11. Footer

Hero section content:
Headline:
"Manage Sprints, Teams & Accountability — All in One Workspace"

Subheadline:
"Innonsh SprintOS helps engineering teams manage projects, track blockers, improve sprint execution, and increase delivery transparency."

Primary CTA:
"Get Started"

Secondary CTA:
"View Demo"

Features:
- Sprint Planning
- Agile Boards
- Task Assignment
- Daily Standups
- Feedback Intelligence
- Team Analytics
- Sprint Reports
- Developer Accountability

Use:
- Framer Motion animations
- Smooth hover effects
- Gradient backgrounds
- Dark theme
- Responsive design
- Modern typography
- Reusable components

====================================================
BACKEND REQUIREMENTS
====================================================

Setup backend with:

- Express.js + TypeScript
- Prisma ORM
- PostgreSQL
- MVC architecture
- Modular route structure
- JWT auth
- Role based access control
- Validation middleware
- Error handling middleware
- Logger setup
- Socket.io setup
- API versioning
- Swagger setup
- Rate limiting
- Security middlewares

====================================================
BACKEND FOLDER STRUCTURE
====================================================

backend/src/
│
├── config/
├── controllers/
├── routes/
├── middleware/
├── services/
├── repositories/
├── validations/
├── sockets/
├── prisma/
├── utils/
├── jobs/
├── constants/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── projects/
│   ├── sprints/
│   ├── tasks/
│   ├── standups/
│   ├── feedbacks/
│   ├── analytics/
│   └── notifications/
│
├── app.ts
└── server.ts

====================================================
PRISMA SCHEMA REQUIREMENTS
====================================================

Create COMPLETE Prisma schema models for:

1. User
2. Team
3. Department
4. Project
5. Sprint
6. Task
7. TaskComment
8. TaskActivity
9. DailyStandup
10. Blocker
11. SprintFeedback
12. RetrospectiveComparison
13. Notification
14. Attachment
15. AuditLog

Include:
- Proper relations
- UUID ids
- createdAt
- updatedAt
- enums
- indexes
- cascading deletes
- soft delete support

====================================================
ENUMS REQUIRED
====================================================

Create enums for:

- UserRole
- TaskPriority
- TaskStatus
- SprintStatus
- NotificationType
- ProjectStatus

====================================================
AUTH SYSTEM REQUIREMENTS
====================================================

Implement authentication skeleton:
- Login
- Register
- JWT access token
- Refresh token
- Protected middleware
- RBAC middleware
- Password hashing

====================================================
DATABASE REQUIREMENTS
====================================================

Use:
- PostgreSQL
- Prisma ORM
- Supabase database

Generate:
- schema.prisma
- seed.ts
- migration setup

====================================================
API STRUCTURE
====================================================

Generate REST APIs:

/api/v1/auth
/api/v1/users
/api/v1/projects
/api/v1/sprints
/api/v1/tasks
/api/v1/standups
/api/v1/feedbacks
/api/v1/analytics

====================================================
DASHBOARD REQUIREMENTS
====================================================

Create dashboard layout:
- Sidebar
- Navbar
- Breadcrumbs
- Workspace switcher
- Notifications dropdown
- User profile dropdown
- Theme switcher

Sidebar items:
- Dashboard
- Projects
- Sprints
- Tasks
- Boards
- Standups
- Analytics
- Reports
- Feedbacks
- Settings

====================================================
DESIGN SYSTEM
====================================================

Use:
- TailwindCSS
- CSS variables
- Design tokens
- Reusable components
- Consistent spacing
- Consistent shadows
- Enterprise UI patterns

Theme:
- Dark primary theme
- Professional enterprise colors
- Blue/purple gradients
- Minimalistic

====================================================
DEVOPS REQUIREMENTS
====================================================

Generate:
- Docker setup
- docker-compose.yml
- .env.example
- ESLint
- Prettier
- Husky
- lint-staged
- GitHub Actions CI/CD
- README.md

====================================================
OUTPUT FORMAT
====================================================

Generate:
1. Full project folder structure
2. All setup commands
3. All installation commands
4. All config files
5. Prisma schema
6. Initial backend setup
7. Initial frontend setup
8. Landing page implementation
9. Dashboard shell
10. Environment variables
11. Database setup
12. Scripts
13. Boilerplate code
14. Best practices

The output must be:
- Extremely detailed
- Production ready
- Enterprise grade
- Clean code
- Fully scalable
- Modern architecture

DO NOT GIVE EXPLANATIONS ONLY.

GENERATE REAL FILES, REAL CODE, REAL CONFIGS, REAL STRUCTURE.
- **Frontend**: React, TypeScript, Vite, TailwindCSS, shadcn/ui, Zustand, React Query
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL
- **Infrastructure**: Docker, GitHub Actions

## Project Structure
- `/frontend` - React SPA
- `/backend` - Express REST API
- `/docker` - Docker configurations
- `/docs` - Project documentation

## Getting Started

### Prerequisites
- Node.js (v18+)
- Docker & Docker Compose
- PostgreSQL (if running locally without Docker)

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   - Copy `backend/.env.example` to `backend/.env`
   - Copy `frontend/.env.example` to `frontend/.env`

3. **Start with Docker (Recommended for DB)**
   ```bash
   docker-compose up -d db
   ```

4. **Start Development Servers**
   ```bash
   npm run dev
   ```

## License
Proprietary
