import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/DashboardPage';
import SignInPage from './features/auth/pages/SignInPage';
import ForgotPasswordPage from './features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from './features/auth/pages/ResetPasswordPage';
import ProtectedRoute from './components/ProtectedRoute';

// New Feature Pages
import ProjectListPage from './features/projects/pages/ProjectListPage';
import ProjectDetailsPage from './features/projects/pages/ProjectDetailsPage';
import TargetListPage from './features/targets/pages/TargetListPage';
import TargetDetailsPage from './features/targets/pages/TargetDetailsPage';
import TaskListPage from './features/tasks/pages/TaskListPage';
import KanbanBoardPage from './features/boards/pages/KanbanBoardPage';
import ProgressReportPage from './features/progress-reports/pages/ProgressReportPage';
import AnalyticsDashboardPage from './features/analytics/pages/AnalyticsDashboardPage';
import ReportsPage from './features/reports/pages/ReportsPage';
import FeedbacksPage from './features/feedbacks/pages/FeedbacksPage';
import TeamManagementPage from './features/team/pages/TeamManagementPage';
import RoleProtectedRoute from './components/RoleProtectedRoute';
import TargetReportsPage from './features/member/target-reports/pages/TargetReportsPage';
import AdminDashboard from './features/admin/pages/AdminDashboard';
import MyActivityLogPage from './features/activity/pages/MyActivityLogPage';
import OrganizationAuditLogPage from './features/activity/pages/OrganizationAuditLogPage';
import SettingsPage from './features/settings/pages/SettingsPage';
import CalendarPage from './pages/CalendarPage';
import ChatPage from './features/chat/pages/ChatPage';
import { TimesheetsPage } from './features/timesheets/pages/TimesheetsPage';

import { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuthStore } from './features/auth/store/authStore';
import { SessionManager } from './features/auth/sessionManager';
import { inactivityWatcher } from './features/auth/inactivityWatcher';
import { Toaster } from '@/components/ui/toaster';
import { SocketProvider } from './features/realtime/SocketProvider';

const queryClient = new QueryClient();

function App() {
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);

  useEffect(() => {
    // 1. Inactivity watcher setup
    inactivityWatcher.init(
      () => {
        setShowInactivityWarning(true);
      },
      () => {
        setShowInactivityWarning(false);
      }
    );

    // 2. Validate current session on startup
    const checkUserSession = async () => {
      try {
        await SessionManager.checkSession();
      } finally {
        useAuthStore.getState().setCheckingSession(false);
      }
    };
    checkUserSession();

    return () => {
      inactivityWatcher.destroy();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
        {showInactivityWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 text-amber-500 mb-4">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
              <h3 className="text-lg font-bold text-white tracking-tight">Session Expiring Due to Inactivity</h3>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed mb-6">
              You have been inactive for a while. For security reasons, your Avenue Projects session will automatically expire in 5 minutes. Move your mouse or press any key to keep your session alive.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => {
                  inactivityWatcher.resetTimer();
                  setShowInactivityWarning(false);
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                Keep Session Active
              </button>
            </div>
          </div>
        </div>
      )}
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/signin" replace />} />
          {/* Auth Routes */}
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
              
              <Route path="projects" element={<ProjectListPage />} />
              <Route path="projects/:id" element={<ProjectDetailsPage />} />
              
              <Route path="targets" element={<TargetListPage />} />
              <Route path="targets/:id" element={<TargetDetailsPage />} />
              
              <Route path="tasks" element={<TaskListPage />} />
              {/* Engineering and drafting aliases pointing to same task view for simplicity, 
                  access filtered internally in TaskListPage */}
              <Route path="my-tasks" element={<TaskListPage />} />
              <Route path="campaign-tasks" element={<TaskListPage />} />
              
              <Route path="boards" element={<KanbanBoardPage />} />
              
              <Route path="standups" element={<ProgressReportPage />} />
              <Route path="timesheets" element={<TimesheetsPage />} />
              
              {/* Project Manager Only Routes */}
              <Route element={<RoleProtectedRoute allowedRoles={['PROJECT_MANAGER', 'ADMIN']} />}>
                <Route path="analytics" element={<AnalyticsDashboardPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="team" element={<TeamManagementPage />} />
                <Route path="organization-audit" element={<OrganizationAuditLogPage />} />
              </Route>

              {/* Feedbacks - Accessible to all */}
              <Route path="feedbacks" element={<FeedbacksPage />} />

              {/* Member-Only Routes */}
              <Route element={<RoleProtectedRoute allowedRoles={['PRINCIPAL_ENGINEER', 'ENGINEER', 'DRAFTSMAN', 'ARCHITECT']} />}>
                <Route path="target-reports" element={<TargetReportsPage />} />
                <Route path="activity" element={<MyActivityLogPage />} />
              </Route>

               {/* Chat Route - Accessible to everyone */}
              <Route path="chat" element={<ChatPage />} />

              {/* Settings Route - Accessible to everyone in the dashboard */}
              <Route path="settings" element={<SettingsPage />} />
              
              {/* Calendar Timeline Route - Accessible to everyone */}
              <Route path="calendar" element={<CalendarPage />} />
            </Route>

            {/* Admin Route */}
            <Route element={<RoleProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>
          </Route>
        </Routes>
      </Router>
      <Toaster />
      </SocketProvider>
    </QueryClientProvider>
  );
}

export default App;
