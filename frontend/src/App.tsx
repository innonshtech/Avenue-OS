import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import LandingPage from './pages/LandingPage';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import SignInPage from './features/auth/pages/SignInPage';
import ProtectedRoute from './components/ProtectedRoute';

// New Feature Pages
import ProjectListPage from './features/projects/pages/ProjectListPage';
import ProjectDetailsPage from './features/projects/pages/ProjectDetailsPage';
import SprintListPage from './features/sprints/pages/SprintListPage';
import SprintDetailsPage from './features/sprints/pages/SprintDetailsPage';
import TaskListPage from './features/tasks/pages/TaskListPage';
import KanbanBoardPage from './features/boards/pages/KanbanBoardPage';
import StandupPage from './features/standups/pages/StandupPage';
import AnalyticsDashboardPage from './features/analytics/pages/AnalyticsDashboardPage';
import ReportsPage from './features/reports/pages/ReportsPage';
import FeedbacksPage from './features/feedbacks/pages/FeedbacksPage';
import TeamManagementPage from './features/team/pages/TeamManagementPage';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import SprintReportsPage from './features/member/sprint-reports/pages/SprintReportsPage';
import AdminDashboard from './features/admin/pages/AdminDashboard';
import MyActivityLogPage from './features/activity/pages/MyActivityLogPage';
import OrganizationAuditLogPage from './features/activity/pages/OrganizationAuditLogPage';
import SettingsPage from './features/settings/pages/SettingsPage';

import { Toaster } from '@/components/ui/toaster';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/signin" element={<SignInPage />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
              
              <Route path="projects" element={<ProjectListPage />} />
              <Route path="projects/:id" element={<ProjectDetailsPage />} />
              
              <Route path="sprints" element={<SprintListPage />} />
              <Route path="sprints/:id" element={<SprintDetailsPage />} />
              
              <Route path="tasks" element={<TaskListPage />} />
              {/* Marketing and Dev aliases pointing to same task view for simplicity, 
                  access filtered internally in TaskListPage */}
              <Route path="my-tasks" element={<TaskListPage />} />
              <Route path="campaign-tasks" element={<TaskListPage />} />
              
              <Route path="boards" element={<KanbanBoardPage />} />
              
              <Route path="standups" element={<StandupPage />} />
              
              {/* Product Manager Only Routes */}
              <Route element={<RoleProtectedRoute allowedRoles={['PRODUCT_MANAGER']} />}>
                <Route path="analytics" element={<AnalyticsDashboardPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="team" element={<TeamManagementPage />} />
                <Route path="organization-audit" element={<OrganizationAuditLogPage />} />
              </Route>

              {/* Feedbacks - Accessible to all, but view is restricted inside component or by API */}
              <Route path="feedbacks" element={<FeedbacksPage />} />

              {/* Member-Only Routes */}
              <Route element={<RoleProtectedRoute allowedRoles={['DEVELOPER', 'MARKETING']} />}>
                <Route path="sprint-reports" element={<SprintReportsPage />} />
                <Route path="activity" element={<MyActivityLogPage />} />
              </Route>

              {/* Settings Route - Accessible to everyone in the dashboard */}
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            {/* Admin Route */}
            <Route element={<RoleProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
