import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { cookieParser } from './middleware/cookieParser';
import { extractUserContext } from './middleware/authMiddleware';
import { requireAuth } from './middleware/rbac/requireAuth';

// Routes
import authRoutes from './modules/auth/auth.routes';
import securityRoutes from './modules/security/security.routes';
import projectRoutes from './routes/projectRoutes';
import stageRoutes from './routes/stageRoutes';
import taskRoutes from './routes/taskRoutes';
import progressReportRoutes from './routes/progressReportRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import reportsRoutes from './routes/reportsRoutes';
import feedbacksRoutes from './routes/feedbacksRoutes';
import teamRoutes from './routes/teamRoutes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import memberDashboardRoutes from './routes/memberDashboardRoutes';
import memberReportRoutes from './routes/memberReportRoutes';
import memberFeedbackRoutes from './routes/memberFeedbackRoutes';
import adminRoutes from './modules/admin/admin.routes';
import activityRoutes from './routes/activityRoutes';
import notificationRoutes from './routes/notificationRoutes';
import commentsRouter from './modules/comments/comments.routes';
import searchRouter from './modules/search/search.routes';
import chatRoutes from './modules/chat/chat.routes';
import timesheetRoutes from './routes/timesheetRoutes';
import cronRoutes from './routes/cronRoutes';

const app: Application = express();

// 1. Helmet Security Headers (CSP, XSS, Frameguard, HSTS, MIME Sniff)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://i.pravatar.cc", "https://images.unsplash.com"],
        connectSrc: ["'self'", "http://localhost:5000", "ws://localhost:5000", "https://sbikelegvxoannghlowv.supabase.co"],
      },
    },
    xssFilter: true,
    frameguard: { action: 'deny' },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    noSniff: true,
  })
);

// 2. Strict CORS policy
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'https://avenue-os-frontend.vercel.app',
      process.env.FRONTEND_URL || '',
    ].filter(Boolean),
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// 3. Custom Cookie Parser & User context extractor
app.use(cookieParser);
app.use(extractUserContext);

// 4. Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5000, // Increased for active testing/development
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', generalLimiter);

// 5. Public Health checks and welcome routes
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Innonsh SprintOS API is running.' });
});

app.get('/', (req: Request, res: Response) => {
  res.status(200).send('Welcome to Innonsh SprintOS API');
});

// 6. Mount Auth Routes (Login, Logout, Refresh are open)
app.use('/api/v1/auth', authRoutes);

// 6.5 Mount Cron Routes (Open to Vercel via CRON_SECRET)
app.use('/api/cron', cronRoutes);

// 7. Apply global authorization protection for all other APIs
app.use(requireAuth);

// 8. Protected API Routes
app.use('/api/v1/security', securityRoutes);
app.use('/api/v1/projects', projectRoutes);
app.use('/api/v1/stages', stageRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/v1/progress-reports', progressReportRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/feedbacks', feedbacksRoutes);
app.use('/api/v1/team', teamRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1', memberDashboardRoutes);
app.use('/api/v1/member-reports', memberReportRoutes);
app.use('/api/v1/member-feedbacks', memberFeedbackRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/activities', activityRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/team-members', teamRoutes);
app.use('/api/v1/comments', commentsRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/timesheets', timesheetRoutes);

// 9. Centralized and Sanitized Error Handler (Never expose internal stack traces or database info)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error encountered:', err.message || err);

  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Unauthorized access';
  }

  if (status === 500) {
    message = 'An unexpected system error occurred';
  }

  res.status(status).json({
    success: false,
    message,
  });
});

export default app;
