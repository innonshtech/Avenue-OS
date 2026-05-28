import React, { useRef, useEffect } from 'react';
import { useThreadReplies } from '../api/chatApi';
import { useChatStore } from '../store/chatStore';
import { useMessages } from '../hooks/useMessages';
import { MessageBubble } from './MessageBubble';
import { MessageEditor } from './MessageEditor';
import { X, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

interface ThreadPanelProps {
  onConvertTask: (message: any) => void;
}

export const ThreadPanel: React.FC<ThreadPanelProps> = ({ onConvertTask }) => {
  const { activeThreadMessage, setActiveThreadMessage } = useChatStore();
  const { data: replies = [], isLoading } = useThreadReplies(activeThreadMessage?.id || '', !!activeThreadMessage);
  const { sendMessage } = useMessages();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSendReply = (content: string) => {
    if (!activeThreadMessage) return;
    sendMessage(content, activeThreadMessage.id);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [replies]);

  if (!activeThreadMessage) return null;

  return (
    <div className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2 font-bold text-sm text-white">
          <MessageSquare className="w-4 h-4 text-indigo-500" />
          <span>Thread Discussion</span>
        </div>
        <button
          onClick={() => setActiveThreadMessage(null)}
          className="text-zinc-500 hover:text-zinc-300 transition-colors p-1 rounded hover:bg-zinc-800 focus:outline-none"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Thread messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin" ref={scrollRef}>
        {/* Root Message Bubble (simplified) */}
        <div className="p-3 bg-zinc-900/40 border border-zinc-850 rounded-xl mb-4">
          <div className="flex items-start gap-2.5">
            <Avatar className="w-7 h-7">
              <AvatarImage src={activeThreadMessage.sender?.avatar} alt={activeThreadMessage.sender?.name} />
              <AvatarFallback className="text-[9px] font-bold bg-zinc-800 text-zinc-400">
                {activeThreadMessage.sender?.name?.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-white truncate">
                  {activeThreadMessage.sender?.name}
                </span>
                <span className="text-[8px] text-zinc-500">
                  {formatDistanceToNow(new Date(activeThreadMessage.createdAt), { addSuffix: true })}
                </span>
              </div>
              <p className="text-xs text-zinc-350 mt-1 leading-relaxed break-words whitespace-pre-wrap">
                {activeThreadMessage.content}
              </p>
            </div>
          </div>
        </div>

        <div className="text-[10px] uppercase font-bold text-zinc-500 px-1 border-b border-zinc-900 pb-2 mb-4 tracking-wider">
          Replies ({replies.length})
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-[10px] text-zinc-500">Loading replies...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {replies.map((reply) => (
              <MessageBubble
                key={reply.id}
                message={reply}
                onConvertTask={onConvertTask}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thread reply editor */}
      <div className="p-3 border-t border-zinc-800">
        <MessageEditor
          onSend={handleSendReply}
          placeholder="Reply in thread..."
        />
      </div>
    </div>
  );
};
