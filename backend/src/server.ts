import 'dotenv/config';
import http from 'http';
import app from './app';
import prisma from './utils/prisma';
import { initProgressReportReminderCron } from './jobs/progressReportReminderJob';
import { initSocketServer } from './sockets/socket.server';

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize the socket server
initSocketServer(server);

async function startServer() {
  try {
    // Connect to Database
    await prisma.$connect();
    console.log('Connected to PostgreSQL Database via Prisma.');

    // Initialize daily progress report reminder cron job
    initProgressReportReminderCron();
    console.log('Daily progress report reminder cron job initialized.');
    console.log('Daily slack cron job initialized.');

    server.listen(PORT, () => {
      console.log('🚀 Server running on port ${PORT}');
      console.log('🔄 Dashboard overview controllers reloaded!');
      console.log(`Server is running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

startServer();
