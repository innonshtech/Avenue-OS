import { useDeleteStage, useArchiveStage } from '../api/stageApi';
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
import type { Stage } from '@/types/core';

interface DeleteStageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stage: Stage;
}

export function DeleteStageDialog({ open, onOpenChange, stage }: DeleteStageDialogProps) {
  const deleteStage = useDeleteStage();
  const archiveStage = useArchiveStage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleHardDelete = async () => {
    try {
      await deleteStage.mutateAsync(stage.id);
      toast({
        title: "Stage Deleted",
        description: "The stage has been permanently deleted.",
      });
      onOpenChange(false);
      navigate(`/dashboard/projects/${stage.projectId}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error deleting stage",
        description: error.response?.data?.error || "Failed to delete stage."
      });
    }
  };

  const handleArchive = async () => {
    try {
      await archiveStage.mutateAsync({ id: stage.id, isArchived: true });
      toast({
        title: "Stage Archived",
        description: "The stage has been safely archived.",
      });
      onOpenChange(false);
      navigate(`/dashboard/projects/${stage.projectId}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error archiving stage",
        description: error.response?.data?.error || "Failed to archive stage."
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-red-600 dark:text-red-400">Danger Zone: Delete Stage</DialogTitle>
          <DialogDescription className="text-slate-700 dark:text-slate-300">
            You are about to modify <strong>{stage.name}</strong>.
            <br /><br />
            <strong>Deleting this stage will remove:</strong>
            <ul className="list-disc pl-5 mt-2 text-sm text-red-500">
              <li>all associated tasks and their history</li>
              <li>all progress reports for this stage</li>
            </ul>
          </DialogDescription>
        </DialogHeader>
        <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-md text-sm my-2">
          <p>We highly recommend <strong>archiving</strong> the stage instead of permanently deleting it to retain historical data.</p>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2 mt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="secondary"
            onClick={handleArchive}
            disabled={archiveStage.isPending || deleteStage.isPending}
          >
            {archiveStage.isPending ? 'Archiving...' : 'Archive Stage'}
          </Button>
          <Button 
            type="button" 
            variant="destructive"
            onClick={handleHardDelete}
            disabled={deleteStage.isPending || archiveStage.isPending}
          >
            {deleteStage.isPending ? 'Deleting...' : 'Hard Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
