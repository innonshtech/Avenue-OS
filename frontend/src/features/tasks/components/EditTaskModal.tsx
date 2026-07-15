import { useState, useEffect } from 'react';
import { useUpdateTask } from '../api/taskApi';
import { useToast } from '@/hooks/use-toast';
import { useTargets } from '@/features/targets/api/targetApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useTeam } from '@/features/team/api/teamApi';
import { EnterpriseDatePicker } from '@/components/EnterpriseDatePicker';

interface EditTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  task: any;
}

export function EditTaskModal({ open, onOpenChange, task }: EditTaskModalProps) {
  const { user } = useAuthStore();
  const updateTask = useUpdateTask();
  const { toast } = useToast();
  const { data: teamMembers = [] } = useTeam();
  const { data: targets = [] } = useTargets(task?.projectId);

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [taskCategory, setTaskCategory] = useState(task?.taskCategory || 'DESIGN');
  const [type, setType] = useState(task?.type || 'MODELING');
  const [priority, setPriority] = useState(task?.priority || 'MEDIUM');
  const [estimatedHours, setEstimatedHours] = useState(task?.estimatedHours?.toString() || '');
  const [targetId, setTargetId] = useState(task?.targetId || 'none');
  const [assigneeId, setAssigneeId] = useState(task?.assigneeId || 'none');
  const [drawingNumber, setDrawingNumber] = useState(task?.drawingNumber || '');
  const [revisionNumber, setRevisionNumber] = useState(task?.revisionNumber || '');
  const [acceptanceCriteria, setAcceptanceCriteria] = useState(task?.acceptanceCriteria || '');
  const [dueDate, setDueDate] = useState(task?.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
  const [startDate, setStartDate] = useState(task?.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '');

  useEffect(() => {
    if (open && task) {
      /* eslint-disable react-hooks/set-state-in-effect */
      setTitle(task.title || '');
      setDescription(task.description || '');
      setTaskCategory(task.taskCategory || 'DESIGN');
      setType(task.type || 'MODELING');
      setPriority(task.priority || 'MEDIUM');
      setEstimatedHours(task.estimatedHours?.toString() || '');
      setTargetId(task.targetId || 'none');
      setAssigneeId(task.assigneeId || 'none');
      setDrawingNumber(task.drawingNumber || '');
      setRevisionNumber(task.revisionNumber || '');
      setAcceptanceCriteria(task.acceptanceCriteria || '');
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
      setStartDate(task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : '');
      /* eslint-enable react-hooks/set-state-in-effect */
    }
  }, [open, task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    
    try {
      await updateTask.mutateAsync({
        id: task.id,
        title,
        description: description || null,
        taskCategory,
        type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        priority: priority as any,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
        drawingNumber: drawingNumber || null,
        revisionNumber: revisionNumber || null,
        targetId: targetId !== 'none' ? targetId : null,
        assigneeId: assigneeId !== 'none' ? assigneeId : null,
        acceptanceCriteria: acceptanceCriteria || null,
        dueDate: dueDate || null,
        startDate: startDate || null,
      });
      
      toast({
        title: "Task Updated",
        description: "Task updated successfully.",
      });
      onOpenChange(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const errData = error.response?.data;
      const errMsg = String(errData?.errors?.[0]?.message || errData?.message || errData?.error || "An unexpected error occurred.");
      toast({
        variant: "destructive",
        title: "Error updating task",
        description: errMsg,
      });
    }
  };

  if (!task) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input id="edit-title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Task title..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-target">Target</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Backlog (No Target)</SelectItem>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {targets.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-assignee">Assignee</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {teamMembers.map((m: any) => (
                    <SelectItem key={m.id} value={m.id}>{m.name} ({m.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-taskCategory">Task</Label>
              <Select value={taskCategory} onValueChange={setTaskCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DESIGN">Design</SelectItem>
                  <SelectItem value="DRAFTING">Drafting</SelectItem>
                  <SelectItem value="STUDY">Study</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-type">Task Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MODELING">Modeling</SelectItem>
                  <SelectItem value="ANALYSIS">Analysis</SelectItem>
                  <SelectItem value="SITE_CHECK">Site Check</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {user && (user.permissions?.includes('CREATE_TASK') || user.permissions?.includes('ASSIGN_TASK')) && (
              <div className="space-y-2">
                <Label htmlFor="edit-estimatedHours">Est. Hours</Label>
                <Input id="edit-estimatedHours" type="number" step="0.5" min="0" value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)} placeholder="e.g. 5.5" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="edit-drawingNumber">Drawing Number</Label>
              <Input id="edit-drawingNumber" value={drawingNumber} onChange={e => setDrawingNumber(e.target.value)} placeholder="e.g. D-101" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-revisionNumber">Revision Number</Label>
              <Input id="edit-revisionNumber" value={revisionNumber} onChange={e => setRevisionNumber(e.target.value)} placeholder="e.g. R0" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <EnterpriseDatePicker id="edit-startDate" label="Start Date" value={startDate} onChange={e => setStartDate(e.target.value)} min="1900-01-01" />
            <EnterpriseDatePicker id="edit-dueDate" label="Due Date" value={dueDate} onChange={e => setDueDate(e.target.value)} min="1900-01-01" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-desc">Description</Label>
            <Textarea id="edit-desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide task details, drawing specs, etc." className="min-h-[100px]" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-acceptance">Acceptance Criteria</Label>
            <Textarea id="edit-acceptance" value={acceptanceCriteria} onChange={e => setAcceptanceCriteria(e.target.value)} placeholder="Criteria to mark as done..." className="min-h-[80px]" />
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={updateTask.isPending}>
              {updateTask.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
