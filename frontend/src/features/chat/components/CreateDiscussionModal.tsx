import React, { useState } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { TEAM_MEMBERS } from '@/constants/teamMembers';
import { useCreateChannel } from '../api/chatApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Check, Hash, Users, Lock, MessageSquare } from 'lucide-react';

interface CreateDiscussionModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
}

export const CreateDiscussionModal: React.FC<CreateDiscussionModalProps> = ({ isOpen, onClose, task }) => {
  const { user } = useAuthStore();
  const createChannel = useCreateChannel();
  
  const [selectedMembers, setSelectedMembers] = useState<string[]>(
    task?.assigneeId && task.assigneeId !== user?.id ? [task.assigneeId] : []
  );
  const [discussionType, setDiscussionType] = useState<'TASK' | 'PRIVATE' | 'TEAM'>('TASK');
  const [initialMessage, setInitialMessage] = useState('');

  if (!task) return null;

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const handleCreate = () => {
    createChannel.mutate({
      name: `task:${task.key}`,
      description: `Contextual discussion for ${task.title}`,
      type: 'TASK',
      taskId: task.id,
      projectId: task.projectId,
      sprintId: task.sprintId,
      memberIds: selectedMembers,
    }, {
      onSuccess: () => {
        // We'll navigate to chat or just close and let user navigate
        window.location.href = `/dashboard/chat?taskId=${task.id}`;
        onClose();
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg bg-zinc-950 border-zinc-800 text-zinc-100 p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            Create Contextual Discussion
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">
            Open a dedicated chat space connected to this task metadata.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto scrollbar-thin">
          {/* Section 1: Task Context Preview */}
          <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {task.key}
              </span>
              <span className="text-xs font-medium text-zinc-400 border border-zinc-800 px-1.5 py-0.5 rounded bg-zinc-950">
                {task.status.replace('_', ' ')}
              </span>
              <span className="text-xs font-medium text-zinc-400 border border-zinc-800 px-1.5 py-0.5 rounded bg-zinc-950">
                {task.priority}
              </span>
            </div>
            <h4 className="font-semibold text-sm mb-1">{task.title}</h4>
            <div className="flex items-center gap-4 text-xs text-zinc-500">
              {task.project && (
                <span className="flex items-center gap-1"><Hash className="w-3 h-3" /> {task.project.name}</span>
              )}
            </div>
          </div>

          {/* Section 2: Discussion Type */}
          <div>
            <h5 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Discussion Type</h5>
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setDiscussionType('TASK')}
                className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-colors ${discussionType === 'TASK' ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900'}`}
              >
                <Hash className={`w-4 h-4 mt-0.5 ${discussionType === 'TASK' ? 'text-indigo-400' : 'text-zinc-500'}`} />
                <div>
                  <div className={`text-sm font-semibold ${discussionType === 'TASK' ? 'text-indigo-100' : 'text-zinc-300'}`}>Task Specific</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Contextual thread linked to task</div>
                </div>
              </button>
              <button 
                onClick={() => setDiscussionType('PRIVATE')}
                className={`p-3 rounded-lg border text-left flex items-start gap-3 transition-colors ${discussionType === 'PRIVATE' ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-zinc-900/50 border-zinc-800 hover:bg-zinc-900'}`}
              >
                <Lock className={`w-4 h-4 mt-0.5 ${discussionType === 'PRIVATE' ? 'text-indigo-400' : 'text-zinc-500'}`} />
                <div>
                  <div className={`text-sm font-semibold ${discussionType === 'PRIVATE' ? 'text-indigo-100' : 'text-zinc-300'}`}>Private Group</div>
                  <div className="text-[10px] text-zinc-500 mt-1">Invite-only discussion</div>
                </div>
              </button>
            </div>
          </div>

          {/* Section 3: Select Participants */}
          <div>
            <h5 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center justify-between">
              <span>Select Participants</span>
              <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded-full">{selectedMembers.length} selected</span>
            </h5>
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
              {TEAM_MEMBERS.filter(m => m.id !== user?.id).map((member) => (
                <div 
                  key={member.id} 
                  onClick={() => toggleMember(member.id)}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${selectedMembers.includes(member.id) ? 'bg-indigo-500/10' : 'hover:bg-zinc-800'}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="text-[10px]">{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className={`text-xs font-semibold ${selectedMembers.includes(member.id) ? 'text-indigo-100' : 'text-zinc-300'}`}>{member.name}</span>
                      <span className="text-[10px] text-zinc-500">{member.role}</span>
                    </div>
                  </div>
                  {selectedMembers.includes(member.id) && (
                    <Check className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Initial Message */}
          <div>
            <h5 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">Initial Message (Optional)</h5>
            <Textarea 
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              placeholder="Add discussion context... e.g. Please review backend API integration before sprint deadline."
              className="bg-zinc-900 border-zinc-800 text-sm resize-none focus-visible:ring-indigo-500"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-end gap-3 sm:justify-end">
          <Button variant="ghost" onClick={onClose} className="hover:bg-zinc-800 hover:text-white text-zinc-400">Cancel</Button>
          <Button 
            onClick={handleCreate} 
            disabled={createChannel.isPending}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          >
            {createChannel.isPending ? 'Creating...' : 'Create Discussion'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
