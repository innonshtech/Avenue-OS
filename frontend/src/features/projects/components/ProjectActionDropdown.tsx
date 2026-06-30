import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit, Trash2, Plus, Calendar } from 'lucide-react';
import { EditProjectModal } from './EditProjectModal';
import { DeleteProjectDialog } from './DeleteProjectDialog';
import { CreateStageModal } from '@/features/stages/components/CreateStageModal';
import { CreateTaskModal } from '@/features/tasks/components/CreateTaskModal';
import type { Project } from '@/types/core';

interface ProjectActionDropdownProps {
  project: Project;
}

export function ProjectActionDropdown({ project }: ProjectActionDropdownProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isStageOpen, setIsStageOpen] = useState(false);
  const [isTaskOpen, setIsTaskOpen] = useState(false);

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
            <span>Edit Project</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsStageOpen(true)} className="cursor-pointer">
            <Calendar className="mr-2 h-4 w-4" />
            <span>Add Stage</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsTaskOpen(true)} className="cursor-pointer">
            <Plus className="mr-2 h-4 w-4" />
            <span>Add Task</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className="text-red-600 focus:bg-red-50 dark:focus:bg-red-950 cursor-pointer">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete / Archive</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditProjectModal open={isEditOpen} onOpenChange={setIsEditOpen} project={project} />
      <DeleteProjectDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} project={project} />
      <CreateStageModal open={isStageOpen} onOpenChange={setIsStageOpen} defaultProjectId={project.id} />
      <CreateTaskModal open={isTaskOpen} onOpenChange={setIsTaskOpen} defaultProjectId={project.id} />
    </>
  );
}
