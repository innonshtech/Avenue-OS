import { useParams, Link } from 'react-router-dom';
import { useStage } from '../api/stageApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Clock, BarChart3, AlertTriangle, LayoutDashboard, Target } from 'lucide-react';
import { StageActionDropdown } from '../components/StageActionDropdown';
import { useAuthStore } from '@/features/auth/store/authStore';

export default function StageDetailsPage() {
  const { id } = useParams();
  const { data: stage, isLoading } = useStage(id!);
  const { user } = useAuthStore();

  if (isLoading) return <div className="flex justify-center p-10">Loading stage...</div>;
  if (!stage) return <div>Stage not found.</div>;

  const project = stage.project;
  const stageTasks = (stage as any).tasks || [];
  
  const completedTasks = stageTasks.filter((t: any) => t.status === 'DONE').length;
  const totalTasks = stageTasks.length;
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  const activeRFIsCount = stageTasks.flatMap((t: any) => (t as any).rfis || []).filter((b: any) => !b.isResolved).length;
  
  const totalDrawings = stageTasks.filter((t: any) => t.drawingNumber).length;
  const completedDrawings = stageTasks.filter((t: any) => t.drawingNumber && t.status === 'DONE').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/dashboard/stages">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Badge variant="outline" className="font-mono text-xs">{project?.key}</Badge>
              <Badge variant={stage.status === 'ACTIVE' ? 'default' : 'secondary'} className={stage.status === 'ACTIVE' ? 'bg-indigo-500 text-white border-transparent' : ''}>
                {stage.status}
              </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{stage.name}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/dashboard/boards">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-soft">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Go to Board
            </Button>
          </Link>
          {(user?.role === 'PROJECT_MANAGER' || user?.role === 'ADMIN') && (
            <StageActionDropdown stage={stage} />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="bg-card shadow-soft border-muted md:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg flex items-center text-muted-foreground">
              <Target className="w-4 h-4 mr-2 text-indigo-500" />
              Stage Scope / Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium text-foreground mb-6">
              {stage.goal || "No goal defined."}
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">Stage Progress (Drawings Deliverable)</span>
                <span className="font-bold text-indigo-500">{completedDrawings} / {totalDrawings} drawings</span>
              </div>
              <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-in-out" 
                  style={{ width: `${totalDrawings === 0 ? 0 : Math.round((completedDrawings / totalDrawings) * 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-right">{progress}% of total tasks completed</p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="bg-card shadow-soft border-muted">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center text-muted-foreground">
                <Clock className="w-4 h-4 mr-2" />
                Time Remaining
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Math.max(0, Math.ceil((new Date(stage.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
              </div>
              <p className="text-xs text-muted-foreground mt-1">Ends {new Date(stage.endDate).toLocaleDateString()}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-card shadow-soft border-red-500/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center text-red-500">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Active RFIs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{activeRFIsCount}</div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Stage Tasks Overview</h2>
        <div className="rounded-md border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium">Task</th>
                  <th className="px-6 py-4 font-medium">Drawing No.</th>
                  <th className="px-6 py-4 font-medium text-center">Revision</th>
                  <th className="px-6 py-4 font-medium text-center">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {stageTasks.map((task: any) => (
                  <tr key={task.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[10px] text-muted-foreground">{task.key}</span>
                        <span className="font-medium text-foreground">{task.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      {task.drawingNumber || '-'}
                    </td>
                    <td className="px-6 py-4 text-center font-mono text-xs">
                      {task.revisionNumber || '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="outline" className="text-[10px]">
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm">Details</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {stageTasks.length === 0 && (
             <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              No tasks in this stage yet.
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
