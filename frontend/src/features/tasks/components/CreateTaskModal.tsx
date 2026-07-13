import { useState, useEffect, useRef } from 'react';
import { useCreateTask, useAddAttachment } from '../api/taskApi';
import { useToast } from '@/hooks/use-toast';
import { useProjects } from '@/features/projects/api/projectApi';
import { useTargets } from '@/features/targets/api/targetApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useTeam } from '@/features/team/api/teamApi';
import { Paperclip, X } from 'lucide-react';

interface CreateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
  defaultSprintId?: string;
  defaultTitle?: string;
  defaultDescription?: string;
}

export function CreateTaskModal({ open, onOpenChange, defaultProjectId, defaultSprintId, defaultTitle = '', defaultDescription = '' }: CreateTaskModalProps) {
  const { user } = useAuthStore();
  const createTask = useCreateTask();
  const addAttachment = useAddAttachment();
  const { toast } = useToast();
  const { data: projects = [] } = useProjects();
  const { data: teamMembers = [] } = useTeam();
  
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const { data: targets = [] } = useTargets(projectId);

  const [title, setTitle] = useState(defaultTitle);
  const [key, setKey] = useState('');
  const [description, setDescription] = useState(defaultDescription);
  const [taskCategory, setTaskCategory] = useState('DESIGN');
  const [type, setType] = useState('MODELING');
  const [priority, setPriority] = useState('MEDIUM');
  const [estimatedHours, setEstimatedHours] = useState('');
  const [targetId, setTargetId] = useState(defaultSprintId || 'none');
  const [assigneeId, setAssigneeId] = useState('none');
  const [drawingNumber, setDrawingNumber] = useState('');
  const [revisionNumber, setRevisionNumber] = useState('');
  
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTitle(defaultTitle);
      setDescription(defaultDescription);
      if (defaultProjectId) setProjectId(defaultProjectId);
      if (defaultSprintId) setTargetId(defaultSprintId);
      setFiles([]);
    }
  }, [open, defaultTitle, defaultDescription, defaultProjectId, defaultSprintId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !user) return;
    
    try {
      const response = await createTask.mutateAsync({
        key,
        title,
        description,
        taskCategory,
        type,
        status: 'PENDING',
        priority: priority as any,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
        drawingNumber: drawingNumber || undefined,
        revisionNumber: revisionNumber || undefined,
        projectId,
        targetId: targetId !== 'none' ? targetId : undefined,
        assigneeId: assigneeId !== 'none' ? assigneeId : undefined,
        creatorId: user.id,
      });
      
      onOpenChange(false);
      setTitle('');
      setKey('');
      setDescription('');
      setEstimatedHours('');
      setDrawingNumber('');
      setRevisionNumber('');
      setFiles([]);

      const createdTaskId = response.task?.id || response.id;
      if (createdTaskId && files.length > 0) {
        toast({ title: "Uploading attachments..." });
        for (const file of files) {
          const formData = new FormData();
          formData.append('file', file);
          await addAttachment.mutateAsync({ taskId: createdTaskId, fileData: formData });
        }
        toast({ title: "Attachments uploaded successfully." });
      }

      if (response.emailTriggered) {
        toast({
          title: "✅ Task assigned successfully",
          description: `📧 Notification email sent to: ${response.task?.assignee?.email || 'assignee'}`,
        });
      } else if (assigneeId !== 'none') {
        toast({
          variant: "destructive",
          title: "⚠ Task created successfully",
          description: "But notification email failed.",
        });
      } else {
        toast({
          title: "✅ Task created successfully",
          description: "No assignee, so no email was sent.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error creating task",
        description: error.response?.data?.error || "An unexpected error occurred."
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select value={projectId} onValueChange={setProjectId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="target">Target</Label>
              <Select value={targetId} onValueChange={setTargetId} disabled={!projectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select target" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Backlog (No Target)</SelectItem>
                  {targets.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taskCategory">Task</Label>
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
              <Label htmlFor="type">Task Type</Label>
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
              <Label htmlFor="priority">Priority</Label>
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

          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="key">Task Key</Label>
              <Input id="key" value={key} onChange={e => setKey(e.target.value)} required placeholder="e.g. PROJ-123" />
            </div>
            {user && (user.permissions?.includes('CREATE_TASK')) && (
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Est. Hours</Label>
                <Input id="estimatedHours" type="number" step="0.5" min="0" value={estimatedHours} onChange={e => setEstimatedHours(e.target.value)} placeholder="e.g. 5.5" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="drawingNumber">Drawing Number</Label>
              <Input id="drawingNumber" value={drawingNumber} onChange={e => setDrawingNumber(e.target.value)} placeholder="e.g. D-101" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="revisionNumber">Revision Number</Label>
              <Input id="revisionNumber" value={revisionNumber} onChange={e => setRevisionNumber(e.target.value)} placeholder="e.g. R0" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Task title..." />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide task details, drawing specs, etc." className="min-h-[100px]" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee">Assignee</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {teamMembers.map((m: any) => (
                  <SelectItem key={m.id} value={m.id}>{m.name} ({m.role})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            <div className="flex items-center gap-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-4 h-4 mr-2" />
                Attach Files
              </Button>
              <input 
                type="file" 
                multiple
                className="hidden" 
                ref={fileInputRef} 
                onChange={(e) => {
                  if (e.target.files) {
                    setFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                  }
                }}
              />
            </div>
            {files.length > 0 && (
              <div className="flex flex-col gap-1 mt-2">
                {files.map((f, i) => (
                  <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                    <span className="truncate">{f.name}</span>
                    <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={createTask.isPending}>
              {createTask.isPending ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
