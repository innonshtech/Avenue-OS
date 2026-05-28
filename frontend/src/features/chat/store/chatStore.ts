import { create } from 'zustand';
import type { Channel, Message } from '../api/chatApi';

interface ChatState {
  activeChannelId: string | null;
  activeThreadMessage: Message | null;
  userPresences: Record<string, 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE'>;
  typingUsers: Record<string, { userName: string; isTyping: boolean }>;
  searchOpen: boolean;
  pinsOpen: boolean;
  
  setActiveChannelId: (id: string | null) => void;
  setActiveThreadMessage: (message: Message | null) => void;
  setUserPresence: (userId: string, status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE') => void;
  setAllUserPresences: (presences: Record<string, 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE'>) => void;
  setTypingUser: (channelId: string, userId: string, userName: string, isTyping: boolean) => void;
  clearTypingUsers: () => void;
  setSearchOpen: (open: boolean) => void;
  setPinsOpen: (open: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeChannelId: null,
  activeThreadMessage: null,
  userPresences: {},
  typingUsers: {},
  searchOpen: false,
  pinsOpen: false,

  setActiveChannelId: (id) => set({ activeChannelId: id }),
  setActiveThreadMessage: (message) => set({ activeThreadMessage: message }),
  setUserPresence: (userId, status) =>
    set((state) => ({
      userPresences: { ...state.userPresences, [userId]: status },
    })),
  setAllUserPresences: (presences) => set({ userPresences: presences }),
  setTypingUser: (channelId, userId, userName, isTyping) =>
    set((state) => {
      const currentTyping = { ...state.typingUsers };
      if (isTyping) {
        currentTyping[userId] = { userName, isTyping };
      } else {
        delete currentTyping[userId];
      }
      return { typingUsers: currentTyping };
    }),
  clearTypingUsers: () => set({ typingUsers: {} }),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setPinsOpen: (open) => set({ pinsOpen: open }),
}));
