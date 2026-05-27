import React from 'react';
import { useActivities } from './api';
import { ActivityTimeline } from './ActivityTimeline';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';

export const MemberActivityFeed = () => {
  const { user } = useAuthStore();
  const { data: activities, isLoading, error } = useActivities({ memberId: user?.id });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-red-500 bg-red-50 rounded-lg border border-red-200">
        Failed to load your activities.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">My Recent Activity</h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Your interactions across the platform</p>
      </div>
      
      <div className="max-h-[400px] overflow-y-auto pr-2">
        <ActivityTimeline activities={activities || []} />
      </div>
    </div>
  );
};
