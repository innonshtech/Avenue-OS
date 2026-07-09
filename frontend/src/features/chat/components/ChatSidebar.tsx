import React from 'react';
import { useChannels, type Channel } from '../api/chatApi';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '@/features/auth/store/authStore';
import { OnlineStatus } from './OnlineStatus';
import {
  MessageSquare,
  Megaphone,
  Briefcase,
  Layers,
  CheckCircle,
  AlertOctagon,
  Search,
  Plus,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useTeam } from '@/features/team/api/teamApi';

interface ChatSidebarProps {
  onSearchOpen: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({ onSearchOpen }) => {
  const { user: currentUser } = useAuthStore();
  const { data: channels = [], isLoading: isLoadingChannels } = useChannels();
  const { data: teamMembers = [] } = useTeam();
  const { activeChannelId, setActiveChannelId, userPresences } = useChatStore();

  // Helper to extract DM recipient profile
  const getDMRecipient = (channel: Channel) => {
    const members = channel.members || [];
    const other = members.find((m) => m.userId !== currentUser?.id);
    return other?.user || { id: '', name: 'Unknown Member', avatar: '' };
  };

  const sortByLatest = (a: Channel, b: Channel) => {
    const timeA = a.messages?.[0]?.createdAt ? new Date(a.messages[0].createdAt).getTime() : new Date(a.createdAt).getTime();
    const timeB = b.messages?.[0]?.createdAt ? new Date(b.messages[0].createdAt).getTime() : new Date(b.createdAt).getTime();
    return timeB - timeA;
  };

  const announcements = channels.filter((c) => c.type === 'ANNOUNCEMENT').sort(sortByLatest);
  const dms = channels.filter((c) => c.type === 'DIRECT').sort(sortByLatest);
  const projectChannels = channels.filter((c) => c.type === 'PROJECT').sort(sortByLatest);
  const targetChannels = channels.filter((c) => c.type === 'TARGET').sort(sortByLatest);
  const recentDiscussions = channels.filter((c) => c.type === 'TASK' || c.type === 'RFI').sort(sortByLatest);

  return (
    <div className="w-64 border-r border-zinc-200 bg-white flex flex-col h-full overflow-hidden select-none">
      {/* Search Header */}
      <div className="p-4 border-b border-zinc-200 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <MessageSquare className="w-5 h-5 text-indigo-500 fill-indigo-500/20" />
        </div>

        <button
          onClick={onSearchOpen}
          className="flex items-center gap-2.5 px-3 py-2 w-full bg-zinc-100 border border-zinc-200/80 hover:border-zinc-300 rounded-lg text-left text-zinc-500 hover:text-zinc-600 transition-all focus:outline-none"
        >
          <Search className="w-4 h-4" />
          <span className="text-[13px] font-semibold">Fuzzy find discussions...</span>
        </button>
      </div>

      {/* Categories scroll area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-5 scrollbar-thin">
        {isLoadingChannels ? (
          <div className="flex items-center justify-center py-10">
            <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Announcements */}
            {announcements.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider px-2.5 mb-1.5 flex items-center justify-between">
                  <span>Announcements</span>
                  <Megaphone className="w-3.5 h-3.5" />
                </div>
                {announcements.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveChannelId(c.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left text-[13px] font-semibold rounded-lg transition-all focus:outline-none ${
                      activeChannelId === c.id
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-500/10'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent'
                    }`}
                  >
                    <Megaphone className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate flex-1">{c.name}</span>
                    {c._count?.unread ? (
                      <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                        {c._count.unread}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            )}

            {/* Project Channels */}
            <div className="space-y-1">
              <div className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider px-2.5 mb-1.5 flex items-center justify-between">
                <span>Projects</span>
                <Briefcase className="w-3.5 h-3.5" />
              </div>
              {projectChannels.length === 0 ? (
                <div className="text-xs text-zinc-400 italic px-2.5">No active project rooms</div>
              ) : (
                projectChannels.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveChannelId(c.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left text-[13px] font-semibold rounded-lg transition-all focus:outline-none ${
                      activeChannelId === c.id
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-500/10'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent'
                    }`}
                  >
                    <span className="font-extrabold text-xs text-indigo-500 flex-shrink-0">#</span>
                    <span className="truncate flex-1">{c.name}</span>
                    {c._count?.unread ? (
                      <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                        {c._count.unread}
                      </span>
                    ) : null}
                  </button>
                ))
              )}
            </div>

