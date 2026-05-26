import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import projectRoutes from './routes/projectRoutes';
import sprintRoutes from './routes/sprintRoutes';
import taskRoutes from './routes/taskRoutes';
import standupRoutes from './routes/standupRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import reportsRoutes from './routes/reportsRoutes';
import feedbacksRoutes from './routes/feedbacksRoutes';
import teamRoutes from './routes/teamRoutes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import memberDashboardRoutes from './routes/memberDashboardRoutes';
import memberReportRoutes from './routes/memberReportRoutes';
import memberFeedbackRoutes from './routes/memberFeedbackRoutes';
import adminRoutes from './modules/admin/admin.routes';
import { extractUserContext } from './middleware/authMiddleware';

const app: Application = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000', 
    'http://localhost:5173', 
    'http://localhost:5174',
    'https://innonsh-sprintos-frontend.vercel.app',
    process.env.FRONTEND_URL || ''
  ].filter(Boolean),
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(extractUserContext);

// Health check route
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Innonsh SprintOS API is running.' });
});

// Root route
app.get('/', (req: Request, res: Response) => {
  res.status(200).send('Welcome to Innonsh SprintOS API');
});

// API Routes
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/sprints', sprintRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/standups', standupRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/feedbacks', feedbacksRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1', memberDashboardRoutes);
app.use('/api/v1/member-reports', memberReportRoutes);
app.use('/api/v1/member-feedbacks', memberFeedbackRoutes);
app.use('/api/v1/admin', adminRoutes);

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
});

export default app;
