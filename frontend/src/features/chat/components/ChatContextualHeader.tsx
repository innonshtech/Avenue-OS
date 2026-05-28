import React from 'react';
import { type Channel } from '../api/chatApi';
import { useTask } from '@/features/tasks/api/taskApi';
import { ExternalLink, Flag, Calendar, Hash } from 'lucide-react';

interface ChatContextualHeaderProps {
  channel: Channel;
}

export const ChatContextualHeader: React.FC<ChatContextualHeaderProps> = ({ channel }) => {
  const { data: task, isLoading } = useTask(channel.taskId || null);

  if (!channel.taskId) return null;

  if (isLoading) {
    return (
      <div className="h-14 bg-zinc-900 border-b border-zinc-800 flex items-center px-6 animate-pulse flex-shrink-0">
        <div className="h-4 bg-zinc-800 rounded w-1/3"></div>
      </div>
    );
  }

  if (!task) return null;

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
  const dueToday = task.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString();

  return (
    <div className="h-14 bg-zinc-900/80 border-b border-zinc-800 flex items-center justify-between px-6 flex-shrink-0 z-[5]">
      <div className="flex items-center gap-4 min-w-0">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            {task.key}
          </span>
          <span className={`text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded tracking-wider border ${
            task.status === 'DONE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
            task.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
            'bg-zinc-800 text-zinc-400 border-zinc-700'
          }`}>
            {task.status.replace('_', ' ')}
          </span>
        </div>
        
        <div className="flex flex-col min-w-0">
          <span className="font-semibold text-sm text-white truncate leading-tight">
            {task.title}
          </span>
          <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-medium mt-0.5">
            {task.project && (
              <span className="flex items-center gap-1">
                <Hash className="w-3 h-3" /> {task.project.name}
              </span>
            )}
            {task.dueDate && (
              <span className={`flex items-center gap-1 ${isOverdue ? 'text-rose-400 font-bold' : dueToday ? 'text-amber-400 font-bold' : ''}`}>
                <Calendar className="w-3 h-3" />
                {isOverdue ? 'Overdue' : dueToday ? 'Due Today' : new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Flag className="w-3 h-3" /> {task.priority}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => window.open(`/dashboard/boards?task=${task.id}`, '_blank')}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold rounded-md transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>Open Task</span>
        </button>
      </div>
    </div>
  );
};
