import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, Calendar, Target, Activity } from 'lucide-react';
import BlockedTaskCard from './BlockedTaskCard';

interface SprintHealthProps {
  health: any;
  isLoading: boolean;
}

export default function SprintHealthPanel({ health, isLoading }: SprintHealthProps) {
  if (isLoading) {
    return (
      <Card className="h-full bg-card shadow-soft border-muted animate-pulse">
        <CardHeader><CardTitle className="bg-muted h-6 w-1/3 rounded"></CardTitle></CardHeader>
        <CardContent><div className="space-y-4"><div className="h-4 bg-muted rounded w-full"></div><div className="h-4 bg-muted rounded w-5/6"></div></div></CardContent>
      </Card>
    );
  }

  if (!health || health.activeSprint === null) {
    return (
      <Card className="h-full bg-card shadow-soft border-muted flex flex-col justify-center items-center text-center p-6 text-muted-foreground">
        <Activity className="w-12 h-12 mb-4 opacity-20" />
        <CardTitle className="text-xl mb-2 text-foreground">No Active Sprint</CardTitle>
        <CardDescription>There is currently no active sprint. Start a sprint to view health metrics.</CardDescription>
      </Card>
    );
  }

  const statusColor = 
    health.status === 'HEALTHY' ? 'bg-emerald-500 text-emerald-50' : 
    health.status === 'AT RISK' ? 'bg-amber-500 text-amber-50' : 
    health.status === 'DELAYED' ? 'bg-red-500 text-red-50' : 'bg-indigo-500 text-indigo-50';

  return (
    <Card className="h-full bg-card shadow-soft border-muted flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-500" /> Sprint Health
          </CardTitle>
          <CardDescription className="mt-1 font-medium text-foreground">{health.activeSprint}</CardDescription>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${statusColor}`}>
          {health.status}
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col pt-6 space-y-6">
        
        {/* Sprint Progress */}
        <div className="space-y-2">
          <div className="flex justify-between items-end mb-1">
            <span className="text-sm font-medium text-muted-foreground">Sprint Progress</span>
            <span className="text-sm font-bold">{health.completedTasks} / {health.totalTasks} Tasks</span>
          </div>
          <Progress value={health.completionPercentage} className="h-3 bg-muted" indicatorClassName="bg-indigo-600" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{health.completionPercentage}% Completed</span>
            <span>{health.totalTasks - health.completedTasks} Pending</span>
          </div>
        </div>

        {/* Sprint Timeline */}
        <div className="bg-muted/30 rounded-lg p-4 flex items-center justify-between border border-border/50">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-100 dark:bg-indigo-900/50 p-2 rounded-md text-indigo-600">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-medium">Day {health.totalDays - health.daysRemaining} of {health.totalDays}</p>
              <p className="text-xs text-muted-foreground">{health.daysRemaining} days remaining</p>
            </div>
          </div>
          <div className="text-right">
            <Target className="w-5 h-5 text-muted-foreground mb-1 ml-auto" />
            <p className="text-xs font-medium text-muted-foreground">Sprint Goal</p>
          </div>
        </div>

        {/* Sprint Goal */}
        <div className="text-sm italic text-muted-foreground border-l-2 border-indigo-500 pl-3">
          "{health.sprintGoal}"
        </div>

        {/* Risk Indicators */}
        {health.riskIndicators && health.riskIndicators.length > 0 && (
          <div className="space-y-2 pt-2 border-t">
            <span className="text-sm font-medium text-muted-foreground">Risk Indicators</span>
            <div className="flex flex-wrap gap-2">
              {health.riskIndicators.map((risk: string, i: number) => (
                <span key={i} className="text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded border border-red-200 dark:border-red-800 flex items-center gap-1">
                  {risk}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Blocked Tasks */}
        {health.blockedTasks && health.blockedTasks.length > 0 && (
          <div className="space-y-3 pt-2 flex-1">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-red-500" /> Active Blockers
            </span>
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {health.blockedTasks.map((task: any) => (
                <BlockedTaskCard key={task.id} task={task} />
              ))}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  );
}
