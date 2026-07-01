import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { TokenService } from '../modules/auth/token.service';
import { handleSocketConnection } from './socket.handlers';

let io: Server | null = null;

// Extends Socket to include authenticated user details
export interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    role: string;
    email: string;
  };
}

const parseCookies = (cookieString?: string): Record<string, string> => {
  const cookies: Record<string, string> = {};
  if (!cookieString) return cookies;
  cookieString.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    const name = parts[0].trim();
    const val = parts.slice(1).join('=');
    if (name && val) {
      cookies[name] = decodeURIComponent(val);
    }
  });
  return cookies;
};

export const initSocketServer = (server: HTTPServer): Server => {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'https://avenue-os-frontend.vercel.app',
        process.env.FRONTEND_URL || '',
      ].filter(Boolean),
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  // Socket.IO authentication middleware
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      // 1. Check handshake auth
      let token = socket.handshake.auth?.token;

      // 2. Check query string
      if (!token && socket.handshake.query?.token) {
        token = socket.handshake.query.token as string;
      }

      // If token is the placeholder token, ignore it to fallback to cookie authentication
      if (token === 'sprintos-cookie-token') {
        token = undefined;
      }

      // 3. Check authorization header
      if (!token && socket.handshake.headers?.authorization) {
        const parts = socket.handshake.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }

      // 4. Check cookies
      if (!token && socket.handshake.headers?.cookie) {
        const cookies = parseCookies(socket.handshake.headers.cookie);
        token = cookies['accessToken'];
      }

      if (!token) {
        return next(new Error('Authentication token missing'));
      }

      const decoded = TokenService.verifyAccessToken(token);
      socket.user = {
        id: decoded.userId,
        role: decoded.role,
        email: decoded.email,
      };

      next();
    } catch (err) {
      next(new Error('Authentication failed: Invalid or expired token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    handleSocketConnection(socket);
  });

  console.log('⚡ Socket.IO server initialized successfully.');
  return io;
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error('Socket.IO is not initialized. Please call initSocketServer first.');
  }
  return io;
};
