import { useState, useEffect } from 'react';
import { useUpdateTarget } from '../api/targetApi';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Target } from '@/types/core';
import { EnterpriseDatePicker } from '@/components/EnterpriseDatePicker';

interface EditTargetModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: Target;
}

export function EditTargetModal({ open, onOpenChange, target }: EditTargetModalProps) {
  const updateTarget = useUpdateTarget();
  const { toast } = useToast();
  
  const [name, setName] = useState(target.name);
  const [goal, setGoal] = useState(target.goal || '');
  const [status, setStatus] = useState(target.status || 'PLANNED');
  const [startDate, setStartDate] = useState(target.startDate ? new Date(target.startDate).toISOString().split('T')[0] : '');
  const [endDate, setEndDate] = useState(target.endDate ? new Date(target.endDate).toISOString().split('T')[0] : '');
  const [budgetedHours, setBudgetedHours] = useState(target.budgetedHours?.toString() || '');

  useEffect(() => {
    if (open) {
      setName(target.name);
      setGoal(target.goal || '');
      setStatus(target.status || 'PLANNED');
      setStartDate(target.startDate ? new Date(target.startDate).toISOString().split('T')[0] : '');
      setEndDate(target.endDate ? new Date(target.endDate).toISOString().split('T')[0] : '');
      setBudgetedHours(target.budgetedHours?.toString() || '');
    }
  }, [open, target]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateTarget.mutateAsync({
        id: target.id,
        name,
        goal,
        status: status as any,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        budgetedHours: budgetedHours ? parseFloat(budgetedHours) : undefined,
      });
      
      toast({
        title: "Target Updated",
        description: "The target has been updated successfully.",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating target",
        description: error.response?.data?.error || "An unexpected error occurred."
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Target</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-target-name" className="text-right">Name</Label>
            <Input id="edit-target-name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-target-goal" className="text-right">Goal</Label>
            <Textarea id="edit-target-goal" value={goal} onChange={e => setGoal(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-target-status" className="text-right">Status</Label>
            <select 
              id="edit-target-status" 
              value={status} 
              onChange={e => setStatus(e.target.value as any)} 
              className="col-span-3 flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="PLANNED">Planned</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-target-start" className="text-right">Start Date</Label>
            <div className="col-span-3">
               <EnterpriseDatePicker id="edit-target-start" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-target-end" className="text-right">End Date</Label>
            <div className="col-span-3">
               <EnterpriseDatePicker id="edit-target-end" value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-target-budgeted" className="text-right">Budgeted Hours</Label>
            <Input id="edit-target-budgeted" type="number" step="0.5" min="0" value={budgetedHours} onChange={e => setBudgetedHours(e.target.value)} className="col-span-3" placeholder="e.g. 120" />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={updateTarget.isPending}>
              {updateTarget.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
