import { useMemo, useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/store/authStore';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Kanban, 
  Clock, 
  Settings, 
  BarChart, 
  MessageSquare,
  Users,
  Bell,
  Menu,
  LogOut,
  Briefcase,
  Activity,
  ShieldCheck,
  Calendar,
  FileText
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  useNotifications, 
  useMarkNotificationRead, 
  useMarkAllNotificationsRead 
} from '@/features/notifications/api/notificationApi';
import { ROLE_COLORS } from '@/constants/teamMembers';
import type { UserRole } from '@/types/user';
import { GlobalSearchBar } from '@/features/search/GlobalSearchBar';
import { useChannels } from '@/features/chat/api/chatApi';

// Access Control config
const SIDEBAR_CONFIG: Record<UserRole, { icon: any, label: string, path: string }[]> = {
  PROJECT_MANAGER: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: CheckSquare, label: 'Projects', path: '/dashboard/projects' },
    { icon: Clock, label: 'Stages', path: '/dashboard/stages' },
    { icon: CheckSquare, label: 'Tasks', path: '/dashboard/tasks' },
    { icon: Kanban, label: 'Boards', path: '/dashboard/boards' },
    { icon: MessageSquare, label: 'Chat', path: '/dashboard/chat' },
    { icon: Users, label: 'Progress Reports', path: '/dashboard/standups' },
    { icon: FileText, label: 'Timesheets', path: '/dashboard/timesheets' },
    { icon: BarChart, label: 'Analytics', path: '/dashboard/analytics' },
    { icon: BarChart, label: 'Reports', path: '/dashboard/reports' },
    { icon: ShieldCheck, label: 'Audit Log', path: '/dashboard/organization-audit' },
    { icon: MessageSquare, label: 'Feedbacks', path: '/dashboard/feedbacks' },
    { icon: Users, label: 'Team Management', path: '/dashboard/team' },
    { icon: Calendar, label: 'Calendar', path: '/dashboard/calendar' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ],
  PRINCIPAL_ENGINEER: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: CheckSquare, label: 'My Tasks', path: '/dashboard/my-tasks' },
    { icon: Kanban, label: 'Boards', path: '/dashboard/boards' },
    { icon: MessageSquare, label: 'Chat', path: '/dashboard/chat' },
    { icon: Users, label: 'Progress Reports', path: '/dashboard/standups' },
    { icon: FileText, label: 'Timesheets', path: '/dashboard/timesheets' },
    { icon: Activity, label: 'Activity Log', path: '/dashboard/activity' },
    { icon: BarChart, label: 'Stage Reports', path: '/dashboard/stage-reports' },
    { icon: MessageSquare, label: 'Feedbacks', path: '/dashboard/feedbacks' },
    { icon: Calendar, label: 'Calendar', path: '/dashboard/calendar' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ],
  ENGINEER: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: CheckSquare, label: 'My Tasks', path: '/dashboard/my-tasks' },
    { icon: Kanban, label: 'Boards', path: '/dashboard/boards' },
    { icon: MessageSquare, label: 'Chat', path: '/dashboard/chat' },
    { icon: Users, label: 'Progress Reports', path: '/dashboard/standups' },
    { icon: FileText, label: 'Timesheets', path: '/dashboard/timesheets' },
    { icon: Activity, label: 'Activity Log', path: '/dashboard/activity' },
    { icon: BarChart, label: 'Stage Reports', path: '/dashboard/stage-reports' },
    { icon: MessageSquare, label: 'Feedbacks', path: '/dashboard/feedbacks' },
    { icon: Calendar, label: 'Calendar', path: '/dashboard/calendar' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ],
  DRAFTSMAN: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: CheckSquare, label: 'My Tasks', path: '/dashboard/my-tasks' },
    { icon: Kanban, label: 'Boards', path: '/dashboard/boards' },
    { icon: MessageSquare, label: 'Chat', path: '/dashboard/chat' },
    { icon: Users, label: 'Progress Reports', path: '/dashboard/standups' },
    { icon: FileText, label: 'Timesheets', path: '/dashboard/timesheets' },
    { icon: Activity, label: 'Activity Log', path: '/dashboard/activity' },
    { icon: MessageSquare, label: 'Feedbacks', path: '/dashboard/feedbacks' },
    { icon: Calendar, label: 'Calendar', path: '/dashboard/calendar' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ],
  ARCHITECT: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: CheckSquare, label: 'My Tasks', path: '/dashboard/my-tasks' },
    { icon: Kanban, label: 'Boards', path: '/dashboard/boards' },
    { icon: MessageSquare, label: 'Chat', path: '/dashboard/chat' },
    { icon: Users, label: 'Progress Reports', path: '/dashboard/standups' },
    { icon: FileText, label: 'Timesheets', path: '/dashboard/timesheets' },
    { icon: Activity, label: 'Activity Log', path: '/dashboard/activity' },
    { icon: MessageSquare, label: 'Feedbacks', path: '/dashboard/feedbacks' },
    { icon: Calendar, label: 'Calendar', path: '/dashboard/calendar' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ],
  CLIENT: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Kanban, label: 'Boards', path: '/dashboard/boards' },
    { icon: MessageSquare, label: 'Chat', path: '/dashboard/chat' },
    { icon: MessageSquare, label: 'Feedbacks', path: '/dashboard/feedbacks' },
    { icon: Calendar, label: 'Calendar', path: '/dashboard/calendar' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ],
  ADMIN: [
    { icon: LayoutDashboard, label: 'Admin Dashboard', path: '/admin' },
    { icon: FileText, label: 'Timesheets', path: '/dashboard/timesheets' },
  ]
};

