import React from 'react';
import { usePinnedMessages } from '../api/chatApi';
import { Pin, X, Trash2, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { useMessages } from '../hooks/useMessages';

interface PinnedMessagesPanelProps {
  channelId: string;
  onClose: () => void;
}

export const PinnedMessagesPanel: React.FC<PinnedMessagesPanelProps> = ({ channelId, onClose }) => {
  const { data: pins = [], isLoading } = usePinnedMessages(channelId);
  const { togglePin } = useMessages();

  return (
    <div className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2 font-bold text-sm text-white">
          <Pin className="w-4 h-4 text-indigo-500 fill-indigo-500" />
          <span>Pinned Messages</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
            {pins.length}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-800 focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-2">
            <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-zinc-500">Loading pins...</span>
          </div>
        ) : pins.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 text-xs font-medium flex flex-col items-center gap-2">
            <Pin className="w-8 h-8 text-zinc-700" />
            Keep sprint goals or blocker notes visible for everyone in this channel.
          </div>
        ) : (
          pins.map((pin: any) => (
            <div
              key={pin.id}
              className="p-3 bg-zinc-900 border border-zinc-800/80 rounded-xl relative group hover:border-zinc-800 transition-colors"
            >
              <div className="flex items-start gap-2.5">
                <Avatar className="w-7 h-7">
                  <AvatarImage src={pin.message?.sender?.avatar} alt={pin.message?.sender?.name} />
                  <AvatarFallback className="text-[9px] font-bold bg-zinc-800 text-zinc-400">
                    {pin.message?.sender?.name?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-white truncate">
                      {pin.message?.sender?.name}
                    </span>
                    <span className="text-[8px] text-zinc-500 flex items-center gap-0.5">
                      <Calendar className="w-2.5 h-2.5" />
                      {formatDistanceToNow(new Date(pin.message?.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-1 leading-relaxed whitespace-pre-wrap break-words">
                    {pin.message?.content}
                  </p>
                </div>
              </div>

              {/* Unpin action */}
              <button
                onClick={() => togglePin(pin.messageId)}
                className="absolute top-2 right-2 text-zinc-500 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-rose-500/10 rounded"
                title="Unpin message"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
