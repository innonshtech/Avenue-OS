import { useState } from 'react';
import { useCreateTarget } from '../api/targetApi';
import { useProjects } from '@/features/projects/api/projectApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CreateTargetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
}

export function CreateTargetModal({ open, onOpenChange, defaultProjectId }: CreateTargetModalProps) {
  const createTarget = useCreateTarget();
  const { data: projects = [] } = useProjects();
  
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetedHours, setBudgetedHours] = useState('');
  const [projectId, setProjectId] = useState(defaultProjectId || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) return;
    
    await createTarget.mutateAsync({
      name,
      goal,
      startDate: startDate || new Date().toISOString(),
      endDate: endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      budgetedHours: budgetedHours ? parseFloat(budgetedHours) : undefined,
      projectId,
    });
    
    onOpenChange(false);
    setName('');
    setGoal('');
    setStartDate('');
    setEndDate('');
    setBudgetedHours('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Target</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="project" className="text-right">Project</Label>
            <div className="col-span-3">
              <Select value={projectId} onValueChange={setProjectId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">Name</Label>
            <Input id="name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" required placeholder="e.g. Target 1 - Structural Analysis" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="goal" className="text-right">Goal</Label>
            <Textarea id="goal" value={goal} onChange={e => setGoal(e.target.value)} className="col-span-3" placeholder="Target scope or deliverables..." />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="start" className="text-right">Start Date</Label>
            <Input id="start" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="end" className="text-right">End Date</Label>
            <Input id="end" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="budgetedHours" className="text-right">Budgeted Hours</Label>
            <Input id="budgetedHours" type="number" step="0.5" min="0" value={budgetedHours} onChange={e => setBudgetedHours(e.target.value)} className="col-span-3" placeholder="e.g. 120" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={createTarget.isPending}>
              {createTarget.isPending ? 'Creating...' : 'Create Target'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
