import { useState, useEffect } from 'react';
import { useUpdateStage } from '../api/stageApi';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Stage } from '@/types/core';
import { EnterpriseDatePicker } from '@/components/EnterpriseDatePicker';

interface EditStageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: Stage;
}

export function EditStageModal({ open, onOpenChange, stage }: EditStageModalProps) {
  const updateStage = useUpdateStage();
  const { toast } = useToast();
  
  const [name, setName] = useState(stage.name);
  const [goal, setGoal] = useState(stage.goal || '');
  const [status, setStatus] = useState(stage.status || 'PLANNED');
  const [startDate, setStartDate] = useState(stage.startDate ? new Date(stage.startDate).toISOString().split('T')[0] : '');
  const [endDate, setEndDate] = useState(stage.endDate ? new Date(stage.endDate).toISOString().split('T')[0] : '');

  useEffect(() => {
    if (open) {
      setName(stage.name);
      setGoal(stage.goal || '');
      setStatus(stage.status || 'PLANNED');
      setStartDate(stage.startDate ? new Date(stage.startDate).toISOString().split('T')[0] : '');
      setEndDate(stage.endDate ? new Date(stage.endDate).toISOString().split('T')[0] : '');
    }
  }, [open, stage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateStage.mutateAsync({
        id: stage.id,
        name,
        goal,
        status: status as any,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      
      toast({
        title: "Stage Updated",
        description: "The stage has been updated successfully.",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error updating stage",
        description: error.response?.data?.error || "An unexpected error occurred."
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Stage</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-stage-name" className="text-right">Name</Label>
            <Input id="edit-stage-name" value={name} onChange={e => setName(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-stage-goal" className="text-right">Goal</Label>
            <Textarea id="edit-stage-goal" value={goal} onChange={e => setGoal(e.target.value)} className="col-span-3" required />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-stage-status" className="text-right">Status</Label>
            <select 
              id="edit-stage-status" 
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
            <Label htmlFor="edit-stage-start" className="text-right">Start Date</Label>
            <div className="col-span-3">
               <EnterpriseDatePicker id="edit-stage-start" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-stage-end" className="text-right">End Date</Label>
            <div className="col-span-3">
               <EnterpriseDatePicker id="edit-stage-end" value={endDate} onChange={e => setEndDate(e.target.value)} required />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={updateStage.isPending}>
              {updateStage.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
