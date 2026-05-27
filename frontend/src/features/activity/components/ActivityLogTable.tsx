import React, { useMemo } from 'react';
import { format } from 'date-fns';
import type { ActivityLog } from '../api';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, FileText, CheckCircle2, MessageSquare, AlertTriangle, Users } from 'lucide-react';

interface ActivityLogTableProps {
  activities: ActivityLog[];
  showUser?: boolean;
}

const getEntityIcon = (entityType: string) => {
  switch (entityType.toUpperCase()) {
    case 'TASK': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    case 'SPRINT': return <Clock className="w-4 h-4 text-indigo-500" />;
    case 'PROJECT': return <FileText className="w-4 h-4 text-blue-500" />;
    case 'STANDUP': return <Users className="w-4 h-4 text-orange-500" />;
    case 'FEEDBACK': return <MessageSquare className="w-4 h-4 text-purple-500" />;
    case 'BLOCKER': return <AlertTriangle className="w-4 h-4 text-red-500" />;
    default: return <Activity className="w-4 h-4 text-slate-500" />;
  }
};

const getActionColor = (actionType: string) => {
  if (actionType.includes('CREATED') || actionType.includes('ADDED')) return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
  if (actionType.includes('UPDATED') || actionType.includes('MOVED') || actionType.includes('RESOLVED')) return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
  if (actionType.includes('DELETED') || actionType.includes('ARCHIVED')) return 'bg-red-500/10 text-red-700 border-red-500/20';
  if (actionType.includes('COMPLETED')) return 'bg-indigo-500/10 text-indigo-700 border-indigo-500/20';
  return 'bg-slate-500/10 text-slate-700 border-slate-500/20';
};

export const ActivityLogTable = ({ activities, showUser = false }: ActivityLogTableProps) => {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-4 font-semibold">Timestamp</th>
              {showUser && <th className="px-6 py-4 font-semibold">Member</th>}
              <th className="px-6 py-4 font-semibold">Action</th>
              <th className="px-6 py-4 font-semibold">Entity</th>
              <th className="px-6 py-4 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {activities.length === 0 ? (
              <tr>
                <td colSpan={showUser ? 5 : 4} className="px-6 py-8 text-center text-muted-foreground">
                  No activity found.
                </td>
              </tr>
            ) : (
              activities.map((activity) => (
                <tr key={activity.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{format(new Date(activity.createdAt), 'MMM dd, yyyy')}</span>
                      <span className="text-xs text-muted-foreground mt-0.5">{format(new Date(activity.createdAt), 'hh:mm:ss a')}</span>
                    </div>
                  </td>
                  {showUser && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">{activity.user?.name || 'System'}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">{activity.user?.role?.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="outline" className={`${getActionColor(activity.actionType)} text-[10px] font-bold uppercase tracking-wider`}>
                      {activity.actionType.replace(/_/g, ' ')}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getEntityIcon(activity.entityType)}
                      <span className="font-medium capitalize text-foreground">{activity.entityType.toLowerCase()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col max-w-md">
                      <span className="font-semibold text-foreground truncate">{activity.title}</span>
                      <span className="text-xs text-muted-foreground mt-1 truncate" title={activity.description}>
                        {activity.description}
                      </span>
                      {activity.task && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-mono">
                            {activity.task.key}
                          </span>
                          <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium truncate">
                            {activity.task.title}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
