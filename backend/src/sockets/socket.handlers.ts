import { AuthenticatedSocket } from './socket.server';
import { SOCKET_EVENTS } from './socket.events';
import prisma from '../utils/prisma';
import { registerChatHandlers } from '../modules/chat/chat.socket';

export const handleSocketConnection = async (socket: AuthenticatedSocket) => {
  const user = socket.user;
  if (!user) {
    socket.disconnect(true);
    return;
  }

  const userId = user.id;
  const userRole = user.role;

  console.log(`🔌 User connected: ${user.email} (Role: ${userRole}, Socket: ${socket.id})`);

  // 1. Join user's private room for direct target notifications
  const privateRoom = `user:${userId}`;
  await socket.join(privateRoom);

  // Register real-time Chat Socket handlers
  registerChatHandlers(socket);

  // 2. If Admin or PM, join organization room for global system broadcasts
  if (userRole === 'ADMIN' || userRole === 'PRODUCT_MANAGER') {
    await socket.join('organization');
  }

  // 3. Listen for project-specific room subscription requests
  socket.on(SOCKET_EVENTS.JOIN_PROJECT, async ({ projectId }: { projectId: string }) => {
    try {
      if (!projectId) return;

      // Restrict access: developers and marketing must belong to the project
      let hasAccess = false;
      if (userRole === 'ADMIN' || userRole === 'PRODUCT_MANAGER') {
        hasAccess = true;
      } else {
        const member = await prisma.projectMember.findUnique({
          where: {
            projectId_userId: {
              projectId,
              userId,
            },
          },
        });
        
        // Also check if they are the owner of the project
        const project = await prisma.project.findUnique({
          where: { id: projectId }
        });

        if (member || (project && project.ownerId === userId)) {
          hasAccess = true;
        }
      }

      if (hasAccess) {
        const roomName = `project:${projectId}`;
        await socket.join(roomName);
        console.log(`👥 Socket ${socket.id} joined room: ${roomName}`);
      } else {
        console.warn(`⚠️ Access denied for user ${user.email} trying to join room project:${projectId}`);
        socket.emit('error', { message: 'Access denied to project room' });
      }
    } catch (error) {
      console.error('Error joining project room:', error);
    }
  });

  // 4. Listen for leaving project-specific room
  socket.on(SOCKET_EVENTS.LEAVE_PROJECT, async ({ projectId }: { projectId: string }) => {
    if (!projectId) return;
    const roomName = `project:${projectId}`;
    await socket.leave(roomName);
    console.log(`👥 Socket ${socket.id} left room: ${roomName}`);
  });

  socket.on(SOCKET_EVENTS.DISCONNECT, () => {
    console.log(`🔌 User disconnected: ${user.email} (Socket: ${socket.id})`);
  });
};
