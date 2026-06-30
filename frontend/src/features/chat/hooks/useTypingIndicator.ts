import { useRef, useEffect } from 'react';
import { useSocket } from '../../realtime/SocketProvider';
import { useChatStore } from '../store/chatStore';

export const useTypingIndicator = () => {
  const { socket } = useSocket();
  const { activeChannelId } = useChatStore();
  const typingTimeoutRef = useRef<any | null>(null);
  const isTypingRef = useRef<boolean>(false);

  // Send typing status to server
  const sendTypingStatus = (isTyping: boolean) => {
    if (!socket || !activeChannelId) return;

    socket.emit('chat:typing', {
      channelId: activeChannelId,
      isTyping,
    });
    isTypingRef.current = isTyping;
  };

  const handleKeyPress = () => {
    if (!socket || !activeChannelId) return;

    // If not typing currently, emit typing started
    if (!isTypingRef.current) {
      sendTypingStatus(true);
    }

    // Reset stop typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTypingStatus(false);
    }, 2000);
  };

  // Cleanup on unmount or active channel change
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        sendTypingStatus(false);
      }
    };
  }, [activeChannelId]);

  return {
    handleKeyPress,
  };
};
