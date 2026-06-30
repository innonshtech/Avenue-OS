import { useState, useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useStages } from '@/features/stages/api/stageApi';
import { ROLE_COLORS } from '@/constants/teamMembers';

// New Operational PM Components
import { 
  usePMSummary 
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
  const isPM = user?.role === 'PROJECT_MANAGER' || user?.role === 'ADMIN';

  // DEV/MARKETING DATA
  const { data: stages = [] } = useStages();

  // PM OPERATIONAL DATA
  const [selectedStageId, setSelectedStageId] = useState<string>('');

  // Set default to first active stage if available
  useEffect(() => {
    if (stages.length > 0 && !selectedStageId) {
      const activeStage = stages.find((s: any) => s.status === 'ACTIVE');
      if (activeStage) {
        setSelectedStageId(activeStage.id);
      } else {
        setSelectedStageId(stages[0].id);
      }
    }
  }, [stages, selectedStageId]);

  const { data: pmSummary, isLoading: isLoadingSummary } = usePMSummary(selectedStageId);

  // Derived KPIs for PM
  const activeProjectsCount = pmSummary?.kpis?.activeProjects || 0;
  const globalBlockersCount = pmSummary?.kpis?.globalBlockers || 0;
  const totalActiveTasksCount = pmSummary?.kpis?.totalActiveTasks || 0;
  const teamVelocityScore = 84; // Can be derived from previous stage or analytics endpoint

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
            
            {isPM && stages.length > 0 && (
              <div className="ml-2 flex items-center">
                <Select value={selectedStageId} onValueChange={setSelectedStageId}>
                  <SelectTrigger className="w-[200px] h-8 bg-card border-indigo-200 shadow-soft">
                    <SelectValue placeholder="Select Stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stages.map((s: any) => (
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
            Welcome back, <span className="font-medium text-foreground">{user?.name}</span>. Operational overview for current active stage.
          </p>
        </div>
      </div>

      {isPM ? (
        // ==========================================
        // PROJECT MANAGER COMMAND CENTER LAYOUT
        // ==========================================
        <div className="space-y-6">
          {/* Top KPI Row */}
          <DashboardKPIs 
            activeProjects={activeProjectsCount}
            totalActiveTasks={totalActiveTasksCount}
            globalBlockers={globalBlockersCount}
            teamVelocity={teamVelocityScore}
            isLoading={isLoadingSummary}
          />

          {/* Section 1 & 2: Health & Workload */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-6 min-h-[400px]">
            <div className="lg:col-span-4">
              <SprintHealthPanel health={pmSummary?.health} isLoading={isLoadingSummary} />
            </div>
            <div className="lg:col-span-3">
              <TeamWorkloadPanel workload={pmSummary?.workload} isLoading={isLoadingSummary} />
            </div>
          </div>

          {/* Section 3: Board Snapshot */}
          <div className="pt-2">
            <SprintBoardSnapshot snapshot={pmSummary?.boardSnapshot} isLoading={isLoadingSummary} />
          </div>

          {/* Section 4: Standup Monitoring */}
          <div className="pt-2">
            <TeamStandupMonitoring standups={pmSummary?.standups} isLoading={isLoadingSummary} />
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
