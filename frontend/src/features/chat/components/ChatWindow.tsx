import React, { useRef, useEffect } from 'react';
import { useChannelMessages, type Channel, type Message } from '../api/chatApi';
import { useChatStore } from '../store/chatStore';
import { useMessages } from '../hooks/useMessages';
import { MessageBubble } from './MessageBubble';
import { MessageEditor } from './MessageEditor';
import { format, isSameDay, isToday, isYesterday, formatDistanceToNow } from 'date-fns';
import { TypingIndicator } from './TypingIndicator';
import { AnnouncementBanner } from './AnnouncementBanner';
import { ChatContextualHeader } from './ChatContextualHeader';
import { Pin, Search, Users, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '@/features/auth/store/authStore';

interface ChatWindowProps {
  channel: Channel;
  onConvertTask: (message: any) => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({ channel, onConvertTask }) => {
  const { data: messages = [], isLoading } = useChannelMessages(channel.id);
  const { sendMessage, triggerReadReceipt } = useMessages();
  const { setPinsOpen, pinsOpen, userPresences } = useChatStore();
  const { user } = useAuthStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  const getOtherMember = () => {
    if (channel.type !== 'DIRECT') return null;
    return channel.members?.find((m) => m.userId !== user?.id);
  };
  const otherMember = getOtherMember();
  const presence = otherMember ? userPresences[otherMember.userId] || 'OFFLINE' : null;
  const lastSeenText = otherMember?.lastSeenAt 
    ? `Last seen ${formatDistanceToNow(new Date(otherMember.lastSeenAt), { addSuffix: true })}` 
    : 'Offline';

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // Trigger read receipt when new messages are loaded
    triggerReadReceipt();
  }, [messages, channel.id]);

  const handleSendMessage = (content: string) => {
    sendMessage(content);
  };

  // Extract latest announcement if any for banner display
  const announcementMsg = channel.type === 'ANNOUNCEMENT' && messages.length > 0
    ? messages[messages.length - 1]
    : null;

  return (
    <div className="flex-1 flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <header className="h-14 border-b border-zinc-200 flex items-center justify-between px-6 bg-white flex-shrink-0 z-[10]">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-[15px] text-zinc-900 truncate leading-tight">
              {channel.type === 'DIRECT' ? `DM: ${channel.name}` : `#${channel.name}`}
            </span>
            <span className="text-xs uppercase font-extrabold px-1.5 py-0.5 rounded tracking-wider bg-zinc-100 border border-zinc-200 text-zinc-500">
              {channel.type}
            </span>
          </div>
          {channel.type === 'DIRECT' && otherMember ? (
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${presence === 'ONLINE' ? 'bg-emerald-500' : presence === 'AWAY' ? 'bg-amber-500' : 'bg-zinc-300'}`} />
              <p className="text-xs text-zinc-500 truncate max-w-md font-medium">
                {presence === 'ONLINE' ? 'Online' : presence === 'AWAY' ? 'Away' : lastSeenText}
              </p>
            </div>
          ) : channel.description ? (
            <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-md font-medium">
              {channel.description}
            </p>
          ) : null}
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setPinsOpen(!pinsOpen)}
            className={`text-zinc-500 hover:text-zinc-900 transition-colors p-1.5 rounded-lg hover:bg-zinc-100 focus:outline-none flex items-center gap-1 text-[13px] font-semibold border border-transparent hover:border-zinc-200 ${
              pinsOpen ? 'bg-zinc-100 border-zinc-300 text-zinc-900' : ''
            }`}
            title="View pinned notes"
          >
            <Pin className="w-4 h-4 fill-transparent" />
            <span>Pins</span>
          </button>
        </div>
      </header>

      {/* Contextual Header for Tasks/Blockers */}
      {(channel.type === 'TASK' || channel.type === 'RFI') && channel.taskId && (
        <ChatContextualHeader channel={channel} />
      )}

      {/* Announcement Banner */}
      {announcementMsg && (
        <AnnouncementBanner
          content={announcementMsg.content}
          senderName={announcementMsg.sender?.name}
        />
      )}

      {/* Messages Scroll Panel */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin" ref={scrollRef}>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-full gap-2.5">
            <span className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-zinc-500 font-semibold tracking-tight">Syncing operational history...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs font-medium gap-2">
            <ShieldAlert className="w-10 h-10 text-zinc-700" />
            This is the start of the discussion thread.
          </div>
        ) : (
          messages.reduce((acc: React.ReactNode[], message: Message, index: number) => {
            const currentDate = new Date(message.createdAt);
            const prevMessage = index > 0 ? messages[index - 1] : null;
            const prevDate = prevMessage ? new Date(prevMessage.createdAt) : null;
            
            const showDateSeparator = !prevDate || !isSameDay(currentDate, prevDate);
            
            if (showDateSeparator) {
              const dateText = isToday(currentDate) 
                ? 'Today' 
                : isYesterday(currentDate) 
                  ? 'Yesterday' 
                  : format(currentDate, 'MMMM d, yyyy');
                  
              acc.push(
                <div key={`date-${message.id}`} className="flex items-center my-6">
                  <div className="flex-1 h-px bg-zinc-200"></div>
                  <span className="px-4 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">{dateText}</span>
                  <div className="flex-1 h-px bg-zinc-200"></div>
                </div>
              );
            }
            
            acc.push(
              <MessageBubble
                key={message.id}
                message={message}
                onConvertTask={onConvertTask}
              />
            );
            
            return acc;
          }, [])
        )}
      </div>

      {/* Typing indicators */}
      <div className="px-6 py-1 bg-white flex-shrink-0">
        <TypingIndicator />
      </div>

      {/* Editor footer */}
      <div className="p-4 bg-white border-t border-zinc-200 flex-shrink-0">
        <MessageEditor
          onSend={handleSendMessage}
          placeholder={
            channel.type === 'ANNOUNCEMENT'
              ? 'Only admins can post announcements...'
              : `Message #${channel.name}...`
          }
        />
      </div>
    </div>
  );
};
