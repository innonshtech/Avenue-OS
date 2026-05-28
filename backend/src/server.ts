import http from 'http';
import app from './app';
import dotenv from 'dotenv';
import prisma from './utils/prisma';
import { initStandupReminderCron } from './jobs/standupReminderJob';
import { initSocketServer } from './sockets/socket.server';

dotenv.config();

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize the socket server
initSocketServer(server);

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
