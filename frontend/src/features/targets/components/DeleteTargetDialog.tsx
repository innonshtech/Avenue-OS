import { useDeleteTarget, useArchiveTarget } from '../api/targetApi';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import type { Target } from '@/types/core';

interface DeleteTargetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: Target;
}

export function DeleteTargetDialog({ open, onOpenChange, target }: DeleteTargetDialogProps) {
  const deleteTarget = useDeleteTarget();
  const archiveTarget = useArchiveTarget();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleHardDelete = async () => {
    try {
      await deleteTarget.mutateAsync(target.id);
      toast({
        title: "Target Deleted",
        description: "The target has been permanently deleted.",
      });
      onOpenChange(false);
      navigate(`/dashboard/projects/${target.projectId}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting target",
        description: error.response?.data?.error || "Failed to delete target."
      });
    }
  };

  const handleArchive = async () => {
    try {
      await archiveTarget.mutateAsync({ id: target.id, isArchived: true });
      toast({
        title: "Target Archived",
        description: "The target has been safely archived.",
      });
      onOpenChange(false);
      navigate(`/dashboard/projects/${target.projectId}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error archiving target",
        description: error.response?.data?.error || "Failed to archive target."
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600 dark:text-red-400">Danger Zone: Delete Target</DialogTitle>
          <DialogDescription className="text-slate-700 dark:text-slate-300">
            You are about to modify <strong>{target.name}</strong>.
            <br /><br />
            <strong>Deleting this target will remove:</strong>
            <ul className="list-disc pl-5 mt-2 text-sm text-red-500">
              <li>all associated tasks and their history</li>
              <li>all progress reports for this target</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-sm my-2">
          <p>We highly recommend <strong>archiving</strong> the target instead of permanently deleting it to retain historical data.</p>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="secondary"
            onClick={handleArchive}
            disabled={archiveTarget.isPending || deleteTarget.isPending}
          >
            {archiveTarget.isPending ? 'Archiving...' : 'Archive Target'}
          </Button>
          <Button 
            type="button" 
            variant="destructive"
            onClick={handleHardDelete}
            disabled={deleteTarget.isPending || archiveTarget.isPending}
          >
            {deleteTarget.isPending ? 'Deleting...' : 'Hard Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
