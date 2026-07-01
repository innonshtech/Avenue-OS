import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../auth/store/authStore';
import { useToast } from '@/hooks/use-toast';

interface SocketContextType {
  socket: Socket | null;
  joinProject: (projectId: string) => void;
  leaveProject: (projectId: string) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  joinProject: () => {},
  leaveProject: () => {},
});

export const useSocket = () => useContext(SocketContext);

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1').replace('/api/v1', '');

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { isAuthenticated, token } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const isVercel = BACKEND_URL.includes('vercel.app');
    const transports = isVercel ? ['polling'] : ['websocket', 'polling'];

    const socket = io(BACKEND_URL, {
      withCredentials: true,
      transports,
      auth: {
        token,
      },
      query: {
        token: token || '',
      },
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('⚡ Connected to SprintOS Real-Time Engine (Socket ID:', socket.id, ')');
    });

    socket.on('disconnect', () => {
      console.log('🔌 Disconnected from SprintOS Real-Time Engine');
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️ Real-Time connection error:', error.message);
    });

    // 1. Task Updates Event
    socket.on('task:updated', (data: { action: string; taskId: string; projectId: string }) => {
      console.log('🔄 Live task update:', data);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (data.taskId) {
        queryClient.invalidateQueries({ queryKey: ['task', data.taskId] });
      }
    });

    // 2. Blocker Added Event
    socket.on('blocker:added', (data: { blocker: any; projectId: string; taskId: string }) => {
      console.log('⚠️ Live blocker added:', data);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (data.taskId) {
        queryClient.invalidateQueries({ queryKey: ['task', data.taskId] });
      }
      toast({
        variant: 'destructive',
        title: 'New Blocker Reported',
        description: data.blocker.description,
      });
    });

    // 3. Blocker Resolved Event
    socket.on('blocker:resolved', (data: { blockerId: string; projectId: string; taskId: string }) => {
      console.log('✅ Live blocker resolved:', data);
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (data.taskId) {
        queryClient.invalidateQueries({ queryKey: ['task', data.taskId] });
      }
    });

    // 4. Standup Submitted Event
    socket.on('standup:submitted', (data: { standup: any; projectId: string | null; sprintId: string | null }) => {
      console.log('📝 Live standup update:', data);
      queryClient.invalidateQueries({ queryKey: ['standups'] });
      queryClient.invalidateQueries({ queryKey: ['my-standups'] });
      queryClient.invalidateQueries({ queryKey: ['team-standups'] });
    });

    // 5. Threaded Comments Events
    socket.on('comment:new', (data: { comment: any; taskId: string; projectId: string }) => {
      console.log('💬 Live new comment:', data);
      queryClient.invalidateQueries({ queryKey: ['task', data.taskId] });
      queryClient.invalidateQueries({ queryKey: ['comments', data.taskId] });
    });

    socket.on('comment:updated', (data: { comment: any; taskId: string }) => {
      console.log('✏️ Live comment update:', data);
      queryClient.invalidateQueries({ queryKey: ['task', data.taskId] });
      queryClient.invalidateQueries({ queryKey: ['comments', data.taskId] });
    });

    socket.on('comment:deleted', (data: { commentId: string; taskId: string }) => {
      console.log('🗑️ Live comment delete:', data);
      queryClient.invalidateQueries({ queryKey: ['task', data.taskId] });
      queryClient.invalidateQueries({ queryKey: ['comments', data.taskId] });
    });

    socket.on('reaction:updated', (data: { commentId: string; taskId: string; reactions: any[] }) => {
      console.log('😀 Live reaction update:', data);
      queryClient.invalidateQueries({ queryKey: ['task', data.taskId] });
      queryClient.invalidateQueries({ queryKey: ['comments', data.taskId] });
    });

    // 6. In-App Notifications Broadcast
    socket.on('notification:new', (notification: { id: string; title: string; message: string; linkUrl: string | null }) => {
      console.log('🔔 Live notification received:', notification);
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      toast({
        title: notification.title,
        description: notification.message,
      });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isAuthenticated, token, queryClient, toast]);

  const joinProject = (projectId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('join:project', { projectId });
    }
  };

  const leaveProject = (projectId: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('leave:project', { projectId });
    }
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, joinProject, leaveProject }}>
      {children}
    </SocketContext.Provider>
  );
};
