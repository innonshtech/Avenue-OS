import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Play, CheckCircle2, ShieldAlert, FileText } from 'lucide-react';
import { useUpdateTaskStatus } from '../api/memberDashboardApi';
import { useToast } from '@/hooks/use-toast';

export default function AssignedTaskCard({ task, onMarkBlocked, onAddUpdate }: { task: any, onMarkBlocked: (task: any) => void, onAddUpdate: (task: any) => void }) {
  const updateStatus = useUpdateTaskStatus();
  const { toast } = useToast();

  const handleStartTask = () => {
    updateStatus.mutate(
      { id: task.id, status: 'IN_PROGRESS' },
      {
        onSuccess: () => {
          toast({ title: "Task Started", description: `${task.key} is now In Progress` });
        }
      }
    );
  };

  const handleMoveToReview = () => {
    updateStatus.mutate(
      { id: task.id, status: 'IN_REVIEW' },
      {
        onSuccess: () => {
          toast({ title: "Task In Review", description: `${task.key} moved to Review` });
        }
      }
    );
  };

  return (
    <Card className="mb-3 group border-l-4 border-l-indigo-500">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-muted-foreground">{task.key}</span>
              <Badge variant={task.priority === 'URGENT' || task.priority === 'CRITICAL' ? 'destructive' : 'secondary'} className="text-[10px] uppercase">
                {task.priority}
              </Badge>
              {task.storyPoints && (
                <Badge variant="outline" className="text-[10px]">
                  {task.storyPoints} SP
                </Badge>
              )}
            </div>
            <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
          </div>
          <Badge className="text-[10px] shrink-0" variant="outline">{task.status.replace('_', ' ')}</Badge>
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-muted/50 mt-1">
          {task.status === 'TODO' && (
            <Button size="sm" variant="outline" className="h-7 text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200" onClick={handleStartTask} disabled={updateStatus.isPending}>
              <Play className="h-3 w-3 mr-1" /> Start Task
            </Button>
          )}
          {task.status === 'IN_PROGRESS' && (
            <Button size="sm" variant="outline" className="h-7 text-xs bg-sky-50 text-sky-700 hover:bg-sky-100 border-sky-200" onClick={handleMoveToReview} disabled={updateStatus.isPending}>
              <CheckCircle2 className="h-3 w-3 mr-1" /> Move To Review
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-7 text-xs text-rose-700 hover:bg-rose-50 border-rose-200" onClick={() => onMarkBlocked(task)}>
            <ShieldAlert className="h-3 w-3 mr-1" /> Mark Blocked
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => onAddUpdate(task)}>
            <FileText className="h-3 w-3 mr-1" /> Add Update
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
