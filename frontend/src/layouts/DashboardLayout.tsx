import { useMemo } from 'react';
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
  Search,
  Menu,
  LogOut,
  Zap,
  Briefcase,
  Activity,
  ShieldCheck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  useNotifications, 
  useMarkNotificationRead, 
  useMarkAllNotificationsRead 
} from '@/features/notifications/api/notificationApi';
import { ROLE_COLORS } from '@/constants/teamMembers';
import type { UserRole } from '@/types/user';

// Access Control config
const SIDEBAR_CONFIG: Record<UserRole, { icon: any, label: string, path: string }[]> = {
  PRODUCT_MANAGER: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: CheckSquare, label: 'Projects', path: '/dashboard/projects' },
    { icon: Clock, label: 'Sprints', path: '/dashboard/sprints' },
    { icon: CheckSquare, label: 'Tasks', path: '/dashboard/tasks' },
    { icon: Kanban, label: 'Boards', path: '/dashboard/boards' },
    { icon: Users, label: 'Standups', path: '/dashboard/standups' },
    { icon: BarChart, label: 'Analytics', path: '/dashboard/analytics' },
    { icon: BarChart, label: 'Reports', path: '/dashboard/reports' },
    { icon: ShieldCheck, label: 'Audit Log', path: '/dashboard/organization-audit' },
    { icon: MessageSquare, label: 'Feedbacks', path: '/dashboard/feedbacks' },
    { icon: Users, label: 'Team Management', path: '/dashboard/team' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ],
  DEVELOPER: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: CheckSquare, label: 'My Tasks', path: '/dashboard/my-tasks' },
    { icon: Kanban, label: 'Boards', path: '/dashboard/boards' },
    { icon: Users, label: 'Standups', path: '/dashboard/standups' },
    { icon: Activity, label: 'Activity Log', path: '/dashboard/activity' },
    { icon: BarChart, label: 'Sprint Reports', path: '/dashboard/sprint-reports' },
    { icon: MessageSquare, label: 'Feedbacks', path: '/dashboard/feedbacks' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ],
  MARKETING: [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: Briefcase, label: 'Campaign Tasks', path: '/dashboard/campaign-tasks' },
    { icon: Users, label: 'Standups', path: '/dashboard/standups' },
    { icon: Activity, label: 'Activity Log', path: '/dashboard/activity' },
    { icon: MessageSquare, label: 'Feedbacks', path: '/dashboard/feedbacks' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ],
  ADMIN: [
    { icon: LayoutDashboard, label: 'Admin Dashboard', path: '/admin' },
  ]
};

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const { data: notifications = [], isLoading: isLoadingNotifications } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const unreadNotifications = useMemo(() => {
    return notifications.filter((n: any) => !n.isRead);
  }, [notifications]);

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const sidebarItems = user ? (SIDEBAR_CONFIG[user.role] || []) : [];

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card/30 hidden md:flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">SprintOS</span>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1.5">
          {sidebarItems.map((item, i) => {
            const isActive = location.pathname === item.path || (location.pathname === '/dashboard' && item.path === '/dashboard');
            return (
              <Link 
                key={i} 
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                  isActive 
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-medium' 
                  : 'hover:bg-accent/50 text-muted-foreground hover:text-foreground font-medium'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm">{item.label}</span>
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
            <button className="md:hidden text-muted-foreground hover:text-foreground">
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex items-center bg-muted/40 rounded-full px-4 py-2 w-full max-w-md border border-border/50 focus-within:ring-1 focus-within:ring-indigo-500 transition-shadow">
              <Search className="w-4 h-4 text-muted-foreground mr-3" />
              <input 
                type="text" 
                placeholder="Search projects, tasks, or members..." 
                className="bg-transparent border-none outline-none text-sm w-full text-foreground placeholder:text-muted-foreground"
              />
            </div>
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
                          e.preventDefault(); // Prevents the dropdown from closing on click
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
                <div className="flex items-center gap-3">
                  <div className="hidden text-right md:flex flex-col items-end">
                    <p className="text-sm font-semibold leading-none mb-1.5">{user?.name}</p>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider border ${user ? ROLE_COLORS[user.role] : ''}`}>
                        {user?.role?.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] font-medium text-muted-foreground uppercase">{user?.department}</span>
                    </div>
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer">Profile</DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">Settings</DropdownMenuItem>
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
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
