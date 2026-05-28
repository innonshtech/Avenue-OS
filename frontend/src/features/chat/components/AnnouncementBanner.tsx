import React from 'react';
import { Megaphone, AlertCircle } from 'lucide-react';

interface AnnouncementBannerProps {
  content?: string;
  senderName?: string;
}

export const AnnouncementBanner: React.FC<AnnouncementBannerProps> = ({ content, senderName }) => {
  if (!content) return null;

  return (
    <div className="bg-indigo-600/10 border-b border-indigo-500/20 px-4 py-3 flex items-start gap-3 animate-in slide-in-from-top duration-200">
      <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 mt-0.5">
        <Megaphone className="w-4 h-4 fill-indigo-400/20" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-xs text-white">Broadcast Announcement</span>
          {senderName && (
            <span className="text-[10px] text-zinc-500 font-semibold">by {senderName}</span>
          )}
        </div>
        <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed truncate font-medium">
          {content}
        </p>
      </div>
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-600/20 border border-indigo-500/30 text-[10px] text-indigo-400 font-bold tracking-wide uppercase animate-pulse">
        <AlertCircle className="w-3.5 h-3.5" />
        <span>Important</span>
      </div>
    </div>
  );
};
