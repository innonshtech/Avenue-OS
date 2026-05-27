import React from 'react';
import { ActivityCard } from './ActivityCard';
import type { ActivityLog } from './api';
import { motion } from 'framer-motion';

export const ActivityTimeline = ({ activities }: { activities: ActivityLog[] }) => {
  if (!activities?.length) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
        <p className="text-sm text-slate-500 dark:text-slate-400">No recent activity found.</p>
      </div>
    );
  }

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:inset-0 before:ml-6 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 dark:before:via-slate-700 before:to-transparent">
      {activities.map((activity, index) => (
        <motion.div
          key={activity.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.05 }}
        >
          <ActivityCard activity={activity} />
        </motion.div>
      ))}
    </div>
  );
};