import { SessionManager } from '@/features/auth/sessionManager';

export default function DashboardLayout() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const { data: notifications = [], isLoading: isLoadingNotifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const unreadNotifications = useMemo(() => {
    return notifications.filter((n: any) => !n.isRead);
  }, [notifications]);

  const { data: channels = [] } = useChannels();
  const unreadChatCount = channels.reduce((acc, c) => acc + (c._count?.unread || 0), 0);

  const handleLogout = () => {
    SessionManager.performLogout();
  };

  const sidebarItems = user ? (SIDEBAR_CONFIG[user.role] || []) : [];

  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden">
      {/* Mobile Sidebar Backdrop */}
      {isMobileSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-50 md:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar Content Drawer */}
      <aside className={`fixed inset-y-0 left-0 w-64 border-r border-border bg-background z-50 md:hidden flex flex-col transition-transform duration-300 transform ${
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Avenue Logo" className="w-8 h-8 object-contain rounded-md" />
            <span className="font-bold text-lg tracking-tight">Avenue Projects</span>
          </div>
          <button 
            onClick={() => setIsMobileSidebarOpen(false)}
            className="text-muted-foreground hover:text-foreground focus:outline-none"
            aria-label="Close sidebar menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5">
          {sidebarItems.map((item, i) => {
            const isActive = location.pathname === item.path || (location.pathname === '/dashboard' && item.path === '/dashboard');
            return (
              <Link 
                key={i} 
                to={item.path}
                onClick={() => setIsMobileSidebarOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors relative ${
                  isActive 
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium' 
                  : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </div>
                
                {/* Notification Dots */}
                {item.label === 'Chat' && unreadChatCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
                    {unreadChatCount}
                  </span>
                )}
                
                {/* Generic Notification Check based on notifications array */}
                {item.label !== 'Chat' && item.path !== '/dashboard' && unreadNotifications.some((n: any) => n.linkUrl?.includes(item.path)) && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                )}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-border bg-card/30 hidden md:flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Avenue Logo" className="w-8 h-8 object-contain rounded-md" />
            <span className="font-bold text-lg tracking-tight">Avenue Projects</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5">
          {sidebarItems.map((item, i) => {
            const isActive = location.pathname === item.path || (location.pathname === '/dashboard' && item.path === '/dashboard');
            return (
              <Link 
                key={i} 
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-md transition-colors relative ${
                  isActive 
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium' 
                  : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                </div>
                
                {/* Notification Dots */}
                {item.label === 'Chat' && unreadChatCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-[10px] font-bold text-white">
                    {unreadChatCount}
                  </span>
                )}
                
                {/* Generic Notification Check based on notifications array */}
                {item.label !== 'Chat' && item.path !== '/dashboard' && unreadNotifications.some((n: any) => n.linkUrl?.includes(item.path)) && (
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                )}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Topbar */}
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-4 w-full max-w-xl">
            <button 
              onClick={() => setIsMobileSidebarOpen(true)}
              className="md:hidden text-muted-foreground hover:text-foreground focus:outline-none"
              aria-label="Open sidebar menu"
            >
              <Menu className="w-6 h-6" />
            </button>
            <GlobalSearchBar />
          </div>
          
          <div className="flex items-center gap-6">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative text-muted-foreground hover:text-foreground transition-colors focus:outline-none">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-indigo-600 text-[9px] font-bold text-white ring-2 ring-background">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0 shadow-lg border border-border">
                <div className="flex items-center justify-between border-b border-border p-3">
                  <span className="font-semibold text-sm">Notifications</span>
                  {unreadCount > 0 && (
                    <button 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        markAllRead.mutate();
                      }} 
                      className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-semibold"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {isLoadingNotifications ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">Loading...</div>
                  ) : unreadNotifications.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground font-medium">No new notifications</div>
                  ) : (
                    unreadNotifications.map((notif: any) => (
                      <DropdownMenuItem 
                        key={notif.id} 
                        onSelect={(e) => {
                          e.preventDefault();
                          if (!notif.isRead) markRead.mutate(notif.id);
                          if (notif.linkUrl) navigate(notif.linkUrl);
                        }}
                        className="flex flex-col items-start p-3 border-b border-border/50 cursor-pointer focus:bg-accent/50 bg-indigo-500/5 font-semibold text-foreground"
                      >
                        <div className="flex justify-between items-start w-full mb-1">
                          <span className="text-xs font-semibold">{notif.title}</span>
                          <span className="text-[9px] text-muted-foreground">
                            {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 font-normal">{notif.message}</p>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger className="focus:outline-none">
                <Avatar className="h-8 w-8 border border-border hover:ring-2 ring-indigo-500/50 transition-all cursor-pointer">
                  <AvatarImage src={user?.avatar || undefined} alt={user?.name || 'User'} />
                  <AvatarFallback className="bg-indigo-600 text-white font-semibold text-xs">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex flex-col space-y-1.5 p-2">
                  <p className="text-sm font-semibold leading-none">{user?.name}</p>
                  <div className="flex items-center gap-1.5 pt-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider border ${user ? ROLE_COLORS[user.role] : ''}`}>
                      {user?.role?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/dashboard/settings')}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => navigate('/dashboard/settings')}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className={`flex-1 overflow-y-auto ${location.pathname.includes('/chat') ? 'p-2 md:p-4' : 'p-4 md:p-8'}`}>
          <div className={`${location.pathname.includes('/chat') ? 'w-full h-full mx-auto' : 'max-w-7xl mx-auto'}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
