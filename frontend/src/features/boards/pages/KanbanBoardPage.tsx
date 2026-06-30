import { useState, useMemo, useEffect } from 'react';
import { useTasks, useUpdateTaskStatus } from '@/features/tasks/api/taskApi';
import { useStages } from '@/features/stages/api/stageApi';
import { useAuthStore } from '@/features/auth/store/authStore';
import { TEAM_MEMBERS } from '@/constants/teamMembers';
import { useSocket } from '@/features/realtime/SocketProvider';
import type { TaskStatus, Task } from '@/types/core';
import { AdvancedFilterPanel, initialFilterState } from '@/features/filters/AdvancedFilterPanel';
import type { FilterState } from '@/features/filters/AdvancedFilterPanel';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type {
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, ListFilter, Plus } from 'lucide-react';
import TaskDrawer from '@/features/tasks/components/TaskDrawer';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'PENDING', title: 'PENDING' },
  { id: 'IN_PROGRESS', title: 'IN PROGRESS' },
  { id: 'INTERNAL_REVIEW', title: 'INTERNAL REVIEW' },
  { id: 'EXTERNAL_REVIEW', title: 'EXTERNAL REVIEW' },
  { id: 'MODIFICATION_REQUIRED', title: 'MODIFICATION REQ.' },
  { id: 'APPROVED', title: 'APPROVED' },
  { id: 'DONE', title: 'DONE' },
];

function SortableTaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { type: 'Task', task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const assignee = TEAM_MEMBERS.find(m => m.id === task.assigneeId);

  const priorityColors: Record<string, string> = {
    CRITICAL: 'bg-red-500/10 text-red-600',
    URGENT: 'bg-amber-500/10 text-amber-600',
    HIGH: 'bg-orange-500/10 text-orange-600',
    MEDIUM: 'bg-blue-500/10 text-blue-600',
    LOW: 'bg-slate-500/10 text-slate-600',
  };

  const getBorderColorClass = (color?: string) => {
    switch(color) {
      case 'indigo': return 'border-l-indigo-500';
      case 'blue': return 'border-l-blue-500';
      case 'orange': return 'border-l-orange-500';
      case 'emerald': return 'border-l-emerald-500';
      case 'cyan': return 'border-l-cyan-500';
      case 'pink': return 'border-l-pink-500';
      case 'violet': return 'border-l-violet-500';
      case 'yellow': return 'border-l-yellow-500';
      default: return 'border-l-transparent';
    }
  };

  if (isDragging) {
    return (
      <div ref={setNodeRef} style={style} className="opacity-30 rounded-lg bg-indigo-500/20 border-2 border-indigo-500 border-dashed h-24 w-full" />
    );
  }

  const hasActiveRFIs = task.rfis && task.rfis.some((b: any) => !b.isResolved);

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none pb-3">
      <Card 
        className={`cursor-grab active:cursor-grabbing bg-card border-y border-r border-border/50 border-l-4 ${getBorderColorClass(assignee?.color)} shadow-sm hover:shadow-md transition-all`}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <CardContent className="p-3">
          <div className="flex justify-between items-start mb-2">
            <span className="font-mono text-[10px] text-muted-foreground">{task.key}</span>
            <div className="flex gap-1.5 items-center">
              {hasActiveRFIs && (
                <span className="bg-red-500 text-white text-[8px] font-extrabold px-1 py-0.5 rounded-sm">RFI</span>
              )}
              <div className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${priorityColors[task.priority] || 'bg-muted'}`}>
                {task.priority}
              </div>
            </div>
          </div>
          <p className="text-sm font-medium text-foreground mb-3 leading-snug line-clamp-2">
            {task.title}
          </p>
          <div className="flex items-center justify-between mt-auto">
            <Badge variant="outline" className="text-[10px] font-normal bg-muted/50 border-transparent">
              {task.type}
            </Badge>
            <div className="flex items-center gap-2">
              {task.drawingNumber && (
                <span className="text-[10px] font-medium text-muted-foreground bg-background px-1.5 py-0.5 rounded-sm border border-border">
                  DWG: {task.drawingNumber}
                  {task.revisionNumber && ` (${task.revisionNumber})`}
                </span>
              )}
              {assignee && (
                <Avatar className="h-5 w-5 border border-border">
                  <AvatarImage src={assignee.avatar} />
                  <AvatarFallback className="text-[8px]">{assignee.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Column({ col, tasks, onTaskClick }: { col: { id: TaskStatus; title: string }; tasks: Task[]; onTaskClick: (id: string) => void }) {
  const { setNodeRef } = useSortable({
    id: col.id,
    data: {
      type: 'Column',
      column: col,
    },
  });

  const drawingCount = tasks.filter(t => t.drawingNumber).length;

  return (
    <div className="flex flex-col flex-shrink-0 w-80 bg-muted/30 rounded-xl border border-border/40 max-h-full">
      <div className="p-3 flex items-center justify-between border-b border-border/40">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          {col.title}
          <span className="bg-muted text-muted-foreground text-[10px] px-2 py-0.5 rounded-full font-medium">
            {tasks.length}
          </span>
          {drawingCount > 0 && (
            <span className="bg-indigo-500/10 text-indigo-600 text-[10px] px-2 py-0.5 rounded-full font-medium ml-1">
              {drawingCount} dwgs
            </span>
          )}
        </h2>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      <div ref={setNodeRef} className="flex-1 p-3 overflow-y-auto min-h-[150px]">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <SortableTaskCard key={task.id} task={task} onClick={() => onTaskClick(task.id)} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}

export default function KanbanBoardPage() {
  const { data: stages = [] } = useStages();
  const activeStageIds = useMemo(() => stages.filter((s: any) => s.status === 'ACTIVE').map((s: any) => s.id), [stages]);
  
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const { data: tasks = [], isLoading } = useTasks(stageFilter ? { stageId: stageFilter } : undefined);
  const updateTaskStatus = useUpdateTaskStatus();
  const { user } = useAuthStore();
  const { joinProject, leaveProject } = useSocket();

  useEffect(() => {
    const projectIds = Array.from(new Set(tasks.map((t: any) => t.projectId).filter(Boolean))) as string[];
    projectIds.forEach(id => joinProject(id));
    return () => {
      projectIds.forEach(id => leaveProject(id));
    };
  }, [tasks, joinProject, leaveProject]);
  
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState<string | null>(null);
  
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<FilterState>(initialFilterState);

  const filteredTasks = useMemo(() => {
    return tasks
      .filter((t: any) => {
        if (search && !t.title.toLowerCase().includes(search.toLowerCase()) && !t.key.toLowerCase().includes(search.toLowerCase())) return false;
        
        if (stageFilter) {
          if (t.stageId !== stageFilter) return false;
        } else if (advancedFilters.sprintIds.length > 0) {
          if (!advancedFilters.sprintIds.includes(t.stageId)) return false;
        } else {
          if (!activeStageIds.includes(t.stageId)) return false;
        }

        if (advancedFilters.priorities.length > 0 && !advancedFilters.priorities.includes(t.priority)) return false;

        if (assigneeFilter) {
          if (t.assigneeId !== assigneeFilter) return false;
        } else if (advancedFilters.assigneeIds.length > 0) {
          if (!t.assigneeId || !advancedFilters.assigneeIds.includes(t.assigneeId)) return false;
        }

        if (advancedFilters.projectIds.length > 0 && !advancedFilters.projectIds.includes(t.projectId)) return false;

        if (advancedFilters.isOverdue) {
          if (!t.dueDate || t.status === 'DONE') return false;
          if (new Date(t.dueDate) >= new Date()) return false;
        }

        if (advancedFilters.isBlocked) {
          const hasActiveRFIs = t.rfis && t.rfis.some((b: any) => !b.isResolved);
          if (!hasActiveRFIs) return false;
        }

        return true;
      });
  }, [tasks, search, assigneeFilter, stageFilter, activeStageIds, advancedFilters]);

  const columns = useMemo(() => COLUMNS, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const onDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'Task') {
      setActiveTask(event.active.data.current.task);
    }
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const isActiveTask = active.data.current?.type === 'Task';
    if (!isActiveTask) return;
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const isActiveTask = active.data.current?.type === 'Task';
    const isOverTask = over.data.current?.type === 'Task';
    const isOverColumn = over.data.current?.type === 'Column';

    if (user?.role !== 'PROJECT_MANAGER' && user?.role !== 'ADMIN' && activeTask?.assigneeId !== user?.id) {
      return;
    }

    if (isActiveTask) {
      if (isOverColumn) {
        updateTaskStatus.mutate({ id: activeId, status: overId });
      } else if (isOverTask) {
        const overTask = over.data.current?.task as Task;
        updateTaskStatus.mutate({ id: activeId, status: overTask.status });
      }
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Active Board</h1>
          <p className="text-muted-foreground">Manage and progress tasks for active project stages.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search board..." 
              className="pl-9 bg-background"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select className="bg-background border rounded-md text-sm px-2" value={stageFilter || ''} onChange={e => setStageFilter(e.target.value || null)}>
              <option value="">All Stages</option>
              {stages.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <Select 
              value={assigneeFilter || 'ALL'} 
              onValueChange={(val) => setAssigneeFilter(val === 'ALL' ? null : val)}
            >
              <SelectTrigger className="w-[180px] bg-background border-border">
                <SelectValue placeholder="All Members" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Members</SelectItem>
                {TEAM_MEMBERS.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="shadow-sm" onClick={() => setIsFilterPanelOpen(true)}>
              <ListFilter className="w-4 h-4 mr-2" />
              More
            </Button>
          </div>
        </div>
      </div>

      {isLoading && <div className="flex justify-center p-10">Loading board...</div>}
      {activeStageIds.length === 0 && !isLoading && (
        <div className="flex justify-center p-10 text-muted-foreground">
          No active stages found. Please activate a stage in Project view to see task board.
        </div>
      )}

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={onDragStart}
          onDragOver={onDragOver}
          onDragEnd={onDragEnd}
        >
          <div className="flex h-full gap-4 items-start">
            <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
              {columns.map(col => (
                <Column 
                  key={col.id} 
                  col={col} 
                  tasks={filteredTasks.filter(t => t.status === col.id)} 
                  onTaskClick={(id) => setDrawerTaskId(id)}
                />
              ))}
            </SortableContext>
          </div>

          <DragOverlay>
            {activeTask ? (
              <SortableTaskCard task={activeTask} onClick={() => {}} />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <TaskDrawer taskId={drawerTaskId} onClose={() => setDrawerTaskId(null)} />
      <AdvancedFilterPanel 
        isOpen={isFilterPanelOpen} 
        onClose={() => setIsFilterPanelOpen(false)} 
        filters={advancedFilters} 
        setFilters={setAdvancedFilters} 
        sprints={stages}
        isBoardView={true}
      />
    </div>
  );
}
