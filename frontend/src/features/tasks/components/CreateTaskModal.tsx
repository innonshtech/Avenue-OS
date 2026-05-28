import { useState, useEffect } from 'react';
import { useCreateTask } from '../api/taskApi';
import { useToast } from '@/hooks/use-toast';
import { useProjects } from '@/features/projects/api/projectApi';
import { useSprints } from '@/features/sprints/api/sprintApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TEAM_MEMBERS } from '@/constants/teamMembers';
import { useAuthStore } from '@/features/auth/store/authStore';

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
  const { toast } = useToast();
  const { data: projects = [] } = useProjects();
  
  const [projectId, setProjectId] = useState(defaultProjectId || '');
  const { data: sprints = [] } = useSprints(projectId);

  const [title, setTitle] = useState(defaultTitle);
  const [key, setKey] = useState('');
  const [description, setDescription] = useState(defaultDescription);
  const [type, setType] = useState('STORY');
  const [priority, setPriority] = useState('MEDIUM');
  const [sprintId, setSprintId] = useState(defaultSprintId || 'none');
  const [assigneeId, setAssigneeId] = useState('none');
  const [storyPoints, setStoryPoints] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(defaultTitle);
      setDescription(defaultDescription);
      if (defaultProjectId) setProjectId(defaultProjectId);
      if (defaultSprintId) setSprintId(defaultSprintId);
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
        type,
        status: 'TODO',
        priority,
        storyPoints: storyPoints ? parseInt(storyPoints) : undefined,
        projectId,
        sprintId: sprintId !== 'none' ? sprintId : undefined,
        assigneeId: assigneeId !== 'none' ? assigneeId : undefined,
        creatorId: user.id,
      });
      
      onOpenChange(false);
      setTitle('');
      setKey('');
      setDescription('');
      setStoryPoints('');

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
              <Label htmlFor="sprint">Sprint</Label>
              <Select value={sprintId} onValueChange={setSprintId} disabled={!projectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select sprint" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Backlog (No Sprint)</SelectItem>
                  {sprints.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Task Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STORY">Story</SelectItem>
                  <SelectItem value="TASK">Task</SelectItem>
                  <SelectItem value="BUG">Bug</SelectItem>
                  <SelectItem value="EPIC">Epic</SelectItem>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="key">Task Key</Label>
              <Input id="key" value={key} onChange={e => setKey(e.target.value)} required placeholder="e.g. PROJ-123" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="points">Story Points</Label>
              <Input id="points" type="number" value={storyPoints} onChange={e => setStoryPoints(e.target.value)} placeholder="e.g. 5" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Task title..." />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" value={description} onChange={e => setDescription(e.target.value)} placeholder="Provide task details, acceptance criteria, etc." className="min-h-[100px]" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignee">Assignee</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger>
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Unassigned</SelectItem>
                {TEAM_MEMBERS.map((m: any) => (
                  <SelectItem key={m.id} value={m.id}>{m.name} ({m.role})</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
