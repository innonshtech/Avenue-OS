import { useState, useEffect } from 'react';
import { useStages } from '@/features/stages/api/stageApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMemberStageSummary, useCompletedTasks, usePendingTasks, useMemberBlockers, useMemberProductivity } from '../api/memberReportsApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Clock, AlertTriangle, Zap, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function StageReportsPage() {
  const { data: stages = [] } = useStages();
  const [selectedStageId, setSelectedStageId] = useState<string | undefined>();

  useEffect(() => {
    if (!selectedStageId && stages.length > 0) {
      const activeStage = stages.find((s: any) => s.status === 'ACTIVE');
      setSelectedStageId(activeStage?.id || stages[0]?.id);
    }
  }, [stages, selectedStageId]);

  const { data: summary, isLoading: isSummaryLoading } = useMemberStageSummary(selectedStageId);
  const { data: completedTasks = [] } = useCompletedTasks(selectedStageId);
  const { data: pendingTasks = [] } = usePendingTasks(selectedStageId);
  const { data: productivity } = useMemberProductivity(selectedStageId);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Stage Report</h1>
          <p className="text-muted-foreground mt-1">Track your personal contribution and productivity metrics.</p>
        </div>
        
        {stages.length > 0 && (
          <Select value={selectedStageId} onValueChange={setSelectedStageId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Stage" />
            </SelectTrigger>
            <SelectContent>
              {stages.map((s: any, idx: number) => (
                <SelectItem key={s.id} value={s.id}>
                  Stage {idx + 1}: {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {!isSummaryLoading && summary ? (
        <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 border-indigo-100 dark:border-indigo-900/50">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-indigo-900 dark:text-indigo-300">{summary.name}</h2>
                <div className="text-sm text-indigo-700/80 dark:text-indigo-400 mt-1">
                  Day {summary.elapsedDays} / {summary.totalDays} • {summary.daysRemaining} days remaining
                </div>
              </div>
              <div className="flex-1 w-full space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Stage Timeline Progress</span>
                  <span>{summary.progress}%</span>
                </div>
                <Progress value={summary.progress} className="h-3" />
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-full dark:bg-emerald-900/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-3xl font-bold">{productivity?.completedTasks || 0}</h3>
            <p className="text-sm text-muted-foreground font-medium">Tasks Completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-full dark:bg-amber-900/30">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-3xl font-bold">{productivity?.pendingTasks || 0}</h3>
            <p className="text-sm text-muted-foreground font-medium">Tasks Pending</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full dark:bg-indigo-900/30">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-3xl font-bold">{productivity?.storyPoints || 0}</h3>
            <p className="text-sm text-muted-foreground font-medium">Task Weight Points</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-2">
            <div className="p-3 bg-rose-100 text-rose-600 rounded-full dark:bg-rose-900/30">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-3xl font-bold">{productivity?.rfiCount || 0}</h3>
            <p className="text-sm text-muted-foreground font-medium">RFIs Raised</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-500" />
              Completed Work
            </CardTitle>
          </CardHeader>
          <CardContent>
            {completedTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No completed tasks yet.</p>
            ) : (
              <div className="space-y-4">
                {completedTasks.map((t: any) => (
                  <div key={t.id} className="flex justify-between items-start border-b pb-3 last:border-0 last:pb-0">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground mb-1">{t.key}</div>
                      <div className="text-sm font-medium">{t.title}</div>
                    </div>
                    <Badge variant="outline" className="text-[10px] whitespace-nowrap ml-2">
                      {new Date(t.updatedAt).toLocaleDateString()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Layers className="w-5 h-5 mr-2 text-amber-500" />
              Pending & Delayed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">All caught up!</p>
            ) : (
              <div className="space-y-4">
                {pendingTasks.map((t: any) => {
                  const isOverdue = t.dueDate && new Date(t.dueDate) < new Date();
                  return (
                    <div key={t.id} className="flex justify-between items-start border-b pb-3 last:border-0 last:pb-0">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-muted-foreground">{t.key}</span>
                          <Badge variant="secondary" className="text-[10px]">{t.status.replace('_', ' ')}</Badge>
                          {isOverdue && <Badge variant="destructive" className="text-[10px]">Overdue</Badge>}
                        </div>
                        <div className="text-sm font-medium">{t.title}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
    </div>
  );
}
