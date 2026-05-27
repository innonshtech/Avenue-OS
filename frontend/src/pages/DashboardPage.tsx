import { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useTasks } from '@/features/tasks/api/taskApi';
import { useProjects } from '@/features/projects/api/projectApi';
import { useSprints } from '@/features/sprints/api/sprintApi';
import { ROLE_COLORS } from '@/constants/teamMembers';

// New Operational PM Components
import { 
  useSprintHealth, 
  useTeamWorkload, 
  useBoardSnapshot, 
  useStandupMonitoring 
} from '@/features/dashboard/api/dashboardApi';
import DashboardKPIs from '@/features/dashboard/components/DashboardKPIs';
import SprintHealthPanel from '@/features/dashboard/components/SprintHealthPanel';
import TeamWorkloadPanel from '@/features/dashboard/components/TeamWorkloadPanel';
import SprintBoardSnapshot from '@/features/dashboard/components/SprintBoardSnapshot';
import TeamStandupMonitoring from '@/features/dashboard/components/TeamStandupMonitoring';
import { OrganizationActivityFeed } from '@/features/activity/OrganizationActivityFeed';

// Legacy Dev/Marketing widgets
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MemberDashboard from '@/features/dashboard/member/MemberDashboard';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const isPM = user?.role === 'PRODUCT_MANAGER';

  // DEV/MARKETING DATA
  const { data: tasks = [] } = useTasks();
  const { data: projects = [] } = useProjects();
  const { data: sprints = [] } = useSprints();

  const myTasks = tasks.filter((t: any) => t.assigneeId === user?.id);
  const myCompletedTasks = myTasks.filter((t: any) => t.status === 'DONE');
  const myPendingTasks = myTasks.filter((t: any) => t.status !== 'DONE');
  const activeSprints = sprints.filter((s: any) => s.status === 'ACTIVE');

  // PM OPERATIONAL DATA
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');

  // Set default to first active sprint if available
  useEffect(() => {
    if (sprints.length > 0 && !selectedSprintId) {
      const activeSprint = sprints.find((s: any) => s.status === 'ACTIVE');
      if (activeSprint) {
        setSelectedSprintId(activeSprint.id);
      } else {
        setSelectedSprintId(sprints[0].id);
      }
    }
  }, [sprints, selectedSprintId]);

  const { data: sprintHealth, isLoading: isLoadingHealth } = useSprintHealth(selectedSprintId);
  const { data: teamWorkload, isLoading: isLoadingWorkload } = useTeamWorkload(selectedSprintId);
  const { data: boardSnapshot, isLoading: isLoadingBoard } = useBoardSnapshot(selectedSprintId);
  const { data: standups, isLoading: isLoadingStandups } = useStandupMonitoring(selectedSprintId);

  // Derived KPIs for PM
  const activeProjectsCount = projects.filter((p: any) => p.status === 'ACTIVE').length;
  const globalBlockersCount = tasks.flatMap((t: any) => t.blockers || []).filter((b: any) => !b.isResolved).length;
  const totalActiveTasksCount = tasks.filter((t: any) => t.status !== 'DONE').length;
  const teamVelocityScore = 84; // Can be derived from previous sprint or analytics endpoint

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
            {user && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${ROLE_COLORS[user.role]}`}>
                {user.role.replace('_', ' ')}
              </span>
            )}
            
            {isPM && sprints.length > 0 && (
              <div className="ml-2 flex items-center">
                <Select value={selectedSprintId} onValueChange={setSelectedSprintId}>
                  <SelectTrigger className="w-[200px] h-8 bg-card border-indigo-200 shadow-soft">
                    <SelectValue placeholder="Select Sprint" />
                  </SelectTrigger>
                  <SelectContent>
                    {sprints.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} <span className="text-[10px] text-muted-foreground ml-2">({s.status})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <p className="text-muted-foreground">
            Welcome back, <span className="font-medium text-foreground">{user?.name}</span>. Operational overview for current active sprint.
          </p>
        </div>
      </div>

      {isPM ? (
        // ==========================================
        // PRODUCT MANAGER COMMAND CENTER LAYOUT
        // ==========================================
        <div className="space-y-6">
          {/* Top KPI Row */}
          <DashboardKPIs 
            activeProjects={activeProjectsCount}
            totalActiveTasks={totalActiveTasksCount}
            globalBlockers={globalBlockersCount}
            teamVelocity={teamVelocityScore}
          />

          {/* Section 1 & 2: Health & Workload */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 min-h-[400px]">
            <div className="lg:col-span-4">
              <SprintHealthPanel health={sprintHealth} isLoading={isLoadingHealth} />
            </div>
            <div className="lg:col-span-3">
              <TeamWorkloadPanel workload={teamWorkload} isLoading={isLoadingWorkload} />
            </div>
          </div>

          {/* Section 3: Board Snapshot */}
          <div className="pt-2">
            <SprintBoardSnapshot snapshot={boardSnapshot} isLoading={isLoadingBoard} />
          </div>

          {/* Section 4: Standup Monitoring */}
          <div className="pt-2">
            <TeamStandupMonitoring standups={standups} isLoading={isLoadingStandups} />
          </div>

          {/* Section 5: Organization Audit */}
          <div className="pt-2">
            <OrganizationActivityFeed />
          </div>
        </div>
      ) : (
        // ==========================================
        // MEMBER DASHBOARD FOR DEVS & MARKETING
        // ==========================================
        <MemberDashboard />
      )}
    </div>
  );
}
