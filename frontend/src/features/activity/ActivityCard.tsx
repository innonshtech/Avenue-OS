import React from 'react';
import type { ActivityLog } from './api';
import { format } from 'date-fns';

export const ActivityCard = ({ activity }: { activity: ActivityLog }) => {
  const date = new Date(activity.createdAt);
  
  return (
    <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
      <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10 overflow-hidden">
        {activity.user?.avatar ? (
          <img src={activity.user.avatar} alt={activity.user.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-sm font-semibold">{activity.user?.name?.charAt(0) || '?'}</span>
        )}
      </div>
      
      <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
          <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{activity.title}</h4>
          <time className="text-xs text-slate-500 dark:text-slate-400 mt-1 sm:mt-0 font-medium">
            {format(date, 'dd MMM yyyy, h:mm a')}
          </time>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{activity.description}</p>
        <div className="mt-3 flex items-center gap-2">
           <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-800/50 text-xs font-medium text-slate-500 dark:text-slate-400">
             {activity.entityType}
           </span>
           <span className="text-xs text-slate-400 font-medium">By {activity.user?.name}</span>
        </div>
      </div>
    </div>
  );
};
