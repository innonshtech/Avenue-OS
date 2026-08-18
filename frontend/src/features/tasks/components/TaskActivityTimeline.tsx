import { Activity } from 'lucide-react';

function formatActivityMessage(activity: any): string {
  switch (activity.action) {
    case 'TASK_CREATED':
      return `created this task${activity.newValue ? ` and assigned it to ${activity.newValue}` : ''}`;
    case 'ASSIGNEE_CHANGED':
      return `reassigned from ${activity.oldAssigneeName || 'Unassigned'} to ${activity.newAssigneeName || 'Unassigned'}`;
    case 'STATUS_CHANGED':
      return `changed status from ${activity.oldValue?.replace(/_/g, ' ') || 'unknown'} to ${activity.newValue?.replace(/_/g, ' ') || 'unknown'}`;
    default:
      return activity.action.replace(/_/g, ' ').toLowerCase();
  }
}

export default function TaskActivityTimeline({ activities }: { activities: any[] }) {
  if (!activities?.length) {
    return <p className="text-sm text-muted-foreground py-4">No activity recorded yet.</p>;
  }

  return (
    <div className="space-y-4 mt-4">
      {activities.map((activity: any) => (
        <div key={activity.id} className="flex gap-3 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border shrink-0 z-10 shadow-sm">
            <Activity className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="pt-1 pb-4 flex-1">
            <p className="text-sm">
              <span className="font-medium text-foreground">{activity.user?.name || 'System'}</span>
              {' '}{formatActivityMessage(activity)}
            </p>
            <span className="text-xs text-muted-foreground">{new Date(activity.createdAt).toLocaleString()}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
