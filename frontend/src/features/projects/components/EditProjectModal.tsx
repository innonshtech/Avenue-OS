/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { useUpdateProject } from '../api/projectApi';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useTeam } from '@/features/team/api/teamApi';
import type { Project } from '@/types/core';
import type { TeamMember } from '@/types/user';
import { EnterpriseDatePicker } from '@/components/EnterpriseDatePicker';

interface EditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: Project;
}

export function EditProjectModal({ open, onOpenChange, project }: EditProjectModalProps) {
  const { user } = useAuthStore();
  const updateProject = useUpdateProject();
  const { toast } = useToast();
  const { data: teamMembers = [], isLoading: isLoadingTeam } = useTeam();
  
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [status, setStatus] = useState(project.status || 'PLANNING');
  const [startDate, setStartDate] = useState(project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '');
  const [deadline, setDeadline] = useState(project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '');
  const [selectedMembers, setSelectedMembers] = useState<string[]>(project.members?.map(m => m.userId) || []);

  useEffect(() => {
    if (open) {
      setName(project.name);
      setDescription(project.description || '');
      setStatus(project.status || 'PLANNING');
      setStartDate(project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '');
      setDeadline(project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '');
      setSelectedMembers(project.members?.map(m => m.userId) || []);
    }
  }, [open, project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      await updateProject.mutateAsync({
        id: project.id,
        name,
        description,
        status: status as Project['status'],
        startDate: startDate || undefined,
        deadline: deadline || undefined,
        memberIds: selectedMembers,
      });
      
      toast({
        title: "Project Updated",
        description: "The project has been updated successfully.",
      });
      onOpenChange(false);
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } };
      toast({
        variant: "destructive",
        title: "Error updating project",
        description: err.response?.data?.error || "An unexpected error occurred."
      });
    }
  };

  const toggleMember = (memberId: string) => {
    if (selectedMembers.includes(memberId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== memberId));
    } else {
      setSelectedMembers([...selectedMembers, memberId]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-name" className="text-right">Name</Label>
            <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-desc" className="text-right">Description</Label>
            <Textarea id="edit-desc" value={description} onChange={e => setDescription(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-status" className="text-right">Status</Label>
            <select 
              id="edit-status" 
              value={status} 
              onChange={e => setStatus(e.target.value as any)} 
              className="col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-start" className="text-right">Start Date</Label>
            <div className="col-span-3">
               <EnterpriseDatePicker id="edit-start" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-deadline" className="text-right">Deadline</Label>
            <div className="col-span-3">
               <EnterpriseDatePicker id="edit-deadline" value={deadline} onChange={e => setDeadline(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Team Members</Label>
            <div className="flex flex-wrap gap-2 p-3 border rounded-md max-h-[150px] overflow-y-auto">
              {isLoadingTeam ? (
                <div className="text-sm text-muted-foreground">Loading team...</div>
              ) : teamMembers.length === 0 ? (
                <div className="text-sm text-muted-foreground">No team members found</div>
              ) : (
                teamMembers.map((member: TeamMember) => (
                  <div 
                    key={member.id} 
                    onClick={() => toggleMember(member.id)}
                    className={`cursor-pointer px-3 py-1 text-sm rounded-full border ${selectedMembers.includes(member.id) ? 'bg-indigo-100 border-indigo-500 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-500 dark:text-indigo-300' : 'bg-background hover:bg-muted'}`}
                  >
                    {member.name}
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={updateProject.isPending}>
              {updateProject.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
