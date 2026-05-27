import { useMemberOverview, useMyTasks } from '../api/memberDashboardApi';
import MemberOverviewCards from './MemberOverviewCards';
import MyWorkTodayPanel from './MyWorkTodayPanel';
import MiniSprintBoard from './MiniSprintBoard';
import { MemberActivityFeed } from '@/features/activity/MemberActivityFeed';

export default function MemberDashboard() {
  const { data: overview, isLoading: isOverviewLoading } = useMemberOverview();
  const { data: tasks = [], isLoading: isTasksLoading } = useMyTasks();

  return (
    <div className="space-y-6 pb-12">
      <MemberOverviewCards overview={overview} isLoading={isOverviewLoading} />
      
      {!isTasksLoading && (
        <>
          <MyWorkTodayPanel tasks={tasks} reviewQueue={overview?.reviewQueue || 0} />
          <MiniSprintBoard tasks={tasks} />
        </>
      )}

      <div className="pt-2">
        <MemberActivityFeed />
      </div>
    </div>
  );
}
