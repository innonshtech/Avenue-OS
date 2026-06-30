import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { EditStageModal } from './EditStageModal';
import { DeleteStageDialog } from './DeleteStageDialog';
import { useUpdateStage } from '../api/stageApi';
import { useToast } from '@/hooks/use-toast';
import type { Stage } from '@/types/core';

interface StageActionDropdownProps {
  stage: Stage;
}

export function StageActionDropdown({ stage }: StageActionDropdownProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const updateStage = useUpdateStage();
  const { toast } = useToast();

  const handleComplete = async () => {
    try {
      await updateStage.mutateAsync({
        id: stage.id,
        status: 'COMPLETED',
      });
      toast({
        title: "Stage Completed!",
        description: "Great job completing the stage.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error completing stage",
        description: error.response?.data?.error || "An unexpected error occurred."
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-9 w-9">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="cursor-pointer">
            <Edit className="mr-2 h-4 w-4" />
            <span>Edit Stage</span>
          </DropdownMenuItem>
          {stage.status !== 'COMPLETED' && (
            <DropdownMenuItem onClick={handleComplete} className="cursor-pointer text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-950">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              <span>Complete Stage</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className="text-red-600 focus:bg-red-50 dark:focus:bg-red-950 cursor-pointer">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete / Archive</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditStageModal open={isEditOpen} onOpenChange={setIsEditOpen} stage={stage} />
      <DeleteStageDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} stage={stage} />
    </>
  );
}
