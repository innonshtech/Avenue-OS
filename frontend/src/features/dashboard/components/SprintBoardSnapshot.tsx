import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Columns } from 'lucide-react';
import MiniKanbanColumn from './MiniKanbanColumn';

interface BoardSnapshotProps {
  snapshot: any;
  isLoading: boolean;
}

const emptyColumn = { count: 0, storyPoints: 0, members: [] };

export default function SprintBoardSnapshot({ snapshot, isLoading }: BoardSnapshotProps) {
  if (isLoading) {
    return (
      <Card className="bg-card shadow-soft border-muted animate-pulse h-[200px]">
        <CardHeader><CardTitle className="bg-muted h-6 w-1/4 rounded"></CardTitle></CardHeader>
      </Card>
    );
  }

  if (!snapshot) {
    return (
      <Card className="bg-card shadow-soft border-muted">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Columns className="w-5 h-5 text-indigo-500" /> Target Board Snapshot
            </CardTitle>
            <CardDescription>Mini operational overview of the active target</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground border border-dashed rounded-lg">
            No active target board available.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card shadow-soft border-muted">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-lg flex items-center gap-2">
            <Columns className="w-5 h-5 text-indigo-500" /> Target Board Snapshot
          </CardTitle>
          <CardDescription>Mini operational overview of the active target</CardDescription>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Total Points</span>
          <p className="text-xl font-bold text-indigo-600">{snapshot.totalStoryPoints || 0}</p>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <MiniKanbanColumn 
            title="Pending" 
            data={snapshot.pending || emptyColumn} 
            colorClass="border-slate-200 dark:border-slate-800" 
          />
          <MiniKanbanColumn 
            title="In Progress" 
            data={snapshot.inProgress || emptyColumn} 
            colorClass="border-blue-200 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10" 
          />
          <MiniKanbanColumn 
            title="Int. Review" 
            data={snapshot.internalReview || emptyColumn} 
            colorClass="border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-900/10" 
          />
          <MiniKanbanColumn 
            title="Ext. Review" 
            data={snapshot.externalReview || emptyColumn} 
            colorClass="border-purple-200 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-900/10" 
          />
          <MiniKanbanColumn 
            title="Done / Approved" 
            data={snapshot.done || emptyColumn} 
            colorClass="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-900/10" 
          />
        </div>
      </CardContent>
    </Card>
  );
}
