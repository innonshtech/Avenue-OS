import React, { useState, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import { useSprints } from '@/features/sprints/api/sprintApi';
import { useTasks } from '@/features/tasks/api/taskApi';
import { useProjects } from '@/features/projects/api/projectApi';
import { useAuthStore } from '@/features/auth/store/authStore';
import { TEAM_MEMBERS } from '@/constants/teamMembers';
import TaskDrawer from '@/features/tasks/components/TaskDrawer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, User, AlertCircle, CheckCircle } from 'lucide-react';

export const SprintCalendar: React.FC = () => {
  const { data: sprints = [] } = useSprints();
  const { data: tasks = [] } = useTasks();
  const { data: projects = [] } = useProjects();
  const { user: currentUser } = useAuthStore();

  const [showTasks, setShowTasks] = useState(true);
  const [showSprints, setShowSprints] = useState(true);
  const [onlyMyTasks, setOnlyMyTasks] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null);

  // Map database elements to FullCalendar events
  const calendarEvents = useMemo(() => {
    const events: any[] = [];

    // 1. Sprints mapping
    if (showSprints) {
      sprints.forEach((sprint: any) => {
        let color = '#4f46e5'; // Indigo for active
        if (sprint.status === 'PLANNED') color = '#0ea5e9'; // Light Blue
        if (sprint.status === 'COMPLETED') color = '#10b981'; // Emerald

        events.push({
          id: `sprint-${sprint.id}`,
          title: `🏃 SPRINT: ${sprint.name}`,
          start: sprint.startDate,
          end: sprint.endDate,
          allDay: true,
          backgroundColor: color,
          borderColor: 'transparent',
          textColor: '#ffffff',
          extendedProps: {
            type: 'sprint',
            status: sprint.status,
            goal: sprint.goal,
            projectId: sprint.projectId
          }
        });
      });
    }

    // 2. Tasks mapping
    if (showTasks) {
      tasks.forEach((task: any) => {
        // Filter "Only My Tasks"
        if (onlyMyTasks && task.assigneeId !== currentUser?.id) return;

        // Determine priority/status colors
        const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'DONE';
        let color = '#64748b'; // Slate for Todo/Default

        if (task.status === 'DONE') color = '#10b981'; // Green
        else if (task.status === 'IN_REVIEW') color = '#f59e0b'; // Yellow/Orange
        else if (task.status === 'BLOCKED' || isOverdue) color = '#ef4444'; // Red
        else if (task.status === 'IN_PROGRESS') color = '#3b82f6'; // Blue

        events.push({
          id: `task-${task.id}`,
          title: `📝 [${task.key}] ${task.title}`,
          start: task.startDate || task.dueDate,
          end: task.dueDate,
          allDay: true,
          backgroundColor: color,
          borderColor: 'transparent',
          textColor: '#ffffff',
          extendedProps: {
            type: 'task',
            status: task.status,
            priority: task.priority,
            assigneeId: task.assigneeId,
            projectId: task.projectId,
            storyPoints: task.storyPoints,
            isOverdue
          }
        });
      });
    }

    return events;
  }, [sprints, tasks, showTasks, showSprints, onlyMyTasks, currentUser]);

  const handleEventClick = (info: any) => {
    const props = info.event.extendedProps;
    const id = info.event.id.replace('sprint-', '').replace('task-', '');
    
    setSelectedEvent({
      id,
      title: info.event.title,
      start: info.event.start,
      end: info.event.end,
      ...props
    });
  };

  const selectedProjectName = useMemo(() => {
    if (!selectedEvent?.projectId) return null;
    const proj = projects.find((p: any) => p.id === selectedEvent.projectId);
    return proj?.name || 'Backlog';
  }, [selectedEvent, projects]);

  const selectedAssignee = useMemo(() => {
    if (!selectedEvent?.assigneeId) return null;
    return TEAM_MEMBERS.find((m) => m.id === selectedEvent.assigneeId);
  }, [selectedEvent]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 select-none">
      {/* Filters & Detail Card */}
      <div className="lg:col-span-1 space-y-6">
        {/* Filters panel */}
        <Card className="bg-zinc-950 border-zinc-800 text-white shadow-xl">
          <CardHeader className="pb-3 border-b border-zinc-900">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-indigo-500" />
              Calendar Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-semibold">Show Sprints</span>
              <button
                onClick={() => setShowSprints(!showSprints)}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  showSprints ? 'bg-indigo-600' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    showSprints ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400 font-semibold">Show Tasks</span>
              <button
                onClick={() => setShowTasks(!showTasks)}
                className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  showTasks ? 'bg-indigo-600' : 'bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    showTasks ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {showTasks && (
              <div className="flex items-center justify-between border-t border-zinc-900 pt-3">
                <span className="text-xs text-zinc-400 font-semibold">Only My Tasks</span>
                <button
                  onClick={() => setOnlyMyTasks(!onlyMyTasks)}
                  className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    onlyMyTasks ? 'bg-indigo-600' : 'bg-zinc-800'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      onlyMyTasks ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Selected event details card */}
        {selectedEvent ? (
          <Card className="bg-zinc-950 border-zinc-800 text-white shadow-xl animate-in fade-in duration-200">
            <CardHeader className="pb-3 border-b border-zinc-900 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-bold">Schedule Details</CardTitle>
              <button onClick={() => setSelectedEvent(null)} className="text-zinc-500 hover:text-white text-xs font-bold">
                Clear
              </button>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Title</p>
                <h4 className="text-sm font-bold text-zinc-200 leading-snug">{selectedEvent.title}</h4>
              </div>

              {selectedEvent.type === 'sprint' && (
                <>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Status</p>
                    <Badge variant={selectedEvent.status === 'ACTIVE' ? 'default' : 'secondary'} className={selectedEvent.status === 'ACTIVE' ? 'bg-indigo-600 text-white' : ''}>
                      {selectedEvent.status}
                    </Badge>
                  </div>
                  {selectedEvent.goal && (
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Sprint Goal</p>
                      <p className="text-xs text-zinc-400 leading-relaxed">{selectedEvent.goal}</p>
                    </div>
                  )}
                </>
              )}

              {selectedEvent.type === 'task' && (
                <>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Status</p>
                      <Badge variant="outline" className="border-zinc-800 text-zinc-300">
                        {selectedEvent.status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Priority</p>
                      <Badge variant="outline" className="border-zinc-800 text-zinc-300">
                        {selectedEvent.priority}
                      </Badge>
                    </div>
                  </div>

                  {selectedAssignee && (
                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Assignee</p>
                      <div className="flex items-center gap-2">
                        <img src={selectedAssignee.avatar} alt={selectedAssignee.name} className="w-5 h-5 rounded-full border border-zinc-800" />
                        <span className="text-xs text-zinc-300 font-semibold">{selectedAssignee.name}</span>
                      </div>
                    </div>
                  )}

                  {selectedEvent.isOverdue && (
                    <div className="flex items-center gap-1.5 p-2 bg-red-950/20 border border-red-900/30 rounded-lg text-red-400 text-xs">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>This task is overdue!</span>
                    </div>
                  )}

                  <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg mt-2 shadow-md"
                    onClick={() => setDrawerTaskId(selectedEvent.id)}
                  >
                    Open Task Drawer
                  </Button>
                </>
              )}

              <div className="border-t border-zinc-900 pt-3 flex flex-col gap-1.5 text-xs text-zinc-400 font-medium">
                {selectedProjectName && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Project: {selectedProjectName}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>
                    {new Date(selectedEvent.start).toLocaleDateString()}
                    {selectedEvent.end && ` - ${new Date(selectedEvent.end).toLocaleDateString()}`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-zinc-950/40 border border-zinc-900/60 text-zinc-500 text-center py-12 rounded-xl">
            <CalendarIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-xs font-medium">Click any calendar event to inspect task priorities and deadlines.</p>
          </Card>
        )}
      </div>

      {/* Main Calendar View */}
      <div className="lg:col-span-3 bg-zinc-950 border border-zinc-800 rounded-2xl p-4 shadow-xl select-text">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin]}
          initialView="dayGridMonth"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          events={calendarEvents}
          eventClick={handleEventClick}
          height="650px"
          aspectRatio={1.35}
          eventDisplay="block"
          dayMaxEvents={3}
        />
      </div>

      {/* Interactive Detail Drawer */}
      <TaskDrawer taskId={drawerTaskId} onClose={() => setDrawerTaskId(null)} />
    </div>
  );
};

export default SprintCalendar;
