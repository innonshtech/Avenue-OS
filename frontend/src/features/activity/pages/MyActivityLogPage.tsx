import React from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useActivities } from '../api';
import { ActivityLogTable } from '../components/ActivityLogTable';
import { Loader2, Activity } from 'lucide-react';

export default function MyActivityLogPage() {
  const { user } = useAuthStore();
  const { data: activities, isLoading, error } = useActivities({ memberId: user?.id });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Activity className="w-6 h-6 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">My Activity Log</h1>
          </div>
          <p className="text-muted-foreground">
            A detailed history of your actions, task completions, and updates across SprintOS.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : error ? (
        <div className="p-6 text-center text-red-500 bg-red-50 rounded-xl border border-red-200">
          Failed to load your activity history.
        </div>
      ) : (
        <ActivityLogTable activities={activities || []} showUser={false} />
      )}
    </div>
  );
}
