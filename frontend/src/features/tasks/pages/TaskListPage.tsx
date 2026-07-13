import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { useTasks, useUpdateTask } from '../api/taskApi';
import { useProjects } from '@/features/projects/api/projectApi';
import { AdvancedFilterPanel, initialFilterState } from '@/features/filters/AdvancedFilterPanel';
import type { FilterState } from '@/features/filters/AdvancedFilterPanel';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, ListFilter, Plus, LayoutList, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import TaskDrawer from '../components/TaskDrawer';
import { useAuthStore } from '@/features/auth/store/authStore';

export default function TaskListPage() {
  const { data: tasks = [], isLoading } = useTasks();
  const updateTask = useUpdateTask();
  const { data: projects = [] } = useProjects();
  const { user } = useAuthStore();
  
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  const [search, setSearch] = useState(searchParams.get('q') || '');
  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Advanced filters state
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>(() => {
    const status = searchParams.get('status');
    const blocked = searchParams.get('blocked') === 'true';
    return {
      ...initialFilterState,
      statuses: status ? [status] : [],
      isBlocked: blocked
    };
  });

  const getActiveFilterCount = () => {
    return advancedFilters.statuses.length + 
           advancedFilters.priorities.length + 
           advancedFilters.assigneeIds.length + 
           advancedFilters.projectIds.length + 
           (advancedFilters.isOverdue ? 1 : 0) + 
           (advancedFilters.isBlocked ? 1 : 0);
  };

  const clearFilter = (type: keyof FilterState, value?: any) => {
    setAdvancedFilters(prev => {
      const next = { ...prev };
      if (Array.isArray(next[type]) && value) {
        (next[type] as any) = (next[type] as any[]).filter(item => item !== value);
      } else if (typeof next[type] === 'boolean') {
        (next[type] as boolean) = false;
      }
      return next;
    });
  };

  // Listen to search param changes if navigation happens within the same component
  useEffect(() => {
    const status = searchParams.get('status');
    const blocked = searchParams.get('blocked') === 'true';
    const q = searchParams.get('q');
    
    if (status || blocked || q) {
      setSearch(q || '');
      setAdvancedFilters(prev => ({
        ...prev,
        statuses: status ? [status] : [],
        isBlocked: blocked
      }));
    }
  }, [searchParams]);

  // Filter tasks based on route and permissions
  const canViewAllTasks = user?.permissions?.includes('VIEW_ALL_TASKS');
  const canCreateTask = user?.permissions?.includes('CREATE_TASK');
  const canEditTask = user?.permissions?.includes('CREATE_TASK') || user?.permissions?.includes('ASSIGN_TASK');
  const isMyTasksRoute = location.pathname.includes('/my-tasks');
  
  const visibleTasks = useMemo(() => {
    return tasks.filter((t: any) => {
      // Role permission & Route check
      // If they are on "My Tasks" route, strictly show only their tasks.
      // If they are on "Tasks" (org tasks), show only if they have VIEW_ALL_TASKS permission.
      if (isMyTasksRoute) {
        if (t.assigneeId !== user?.id) return false;
      } else {
        if (!canViewAllTasks && t.assigneeId !== user?.id) return false;
      }

      // Search query
      if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.key.toLowerCase().includes(search.toLowerCase())) return false;

      // Priorities
      if (advancedFilters.priorities.length > 0 && !advancedFilters.priorities.includes(t.priority)) return false;

      // Statuses
      if (advancedFilters.statuses.length > 0 && !advancedFilters.statuses.includes(t.status)) return false;

      // Assignees
      if (advancedFilters.assigneeIds.length > 0 && !advancedFilters.assigneeIds.includes(t.assigneeId)) return false;

      // Projects
      if (advancedFilters.projectIds.length > 0 && !advancedFilters.projectIds.includes(t.projectId)) return false;

      // Overdue filter
      if (advancedFilters.isOverdue) {
        if (!t.dueDate || t.status === 'DONE') return false;
        if (new Date(t.dueDate) >= new Date()) return false;
      }

      // Blocked (RFI) filter
      if (advancedFilters.isBlocked) {
        const hasActiveRFIs = t.rfis && t.rfis.some((b: any) => !b.isResolved);
        if (!hasActiveRFIs) return false;
      }

      return true;
    });
  }, [tasks, search, isMyTasksRoute, canViewAllTasks, user, advancedFilters]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'text-red-500';
      case 'URGENT': return 'text-amber-500';
      case 'HIGH': return 'text-orange-500';
      case 'MEDIUM': return 'text-blue-500';
      case 'LOW': return 'text-slate-500';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isMyTasksRoute ? 'My Tasks' : 'All Tasks'}</h1>
          <p className="text-muted-foreground">Manage and track your assigned work items.</p>
        </div>
        
        {canCreateTask && !isMyTasksRoute && (
          <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-soft">
            <Plus className="w-4 h-4 mr-2" />
            Create Task
          </Button>
        )}
      </div>

      <div className="flex flex-col xl:flex-row xl:items-center gap-4 bg-card p-3 rounded-lg border border-border shadow-sm">
        <div className="flex items-center gap-2 w-full xl:w-auto shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by ID or title..." 
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" className="shrink-0 shadow-sm relative" onClick={() => setIsFilterPanelOpen(true)}>
            <ListFilter className="h-4 w-4 mr-2" />
            Filters
            {getActiveFilterCount() > 0 && (
              <span className="absolute -top-2 -right-2 bg-indigo-600 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full shadow-sm font-bold">
                {getActiveFilterCount()}
              </span>
            )}
          </Button>
        </div>

        {/* Active Filter Badges */}
        {getActiveFilterCount() > 0 && (
          <div className="flex flex-wrap items-center gap-2 flex-1 pt-2 xl:pt-0 border-t xl:border-t-0 xl:border-l border-border xl:pl-4">
            <span className="text-xs font-medium text-muted-foreground mr-1">Active:</span>
            {advancedFilters.statuses.map(s => (
              <Badge key={`status-${s}`} variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 flex items-center gap-1 pr-1.5">
                Status: {s}
                <button onClick={() => clearFilter('statuses', s)} className="hover:bg-indigo-200 rounded-full p-0.5"><X className="w-3 h-3" /></button>
              </Badge>
            ))}
            {advancedFilters.priorities.map(p => (
              <Badge key={`priority-${p}`} variant="secondary" className="bg-amber-50 text-amber-700 hover:bg-amber-100 flex items-center gap-1 pr-1.5">
                Priority: {p}
                <button onClick={() => clearFilter('priorities', p)} className="hover:bg-amber-200 rounded-full p-0.5"><X className="w-3 h-3" /></button>
              </Badge>
            ))}
            {advancedFilters.assigneeIds.map(aId => {
              // We would need users list to show names, fallback to ID for now, or just hide assignee logic if complex
              return (
                <Badge key={`assignee-${aId}`} variant="secondary" className="bg-sky-50 text-sky-700 hover:bg-sky-100 flex items-center gap-1 pr-1.5">
                  Assignee ID: {aId.substring(0,6)}...
                  <button onClick={() => clearFilter('assigneeIds', aId)} className="hover:bg-sky-200 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                </Badge>
              );
            })}
            {advancedFilters.projectIds.map(pId => {
              const proj = projects.find(p => p.id === pId);
              return (
                <Badge key={`project-${pId}`} variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-100 flex items-center gap-1 pr-1.5">
                  Project: {proj?.name || pId.substring(0,6)}
                  <button onClick={() => clearFilter('projectIds', pId)} className="hover:bg-purple-200 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                </Badge>
              );
            })}
            {advancedFilters.isBlocked && (
              <Badge variant="secondary" className="bg-rose-50 text-rose-700 hover:bg-rose-100 flex items-center gap-1 pr-1.5">
                Blocked
                <button onClick={() => clearFilter('isBlocked')} className="hover:bg-rose-200 rounded-full p-0.5"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {advancedFilters.isOverdue && (
              <Badge variant="secondary" className="bg-orange-50 text-orange-700 hover:bg-orange-100 flex items-center gap-1 pr-1.5">
                Overdue
                <button onClick={() => clearFilter('isOverdue')} className="hover:bg-orange-200 rounded-full p-0.5"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            <button 
              onClick={() => setAdvancedFilters(initialFilterState)}
              className="text-xs text-muted-foreground hover:text-foreground underline ml-1 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      <div className="rounded-md border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium w-16">Key</th>
                <th className="px-6 py-4 font-medium">Title</th>
                <th className="px-6 py-4 font-medium">Project</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium">Priority</th>
                <th className="px-6 py-4 font-medium">Assignee</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-10">Loading tasks...</td></tr>
              ) : visibleTasks.map((task: any) => {
                const project = projects.find((p: any) => p.id === task.projectId);
                const assignee = task.assignee;
                
                return (
                  <tr 
                    key={task.id} 
                    className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setDrawerTaskId(task.id)}
                  >
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {task.key}
                    </td>
                    <td className="px-6 py-4 font-medium text-foreground">
                      <span className="hover:text-indigo-600 transition-colors">{task.title}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-muted-foreground">{project?.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="text-[10px]">
                        {task.status.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {canEditTask || task.assigneeId === user?.id ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <Select 
                            value={task.priority} 
                            onValueChange={(val) => updateTask.mutate({ id: task.id, priority: val as any })}
                          >
                            <SelectTrigger className={`w-[130px] h-7 text-[10px] font-semibold uppercase ${getPriorityColor(task.priority)} bg-transparent border-none focus:ring-1 focus:ring-indigo-500`}>
                              <SelectValue placeholder="Priority" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="LOW" className="text-xs font-semibold text-slate-500">LOW</SelectItem>
                              <SelectItem value="MEDIUM" className="text-xs font-semibold text-blue-500">MEDIUM</SelectItem>
                              <SelectItem value="HIGH" className="text-xs font-semibold text-orange-500">HIGH</SelectItem>
                              <SelectItem value="URGENT" className="text-xs font-semibold text-amber-500">URGENT</SelectItem>
                              <SelectItem value="CRITICAL" className="text-xs font-semibold text-red-500">CRITICAL</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : (
                        <span className={`text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">
                      {assignee?.name || 'Unassigned'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {visibleTasks.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center border-t border-border border-dashed">
            <LayoutList className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">No tasks found</h3>
            <p className="text-muted-foreground max-w-sm mt-1">You don't have any tasks matching the current criteria.</p>
          </div>
        )}
      </div>

      <TaskDrawer taskId={drawerTaskId} onClose={() => setDrawerTaskId(null)} />
      <CreateTaskModal open={isModalOpen} onOpenChange={setIsModalOpen} />
      <AdvancedFilterPanel 
        isOpen={isFilterPanelOpen} 
        onClose={() => setIsFilterPanelOpen(false)} 
        filters={advancedFilters} 
        setFilters={setAdvancedFilters}
        projects={projects}
        isBoardView={false}
      />
    </div>
  );
}
