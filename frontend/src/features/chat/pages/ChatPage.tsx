import React, { useState, useEffect } from 'react';
import { useChatStore } from '../store/chatStore';
import { useChannels, useDMHistory, type Channel, type Message } from '../api/chatApi';
import { useChatSocket } from '../hooks/useChatSocket';
import { ChatSidebar } from '../components/ChatSidebar';
import { ChatWindow } from '../components/ChatWindow';
import { ThreadPanel } from '../components/ThreadPanel';
import { PinnedMessagesPanel } from '../components/PinnedMessagesPanel';
import { ChatSearchPanel } from '../components/ChatSearchPanel';
import { CreateTaskModal } from '@/features/tasks/components/CreateTaskModal';
import { AlertCircle, MessageSquare } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';

export default function ChatPage() {
  const {
    activeChannelId,
    setActiveChannelId,
    activeThreadMessage,
    setActiveThreadMessage,
    pinsOpen,
    searchOpen,
    setSearchOpen,
  } = useChatStore();

  const { data: channels = [], isLoading } = useChannels();
  const startDMMutation = useDMHistory();
  const queryClient = useQueryClient();

  const activeChannel = channels.find((c) => c.id === activeChannelId) || null;

  // Task Conversion state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [prefillTitle, setPrefillTitle] = useState('');
  const [prefillDesc, setPrefillDesc] = useState('');

  // Start the socket listeners and room sub hooks
  useChatSocket();

  // Expose a global hook on window to initiate DMs from sidebar click easily
  useEffect(() => {
    (window as any)._startDMUser = async (userId: string) => {
      try {
        const { channel } = await startDMMutation.mutateAsync(userId);
        // Refresh channels list
        await queryClient.invalidateQueries({ queryKey: ['chat-channels'] });
        setActiveChannelId(channel.id);
      } catch (err) {
        console.error('Failed to start direct message:', err);
      }
    };

    return () => {
      delete (window as any)._startDMUser;
    };
  }, [startDMMutation, setActiveChannelId, queryClient]);

  // Convert Chat Message to Task Prefills trigger
  const handleConvertTask = (msg: Message) => {
    setPrefillTitle(msg.content);
    setPrefillDesc(
      `Converted from operational discussion thread.\nOriginal Author: ${msg.sender?.name || 'Unknown'}\nMessage ID: ${msg.id}`
    );
    setTaskModalOpen(true);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative">
      {/* 1. Sidebar */}
      <ChatSidebar onSearchOpen={() => setSearchOpen(true)} />

      {/* 2. Main Window area */}
      <div className="flex-1 flex overflow-hidden bg-zinc-950">
        {activeChannel ? (
          <ChatWindow
            channel={activeChannel}
            onConvertTask={handleConvertTask}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-xs font-semibold gap-3 p-8">
            <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center border border-indigo-500/25">
              <MessageSquare className="w-6 h-6 text-indigo-400" />
            </div>
            <span>Select a task discussion, project channel, or start a DM to collaborate.</span>
          </div>
        )}

        {/* 3. Thread reply panel overlay */}
        {activeThreadMessage && (
          <ThreadPanel onConvertTask={handleConvertTask} />
        )}

        {/* 4. Pinned messages overlay */}
        {pinsOpen && activeChannel && (
          <PinnedMessagesPanel
            channelId={activeChannel.id}
            onClose={() => useChatStore.getState().setPinsOpen(false)}
          />
        )}
      </div>

      {/* 5. Fuzzy Search overlay modal */}
      {searchOpen && (
        <ChatSearchPanel onClose={() => setSearchOpen(false)} />
      )}

      {/* 6. Convert to Task Pre-filled Form modal */}
      <CreateTaskModal
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        defaultTitle={prefillTitle}
        defaultDescription={prefillDesc}
      />
    </div>
  );
}
