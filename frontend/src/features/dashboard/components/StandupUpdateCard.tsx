import { AlertTriangle, MessageSquare, ArrowRight } from 'lucide-react';
import { ROLE_COLORS } from '@/constants/teamMembers';
import type { UserRole } from '@/types/user';

interface StandupUpdateCardProps {
  update: {
    member: string;
    role: string;
    task: string;
    todayWork: string;
    blockers: string;
    hasBlocker: boolean;
    helperRequired: string;
    submittedAt: string;
    projectName?: string;
    sprintName?: string;
  };
}

export default function StandupUpdateCard({ update }: StandupUpdateCardProps) {
  const isBlocked = update.hasBlocker;

  return (
    <div className={`flex flex-col p-4 rounded-lg border transition-colors ${
      isBlocked 
        ? 'bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-900/50' 
        : 'bg-card border-border hover:border-indigo-500/30'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold">{update.member}</span>
            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded-sm border ${ROLE_COLORS[update.role as UserRole] || ''}`}>
              {update.role.replace('_', ' ')}
            </span>
          </div>
          <p className="text-xs text-muted-foreground flex items-center">
            <ArrowRight className="w-3 h-3 mr-1" /> {update.task}
          </p>
          {(update.projectName || update.sprintName) && (
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
              {update.projectName} — {update.sprintName}
            </p>
          )}
        </div>
        <div className="text-right flex flex-col items-end">
          <span className="text-[10px] text-muted-foreground">{new Date(update.submittedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
          {isBlocked && (
            <span className="mt-1 flex items-center text-[10px] uppercase font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-sm">
              <AlertTriangle className="w-3 h-3 mr-1" /> Escalation
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2 mt-1">
        <div className="text-sm flex items-start gap-2">
          <MessageSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
          <span className="text-muted-foreground leading-relaxed">"{update.todayWork}"</span>
        </div>
        
        {isBlocked && (
          <div className="text-sm flex items-start gap-2 bg-red-100/50 dark:bg-red-900/20 p-2 rounded text-red-700 dark:text-red-400 mt-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="font-medium">Blocked by: {update.blockers}</span>
          </div>
        )}
      </div>
    </div>
  );
}
