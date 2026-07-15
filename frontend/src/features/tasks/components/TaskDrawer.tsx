import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTask, useUpdateTaskStatus, useUpdateTask, useAddSubtask, useUpdateSubtask, useArchiveTask, useRestoreTask, useDeleteTask, useResolveRFI, useRaiseRFI } from '../api/taskApi';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { TEAM_MEMBERS } from '@/constants/teamMembers';
import { useTeam } from '@/features/team/api/teamApi';
import { 
  Sheet, 
  SheetContent, 
  SheetTitle,
} from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { 
  MessageSquare, 
  Paperclip, 
  Activity, 
  CheckCircle2, 
  AlertTriangle,
  Plus,
  ListTodo,
  MoreVertical,
  Trash,
  Archive,
  RefreshCw,
  CheckCircle,
  X,
  Edit,
  Edit2
} from 'lucide-react';
import TaskComments from './TaskComments';
import TaskActivityTimeline from './TaskActivityTimeline';
import TaskAttachments from './TaskAttachments';
import { CreateDiscussionModal } from '@/features/chat/components/CreateDiscussionModal';
import { EditTaskModal } from './EditTaskModal';

interface TaskDrawerProps {
  taskId: string | null;
  onClose: () => void;
}

export default function TaskDrawer({ taskId, onClose }: TaskDrawerProps) {
  const { data: task, isLoading } = useTask(taskId);
  const updateTaskStatus = useUpdateTaskStatus();
  const updateTask = useUpdateTask();
  const addSubtask = useAddSubtask();
  const updateSubtask = useUpdateSubtask();
  const archiveTask = useArchiveTask();
  const restoreTask = useRestoreTask();
  const deleteTask = useDeleteTask();
  const resolveRFI = useResolveRFI();
  const raiseRFI = useRaiseRFI();
  
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { data: teamMembers = [] } = useTeam();
  
  const [newSubtask, setNewSubtask] = useState('');
  const [activeTab, setActiveTab] = useState<'comments' | 'history' | 'standups'>('comments');
  const [resolutionNote, setResolutionNote] = useState('');
  const [showResolveInput, setShowResolveInput] = useState(false);
  const [rfiDescription, setRfiDescription] = useState('');
  const [showRaiseRFIInput, setShowRaiseRFIInput] = useState(false);
  const [showDiscussionModal, setShowDiscussionModal] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  if (!taskId) return null;
  if (isLoading) return <Sheet open={!!taskId} onOpenChange={(open) => !open && onClose()}><SheetContent><div className="p-10 text-center">Loading task details...</div></SheetContent></Sheet>;
  if (!task) return null;

  const project = task.project;
  const target = task.target;
  const assignee = task.assignee;
  const reporter = task.creator;
  const rfi = task.rfis?.find((b: any) => !b.isResolved);

  const canEdit = user?.permissions?.includes('CREATE_TASK') || user?.permissions?.includes('ASSIGN_TASK') || user?.id === task.assigneeId;

  // Removed native handleStatusChange

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    addSubtask.mutate({ taskId, title: newSubtask }, {
      onSuccess: () => setNewSubtask('')
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'URGENT': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
      case 'HIGH': return 'bg-orange-500/10 text-orange-600 border-orange-500/20';
      case 'MEDIUM': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'LOW': return 'bg-slate-500/10 text-slate-600 border-slate-500/20';
      default: return '';
    }
  };

  return (
    <Sheet open={!!taskId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="sm:max-w-xl md:max-w-3xl w-full overflow-y-auto p-0 border-l border-border bg-background shadow-2xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-border/50 sticky top-0 bg-background/95 backdrop-blur-sm z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="hover:underline cursor-pointer">{project?.key}</span>
                <span>/</span>
                <span className="font-mono">{task.key}</span>
              </div>
              <div className="flex items-center gap-2">
                {task.isArchived && (
                  <Badge variant="secondary" className="bg-slate-200 text-slate-700">Archived</Badge>
                )}
                {canEdit ? (
                  <Select 
                    value={task.priority} 
                    onValueChange={(val) => updateTask.mutate({ id: task.id, priority: val as any })}
                  >
                    <SelectTrigger className={`w-fit h-6 text-xs px-2 py-0 border font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
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
                ) : (
                  <Badge variant="outline" className={getPriorityColor(task.priority)}>
                    {task.priority}
                  </Badge>
                )}
                
                {(user?.permissions?.includes('DELETE_TASK')) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {canEdit && (
                        <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                          <Edit2 className="mr-2 h-4 w-4" /> Edit Task
                        </DropdownMenuItem>
                      )}
                      {!task.isArchived ? (
                        <DropdownMenuItem onClick={() => {
                          if (confirm('Archive this task?')) {
                            archiveTask.mutate(task.id, { onSuccess: () => { toast({ title: 'Task archived' }); onClose(); }});
                          }
                        }}>
                          <Archive className="mr-2 h-4 w-4" /> Archive Task
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => {
                          restoreTask.mutate(task.id, { onSuccess: () => toast({ title: 'Task restored' }) });
                        }}>
                          <RefreshCw className="mr-2 h-4 w-4" /> Restore Task
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-red-600 focus:bg-red-50 focus:text-red-700" onClick={() => {
                        if (confirm('Are you sure you want to delete this task? This will remove board visibility, target linkage, and analytics contribution.')) {
                          deleteTask.mutate(task.id, { onSuccess: () => { toast({ title: 'Task deleted' }); onClose(); }});
                        }
                      }}>
                        <Trash className="mr-2 h-4 w-4" /> Delete Task
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 ml-1 rounded-full text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            <SheetTitle className="text-2xl font-bold leading-tight mb-4">
              {task.title}
            </SheetTitle>
            
            <div className="flex items-center gap-4">
              {canEdit ? (
                <Select 
                  value={task.status} 
                  onValueChange={(val) => updateTaskStatus.mutate({ id: task.id, status: val })}
                >
                  <SelectTrigger className="w-[200px] h-8 text-xs font-medium">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">PENDING</SelectItem>
                    <SelectItem value="IN_PROGRESS">IN PROGRESS</SelectItem>
                    <SelectItem value="INTERNAL_REVIEW">INTERNAL REVIEW</SelectItem>
                    <SelectItem value="EXTERNAL_REVIEW">EXTERNAL REVIEW</SelectItem>
                    <SelectItem value="MODIFICATION_REQUIRED">MODIFICATION REQUIRED</SelectItem>
                    <SelectItem value="APPROVED">APPROVED</SelectItem>
                    <SelectItem value="DONE">DONE</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant={task.status === 'DONE' ? 'default' : 'secondary'} className={task.status === 'DONE' ? 'bg-emerald-500' : ''}>
                  {task.status.replace('_', ' ')}
                </Badge>
              )}
              
              {task.drawingNumber && (
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2 py-1.5 rounded-md border border-border">
                  <span className="font-semibold text-indigo-500">DWG:</span>
                  {task.drawingNumber}
                  {task.revisionNumber && (
                    <>
                      <span className="text-muted-foreground">|</span>
                      <span className="font-semibold text-indigo-500">REV:</span>
                      {task.revisionNumber}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 p-6 flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-8 min-w-0">
              
              {/* Description */}
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-3">Description</h3>
                <div className="text-sm text-foreground/90 leading-relaxed p-4 bg-muted/20 rounded-lg border border-border/50 whitespace-pre-wrap">
                  {task.description || <span className="text-muted-foreground italic">No description provided.</span>}
                </div>
              </section>

              {/* Acceptance Criteria */}
              {task.acceptanceCriteria && (
                <section>
                  <h3 className="text-sm font-semibold text-foreground mb-3">Acceptance Criteria</h3>
                  <div className="text-sm text-foreground/90 leading-relaxed p-4 bg-muted/20 rounded-lg border border-border/50 whitespace-pre-wrap">
                    {task.acceptanceCriteria}
                  </div>
                </section>
              )}

              {/* Subtasks */}
              <section>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center">
                  <ListTodo className="w-4 h-4 mr-2" /> Subtasks
                </h3>
                <div className="space-y-2">
                  {task.subtasks?.map((st: any) => (
                    <div key={st.id} className="flex items-center gap-3 p-2 hover:bg-muted/30 rounded-md group">
                      <input 
                        type="checkbox" 
                        checked={st.isCompleted} 
                        onChange={(e) => updateSubtask.mutate({ id: st.id, isCompleted: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        disabled={!canEdit}
                      />
                      <span className={`text-sm flex-1 ${st.isCompleted ? 'line-through text-muted-foreground' : ''}`}>{st.title}</span>
                    </div>
                  ))}
                  
                  {canEdit && (
                    <form onSubmit={handleAddSubtask} className="flex items-center gap-2 mt-2">
                      <Input 
                        placeholder="What needs to be done?" 
                        value={newSubtask} 
                        onChange={e => setNewSubtask(e.target.value)}
                        className="h-8 text-sm"
                      />
                      <Button type="submit" size="sm" variant="outline" className="h-8 px-2" disabled={!newSubtask.trim()}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </form>
                  )}
                </div>
              </section>

              {/* RFI Alert (was Blocker Alert) */}
              {rfi && (
                <section>
                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">RFI Raised: {rfi.type.replace('_', ' ')}</h4>
                        <p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1 mb-2">{rfi.description}</p>
                        
                        {(user?.permissions?.includes('RESOLVE_RFI')) && (
                          <div className="mt-3 border-t border-red-500/20 pt-3">
                            {!showResolveInput ? (
                              <Button size="sm" variant="outline" className="border-red-500 text-red-600 hover:bg-red-500 hover:text-white" onClick={() => setShowResolveInput(true)}>
                                Resolve RFI
                              </Button>
                            ) : (
                              <div className="flex gap-2 items-center">
                                <Input 
                                  placeholder="Add resolution note..." 
                                  value={resolutionNote}
                                  onChange={(e) => setResolutionNote(e.target.value)}
                                  className="h-8 text-sm"
                                />
                                <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white h-8" onClick={() => {
                                  resolveRFI.mutate({ taskId: task.id, blockerId: rfi.id, resolutionNote }, {
                                    onSuccess: () => {
                                      toast({ title: 'RFI Resolved' });
                                      setShowResolveInput(false);
                                    }
                                  });
                                }}>
                                  Resolve
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Tabs for Comments / Activity / Progress Reports */}
              <section className="pt-4 border-t border-border/50">
                <div className="flex border-b mb-4">
                  <button 
                    onClick={() => setActiveTab('comments')}
                    className={`px-4 py-2 border-b-2 font-medium text-sm ${activeTab === 'comments' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                  >
                    Comments ({task.comments?.length || 0})
                  </button>
                  <button 
                    onClick={() => setActiveTab('history')}
                    className={`px-4 py-2 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                  >
                    History
                  </button>
                  <button 
                    onClick={() => setActiveTab('standups')}
                    className={`px-4 py-2 border-b-2 font-medium text-sm ${activeTab === 'standups' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
                  >
                    Progress Reports ({task.progressReports?.length || 0})
                  </button>
                </div>
                
                {activeTab === 'comments' && (
                  <TaskComments taskId={task.id} comments={task.comments || []} />
                )}
                
                {activeTab === 'history' && (
                  <TaskActivityTimeline activities={task.activities || []} />
                )}
                
                {activeTab === 'standups' && (
                  <div className="space-y-4">
                    {task.progressReports?.length === 0 && <div className="text-sm text-muted-foreground py-4">No progress reports linked to this task.</div>}
                    {task.progressReports?.map((s: any) => (
                      <div key={s.id} className="p-4 rounded-lg border border-border bg-muted/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={s.user?.avatar} />
                            <AvatarFallback>{s.user?.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{s.user?.name}</span>
                          <span className="text-xs text-muted-foreground ml-auto">{new Date(s.date).toLocaleDateString()}</span>
                        </div>
                        <div className="text-sm space-y-2">
                          <p><span className="font-semibold">Yesterday:</span> {s.yesterday}</p>
                          <p><span className="font-semibold">Today:</span> {s.today}</p>
                          {s.blockers && <p className="text-red-600"><span className="font-semibold">RFIs/Blockers:</span> {s.blockers}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Sidebar Details */}
            <div className="w-full md:w-64 space-y-6 shrink-0">
              <section className="p-4 rounded-lg border border-border/50 bg-card/50">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Details</h4>
                
                <div className="space-y-5">
                  <div>
                    <span className="text-xs text-muted-foreground block mb-1.5">Assignee</span>
                    {canEdit ? (
                      <Select 
                        value={task.assigneeId || "none"} 
                        onValueChange={(val) => updateTask.mutate({ id: task.id, assigneeId: val === "none" ? null : val })}
                      >
                        <SelectTrigger className="w-full h-9 border-none bg-muted/30 shadow-none px-2 focus:ring-1 focus:ring-indigo-500">
                          <SelectValue placeholder="Unassigned" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">
                            <span className="text-muted-foreground italic">Unassigned</span>
                          </SelectItem>
                          {teamMembers.map((m: any) => (
                            <SelectItem key={m.id} value={m.id}>
                              <div className="flex items-center gap-2">
                                <Avatar className="w-5 h-5">
                                  <AvatarImage src={m.avatar} />
                                  <AvatarFallback className="text-[10px]">{m.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                {m.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="flex items-center gap-2 px-2 py-1.5">
                        {assignee ? (
                          <>
                            <Avatar className={`w-6 h-6 border ${assignee.color ? `border-${assignee.color}-500` : 'border-border'}`}>
                              <AvatarImage src={assignee.avatar} />
                              <AvatarFallback className="text-[10px]">{assignee.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{assignee.name}</span>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground italic">Unassigned</span>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <span className="text-xs text-muted-foreground block mb-1.5">Reporter</span>
                    <div className="flex items-center gap-2">
                      {reporter ? (
                        <>
                          <Avatar className="w-6 h-6 border border-border">
                            <AvatarImage src={reporter.avatar} />
                            <AvatarFallback className="text-[10px]">{reporter.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{reporter.name}</span>
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">System</span>
                      )}
                    </div>
                  </div>

                  {target && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1.5">Target</span>
                      <Link to={`/dashboard/targets/${target.id}`} className="text-sm font-medium text-indigo-500 hover:underline">
                        {target.name}
                      </Link>
                    </div>
                  )}

                  {task.taskCategory && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1.5">Task</span>
                      <span className="text-sm font-medium capitalize">{task.taskCategory.toLowerCase()}</span>
                    </div>
                  )}

                  {task.type && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1.5">Task Type</span>
                      <span className="text-sm font-medium capitalize">{task.type.replace(/_/g, ' ').toLowerCase()}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1.5">Est. Hours</span>
                      {user?.permissions?.includes('CREATE_TASK') || user?.permissions?.includes('ASSIGN_TASK') ? (
                        <Input 
                          type="number" 
                          step="0.5" 
                          min="0" 
                          className="h-8 text-sm"
                          defaultValue={task.estimatedHours || ''}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val !== String(task.estimatedHours || '')) {
                              updateTask.mutate({ id: task.id, estimatedHours: val ? parseFloat(val) : null });
                            }
                          }}
                        />
                      ) : (
                        <span className="text-sm font-medium">{task.estimatedHours || '-'}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1.5">Actual Hours</span>
                      {canEdit ? (
                        <Input 
                          type="number" 
                          step="0.5" 
                          min="0" 
                          className="h-8 text-sm"
                          defaultValue={task.actualHours || ''}
                          onBlur={(e) => {
                            const val = e.target.value;
                            if (val !== String(task.actualHours || '')) {
                              updateTask.mutate({ id: task.id, actualHours: val ? parseFloat(val) : null });
                            }
                          }}
                        />
                      ) : (
                        <span className="text-sm font-medium">{task.actualHours || '-'}</span>
                      )}
                    </div>
                  </div>

                  {task.dueDate && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1.5">Due Date</span>
                      <span className="text-sm font-medium">{new Date(task.dueDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  
                  {task.completedAt && (user?.permissions?.includes('VIEW_ALL_TASKS')) && (
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-xs text-muted-foreground block mb-1.5">Completed On</span>
                      <span className="text-sm font-medium block">{new Date(task.completedAt).toLocaleDateString()} {new Date(task.completedAt).toLocaleTimeString()}</span>
                      <span className="text-xs text-muted-foreground mt-1 block">By: {TEAM_MEMBERS.find(m => m.id === task.completedById)?.name || 'System'}</span>
                    </div>
                  )}

                  {task.labels && task.labels.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground block mb-1.5">Labels</span>
                      <div className="flex flex-wrap gap-1">
                        {task.labels.map((l: string) => (
                          <Badge key={l} variant="secondary" className="text-[10px]">{l}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-border/50">
                    <span className="text-xs text-muted-foreground block mb-2">Actions</span>
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:hover:text-indigo-300 dark:hover:bg-indigo-500/10 dark:border-indigo-500/20 transition-all"
                        onClick={() => setShowDiscussionModal(true)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Open in Chat
                      </Button>
                      {canEdit && !rfi && task.status !== 'DONE' && (
                        <>
                          {showRaiseRFIInput ? (
                            <div className="bg-rose-50/50 p-3 rounded-lg border border-rose-200 space-y-2">
                              <span className="text-xs font-semibold text-rose-700">Describe RFI</span>
                              <Input 
                                value={rfiDescription} 
                                onChange={e => setRfiDescription(e.target.value)} 
                                placeholder="What information is needed?" 
                                className="h-8 text-sm bg-white border-rose-200" 
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setShowRaiseRFIInput(false)}>Cancel</Button>
                                <Button 
                                  size="sm" 
                                  className="h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white" 
                                  onClick={() => {
                                    if(rfiDescription) {
                                      raiseRFI.mutate({ taskId: task.id, description: rfiDescription }, {
                                        onSuccess: () => {
                                          setShowRaiseRFIInput(false);
                                          setRfiDescription('');
                                          toast({ title: 'RFI Raised Successfully' });
                                        }
                                      });
                                    }
                                  }}
                                >
                                  Submit
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200 dark:hover:bg-rose-500/10 dark:border-rose-500/20 transition-all"
                              onClick={() => setShowRaiseRFIInput(true)}
                            >
                              <AlertTriangle className="w-4 h-4 mr-2" />
                              Raise RFI
                            </Button>
                          )}
                        </>
                      )}
                      
                      {canEdit && task.status !== 'DONE' && (
                        <Button 
                           variant="outline" 
                           size="sm" 
                           className="w-full justify-start text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200 dark:hover:bg-emerald-500/10 dark:border-emerald-500/20 transition-all"
                           onClick={() => {
                             updateTaskStatus.mutate({ id: task.id, status: 'DONE' }, {
                               onSuccess: () => {
                                 toast({
                                   title: "Task Completed",
                                   description: `${task.key} has been marked as done.`
                                 });
                                 onClose();
                               }
                             });
                           }}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Mark as Done
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-border/50">
                    <TaskAttachments taskId={task.id} attachments={task.attachments} />
                  </div>
                  
                </div>
              </section>
            </div>
          </div>
        </div>
      </SheetContent>
      {showDiscussionModal && (
        <CreateDiscussionModal 
          isOpen={showDiscussionModal} 
          onClose={() => setShowDiscussionModal(false)} 
          task={task} 
        />
      )}
      <EditTaskModal 
        open={isEditModalOpen} 
        onOpenChange={setIsEditModalOpen} 
        task={task} 
      />
    </Sheet>
  );
}
