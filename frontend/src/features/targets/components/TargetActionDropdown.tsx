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
import { EditTargetModal } from './EditTargetModal';
import { DeleteTargetDialog } from './DeleteTargetDialog';
import { useUpdateTarget } from '../api/targetApi';
import { useToast } from '@/hooks/use-toast';
import type { Target } from '@/types/core';

interface TargetActionDropdownProps {
  target: Target;
}

export function TargetActionDropdown({ target }: TargetActionDropdownProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const updateTarget = useUpdateTarget();
  const { toast } = useToast();

  const handleComplete = async () => {
    try {
      await updateTarget.mutateAsync({
        id: target.id,
        status: 'COMPLETED',
      });
      toast({
        title: "Target Completed!",
        description: "Great job completing the target.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error completing target",
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
            <span>Edit Target</span>
          </DropdownMenuItem>
          {target.status !== 'COMPLETED' && (
            <DropdownMenuItem onClick={handleComplete} className="cursor-pointer text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-950">
              <CheckCircle2 className="mr-2 h-4 w-4" />
              <span>Complete Target</span>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className="text-red-600 focus:bg-red-50 dark:focus:bg-red-950 cursor-pointer">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete / Archive</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditTargetModal open={isEditOpen} onOpenChange={setIsEditOpen} target={target} />
      <DeleteTargetDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} target={target} />
    </>
  );
}
