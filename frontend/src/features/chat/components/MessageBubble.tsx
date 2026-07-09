import React, { useState } from 'react';
import type { Message } from '../api/chatApi';
import { useAuthStore } from '@/features/auth/store/authStore';
import { useChatStore } from '../store/chatStore';
import { useMessages } from '../hooks/useMessages';
import { useChannels } from '../api/chatApi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Pin,
  PinOff,
  Edit2,
  Trash2,
  CheckCircle,
  MoreHorizontal,
  Smile,
  Zap,
  Check,
  CheckCheck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EmojiPicker } from './EmojiPicker';
import ReactMarkdown from 'react-markdown';

interface MessageBubbleProps {
  message: Message;
  onConvertTask: (message: Message) => void;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onConvertTask }) => {
  const { user } = useAuthStore();
  const { setActiveThreadMessage } = useChatStore();
  const { editMessage, deleteMessage, addReaction, removeReaction, togglePin } = useMessages();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const navigate = useNavigate();
  const { data: channels = [] } = useChannels();

  const isOwnMessage = message.senderId === user?.id;
  const isSystem = message.messageType === 'SYSTEM';

  // Check if message is read by at least one other member
  const channel = channels.find(c => c.id === message.channelId);
  const isReadByOthers = channel?.members?.some(
    m => m.userId !== user?.id && m.lastSeenAt && new Date(m.lastSeenAt) >= new Date(message.createdAt)
  );

  const handleEdit = () => {
    if (!editContent.trim()) return;
    editMessage(message.id, editContent.trim());
    setIsEditing(false);
  };

  const handleReactionClick = (emoji: string) => {
    const existingReaction = message.reactions?.find(
      (r) => r.emoji === emoji && r.userId === user?.id
    );
    if (existingReaction) {
      removeReaction(message.id, emoji);
    } else {
      addReaction(message.id, emoji);
    }
  };

  // 1. Contextual Entity Linking Parser
  const parseEntityContent = (text: string) => {
    // Regex matches: TASK-123 or SPS-1 or HRMS-3 (standard sprintos key formats)
    // Matches SPRINT-123
    // Matches PROJECT-SPS or PROJECT-HRMS
    // Matches @Name
    const tokens: React.ReactNode[] = [];
    const entityRegex = /(@[a-zA-Z0-9_\-\.]+)|(PROJECT-[A-Z0-9]+)|(TARGET-[A-Z0-9\-]+)|([A-Z]+-[0-9]+)/gi;

    let lastIndex = 0;
    let match;

    while ((match = entityRegex.exec(text)) !== null) {
      const matchText = match[0];
      const matchIndex = match.index;

      // Push preceding text
      if (matchIndex > lastIndex) {
        tokens.push(text.slice(lastIndex, matchIndex));
      }

      if (matchText.startsWith('@')) {
        // Render mention highlight
        tokens.push(
          <span key={matchIndex} className="px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-400 font-semibold text-xs border border-indigo-500/10">
            {matchText}
          </span>
        );
      } else if (matchText.toUpperCase().startsWith('PROJECT-')) {
        const key = matchText.split('-')[1];
        tokens.push(
          <Link
            key={matchIndex}
            to={`/dashboard/projects`}
            className="px-1.5 py-0.5 rounded bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-600/20 transition-all font-bold text-xs"
          >
            {matchText}
          </Link>
        );
      } else if (matchText.toUpperCase().startsWith('TARGET-')) {
        tokens.push(
          <Link
            key={matchIndex}
            to={`/dashboard/targets`}
            className="px-1.5 py-0.5 rounded bg-amber-600/10 text-amber-400 border border-amber-500/20 hover:bg-amber-600/20 transition-all font-bold text-xs"
          >
            {matchText}
          </Link>
        );
      } else {
        // Task reference (e.g. SPS-1 or TASK-102)
        tokens.push(
          <Link
            key={matchIndex}
            to={`/dashboard/tasks`}
            className="px-1.5 py-0.5 rounded bg-blue-600/10 text-blue-400 border border-blue-500/20 hover:bg-blue-600/20 transition-all font-bold text-xs inline-flex items-center gap-1"
          >
            <Zap className="w-3 h-3 text-blue-400" />
            {matchText}
          </Link>
        );
      }

      lastIndex = entityRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      tokens.push(text.slice(lastIndex));
    }

    return tokens.length > 0 ? tokens : text;
  };

  if (isSystem) {
    return (
      <div className="flex items-center justify-center gap-2 py-2 text-[13px] text-zinc-500 font-semibold">
        <span className="w-8 h-px bg-zinc-200" />
        <span>{message.content}</span>
        <span className="w-8 h-px bg-zinc-200" />
      </div>
    );
  }

  const isPinned = !!message.pinnedMessage;

  return (
    <div className={`group flex items-start gap-3 p-3 rounded-xl transition-all relative ${
      isPinned 
      ? 'bg-amber-500/5 border border-amber-500/10' 
      : 'hover:bg-zinc-50 border border-transparent'
    }`}>
      {/* Avatar */}
      <Avatar className="w-9 h-9">
        <AvatarImage src={message.sender?.avatar} alt={message.sender?.name} />
        <AvatarFallback className="text-xs font-bold bg-zinc-200 text-zinc-600">
          {message.sender?.name?.substring(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>

      {/* Message content panel */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[13px] text-zinc-900 leading-tight">
            {message.sender?.name}
          </span>
          <span className="text-xs text-zinc-500 font-medium leading-none">
            {format(new Date(message.createdAt), 'h:mm a')}
          </span>
          {message.isEdited && (
            <span className="text-xs text-zinc-500 font-medium italic">
              (edited)
            </span>
          )}
          {isPinned && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-500/20 font-bold">
              <Pin className="w-2.5 h-2.5 fill-amber-500" />
              Pinned
            </span>
          )}
          {isOwnMessage && (
            <span className="ml-1" title={isReadByOthers ? "Read" : "Delivered"}>
              {isReadByOthers ? (
                <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
              ) : (
                <Check className="w-3.5 h-3.5 text-zinc-500" />
              )}
            </span>
          )}
        </div>

        {/* Content body */}
        <div className="mt-1.5 text-zinc-800 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
          {isEditing ? (
            <div className="space-y-2 mt-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-lg p-2 text-[15px] focus:outline-none focus:border-indigo-500 text-zinc-900 resize-none"
                rows={2}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEdit}
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1 hover:bg-zinc-100 text-zinc-600 text-[13px] font-semibold rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              {parseEntityContent(message.content)}
            </div>
          )}
        </div>

        {/* Reactions List */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {Object.entries(
              message.reactions.reduce((acc, r) => {
                if (!acc[r.emoji]) acc[r.emoji] = [];
                acc[r.emoji].push(r.userId);
                return acc;
              }, {} as Record<string, string[]>)
            ).map(([emoji, userIds]) => {
              const hasReacted = userIds.includes(user?.id || '');
              return (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[13px] transition-all ${
                    hasReacted
                      ? 'bg-indigo-50 border-indigo-200 text-indigo-600 font-bold scale-[1.02]'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                  }`}
                >
                  <span>{emoji}</span>
                  <span className="text-xs">{userIds.length}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Thread replies preview link */}
        {message._count?.replies && message._count.replies > 0 ? (
          <button
            onClick={() => setActiveThreadMessage(message)}
            className="flex items-center gap-1.5 mt-2.5 text-[13px] text-indigo-600 hover:text-indigo-500 font-semibold transition-colors group/link focus:outline-none"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{message._count.replies} {message._count.replies === 1 ? 'reply' : 'replies'}</span>
            <span className="opacity-0 group-hover/link:opacity-100 transition-opacity text-xs">
              → view thread
            </span>
          </button>
        ) : null}
      </div>

      {/* Floating Toolbar on Hover */}
      {!isEditing && (
        <div className="absolute -top-3.5 right-4 flex items-center bg-white border border-zinc-200 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all p-0.5 divide-x divide-zinc-200 z-[10]">
          {/* Reaction shortcut quick bar */}
          <div className="flex items-center px-1">
            {['👍', '🔥', '✅'].map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReactionClick(emoji)}
                className="hover:bg-zinc-100 p-1 rounded text-[13px] transition-colors"
              >
                {emoji}
              </button>
            ))}
            <EmojiPicker
              onEmojiSelect={(emoji) => handleReactionClick(emoji)}
              trigger={
                <button className="text-zinc-500 hover:text-zinc-900 p-1 rounded hover:bg-zinc-100 focus:outline-none">
                  <Smile className="w-3.5 h-3.5" />
                </button>
              }
            />
          </div>

          <div className="flex items-center px-1 gap-0.5">
            {/* Thread replies */}
            <button
              onClick={() => setActiveThreadMessage(message)}
              className="text-zinc-500 hover:text-zinc-900 p-1 hover:bg-zinc-100 rounded focus:outline-none"
              title="Reply in thread"
            >
              <MessageSquare className="w-3.5 h-3.5" />
            </button>

            {/* Convert to Task */}
            {user?.role !== 'CLIENT' && (
              <button
                onClick={() => onConvertTask(message)}
                className="text-zinc-500 hover:text-indigo-600 p-1 hover:bg-indigo-50 rounded focus:outline-none"
                title="Convert to operational Task"
              >
                <CheckCircle className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Options Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="text-zinc-500 hover:text-zinc-900 p-1 hover:bg-zinc-100 rounded focus:outline-none">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => togglePin(message.id)} className="cursor-pointer">
                  {isPinned ? (
                    <>
                      <PinOff className="w-4 h-4 mr-2" />
                      <span>Unpin message</span>
                    </>
                  ) : (
                    <>
                      <Pin className="w-4 h-4 mr-2" />
                      <span>Pin message</span>
                    </>
                  )}
                </DropdownMenuItem>
                
                {isOwnMessage && (
                  <>
                    <DropdownMenuItem onClick={() => setIsEditing(true)} className="cursor-pointer">
                      <Edit2 className="w-4 h-4 mr-2" />
                      <span>Edit message</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => deleteMessage(message.id)}
                      className="cursor-pointer text-rose-500 focus:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      <span>Delete message</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </div>
  );
};
