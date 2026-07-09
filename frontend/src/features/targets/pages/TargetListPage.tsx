import { useState } from 'react';
import { useTargets } from '../api/targetApi';
import { useTasks } from '@/features/tasks/api/taskApi';
import { CreateTargetModal } from '../components/CreateTargetModal';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, BarChart3, AlertCircle } from 'lucide-react';

export default function TargetListPage() {
  const { data: targets = [], isLoading } = useTargets();
  const { data: tasks = [] } = useTasks();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeTargets = targets.filter(s => s.status === 'ACTIVE');
  const otherTargets = targets.filter(s => s.status !== 'ACTIVE');

  // Helper to count active RFIs for a target
  const getTargetRFICount = (targetId: string) => {
    const targetTasks = tasks.filter((t: any) => t.targetId === targetId);
    const targetRFIs = targetTasks.flatMap((t: any) => t.rfis || []);
    return targetRFIs.filter((b: any) => !b.isResolved).length;
  };

  const renderTargetCard = (target: any, isActive = false) => {
    const project = target.project;
    
    return (
      <Link key={target.id} to={`/dashboard/targets/${target.id}`} className="block group outline-none">
        <Card className={`h-full transition-all duration-200 shadow-soft hover:shadow-md ${isActive ? 'bg-indigo-500/5 border-indigo-500/30' : 'bg-card border-muted hover:border-indigo-500/30 group-focus-visible:ring-2 ring-indigo-500'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs">{project?.key}</Badge>
                {getTargetRFICount(target.id) > 0 && (
                  <Badge variant="destructive" className="bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-500/20 text-[10px] px-1.5 py-0">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {getTargetRFICount(target.id)} RFI{getTargetRFICount(target.id) !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              <Badge variant="outline" className={
                target.status === 'ACTIVE' ? 'bg-emerald-500 text-white hover:bg-emerald-600 border-transparent font-bold tracking-wider' : 
                target.status === 'COMPLETED' ? 'bg-slate-500 text-white hover:bg-slate-600 border-transparent font-bold tracking-wider' : 
                'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800 font-bold tracking-wider'
              }>
                {target.status}
              </Badge>
            </div>
            <CardTitle className="text-xl group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{target.name}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1 font-medium">{target.goal || "No specific goal set for this target."}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 mt-2">
              <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="w-3.5 h-3.5 mr-2 text-foreground/70" />
                <span>{new Date(target.startDate).toLocaleDateString()} &mdash; {new Date(target.endDate).toLocaleDateString()}</span>
              </div>
              {isActive && (
                <div className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center text-emerald-500">
                    <BarChart3 className="w-3.5 h-3.5 mr-1.5" />
                    Target in progress
                  </div>
                  <span className="flex items-center text-amber-500">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    Ends in {Math.max(0, Math.ceil((new Date(target.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Targets</h1>
          <p className="text-muted-foreground">Track ongoing and planned target executions.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-soft">
          New Target
        </Button>
      </div>

      {isLoading && <div className="flex justify-center p-10">Loading targets...</div>}

      {activeTargets.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-4 flex items-center text-foreground">
            <span className="relative flex h-3 w-3 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>
            Active Targets
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {activeTargets.map(s => renderTargetCard(s, true))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4 flex items-center text-foreground">
          Other Targets
        </h2>
        {otherTargets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {otherTargets.map(s => renderTargetCard(s, false))}
          </div>
        ) : (
          <div className="flex items-center justify-center py-10 bg-card border border-dashed border-border rounded-lg text-muted-foreground text-sm">
            <AlertCircle className="w-4 h-4 mr-2" />
            No other targets found.
          </div>
        )}
      </section>

      <CreateTargetModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </div>
  );
}