            {/* Target Channels */}
            <div className="space-y-1">
              <div className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider px-2.5 mb-1.5 flex items-center justify-between">
                <span>Targets</span>
                <Layers className="w-3.5 h-3.5" />
              </div>
              {targetChannels.length === 0 ? (
                <div className="text-xs text-zinc-400 italic px-2.5">No active target rooms</div>
              ) : (
                targetChannels.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveChannelId(c.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left text-[13px] font-semibold rounded-lg transition-all focus:outline-none ${
                      activeChannelId === c.id
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-500/10'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                    <span className="truncate flex-1">{c.name}</span>
                    {c._count?.unread ? (
                      <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                        {c._count.unread}
                      </span>
                    ) : null}
                  </button>
                ))
              )}
            </div>

            {/* Recent Discussions */}
            <div className="space-y-1">
              <div className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider px-2.5 mb-1.5 flex items-center justify-between">
                <span>Recent Discussions</span>
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              {recentDiscussions.length === 0 ? (
                <div className="text-xs text-zinc-400 italic px-2.5">No recent discussions</div>
              ) : (
                recentDiscussions.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveChannelId(c.id)}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 text-left text-[13px] font-semibold rounded-lg transition-all focus:outline-none ${
                      activeChannelId === c.id
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-500/10'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent'
                    }`}
                  >
                    {c.type === 'RFI' ? (
                      <AlertOctagon className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    )}
                    <span className="truncate flex-1">{c.name}</span>
                    {c._count?.unread ? (
                      <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                        {c._count.unread}
                      </span>
                    ) : null}
                  </button>
                ))
              )}
            </div>

            {/* DMs / Members */}
            <div className="space-y-1">
              <div className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider px-2.5 mb-1.5 flex items-center justify-between">
                <span>Direct Messages</span>
                <Users className="w-3.5 h-3.5" />
              </div>
              {dms.map((c) => {
                const recipient = getDMRecipient(c);
                const presence = userPresences[recipient.id] || 'OFFLINE';
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveChannelId(c.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-left text-[13px] font-semibold rounded-lg transition-all focus:outline-none ${
                      activeChannelId === c.id
                        ? 'bg-indigo-50 text-indigo-600 border border-indigo-500/10'
                        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar className="w-5 h-5 flex-shrink-0">
                        <AvatarImage src={recipient.avatar} alt={recipient.name} />
                        <AvatarFallback className="text-[9px] bg-zinc-200 text-zinc-600">
                          {recipient.name?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{recipient.name}</span>
                      {c._count?.unread ? (
                        <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                          {c._count.unread}
                        </span>
                      ) : null}
                    </div>
                    <OnlineStatus status={presence} size="sm" />
                  </button>
                );
              })}
            </div>

            {/* Team Directory for launching DMs */}
            <div className="space-y-1 pt-2 border-t border-zinc-200">
              <div className="text-xs font-extrabold text-zinc-500 uppercase tracking-wider px-2.5 mb-1.5">
                Start DM with Member
              </div>
              {teamMembers.filter((m) => m.id !== currentUser?.id).map((member) => (
                <button
                  key={member.id}
                  onClick={() => {
                    const existingChannel = dms.find((c) =>
                      c.members?.some((m) => m.userId === member.id)
                    );
                    if (existingChannel) {
                      setActiveChannelId(existingChannel.id);
                    } else {
                      (window as any)._startDMUser?.(member.id);
                    }
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-left text-[13px] text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 rounded-lg transition-all focus:outline-none group/dir"
                >
                  <span className="truncate">{member.name}</span>
                  <Plus className="w-3.5 h-3.5 text-zinc-600 group-hover/dir:text-indigo-400 transition-colors" />
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
