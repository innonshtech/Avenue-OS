import http from 'http';
import app from './app';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { initStandupReminderCron } from './jobs/standupReminderJob';

dotenv.config();

const PORT = process.env.PORT || 5000;

export const prisma = new PrismaClient();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://innonsh-sprintos-frontend.vercel.app',
      'https://sprintos.innonsh.com',
      process.env.FRONTEND_URL || ''
    ].filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

async function startServer() {
  try {
    // Connect to Database
    await prisma.$connect();
    console.log('Connected to PostgreSQL Database via Prisma.');

    // Initialize daily standup reminder cron job
    initStandupReminderCron();
    console.log('Daily standup reminder cron job initialized.');

    server.listen(PORT, () => {
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
