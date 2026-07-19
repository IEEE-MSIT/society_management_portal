import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { initSocket } from './config/socket.js';
import { bootstrapDatabase } from './utils/bootstrap.js';

// Load environment variables
dotenv.config();

// Validate required environment variables at startup
const requiredEnv = ['CLERK_SECRET_KEY', 'CLERK_PUBLISHABLE_KEY', 'DATABASE_URL'];
requiredEnv.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.warn(`⚠️  Startup Warning: Environment variable "${envVar}" is not set.`);
  }
});

// Imports
import authRoutes from './routes/authRoutes.js';
import memberRoutes from './routes/memberRoutes.js';
import announcementRoutes from './routes/announcementRoutes.js';
import societyRoutes from './routes/societyRoutes.js';
import visitorRoutes from './routes/visitorRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import awardRoutes from './routes/awardRoutes.js';
import collaborationRoutes from './routes/collaborationRoutes.js';
import { errorHandler } from './middlewares/error.js';

const app = express();
const PORT = process.env.PORT || 10000;

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      const localAllowed = [
        'http://localhost:5180',
        'http://127.0.0.1:5180',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'https://society-management-portal-zeta.vercel.app',
      ];

      const envAllowed = process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : [];

      const isVercel = origin.startsWith('https://society-management-portal') && origin.endsWith('.vercel.app');

      if (localAllowed.includes(origin) || envAllowed.includes(origin) || isVercel) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  })
);

// Logging Middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Parse JSON Bodies
app.use(express.json());

// Rate Limiter
import { rateLimiter } from './middlewares/rateLimiter.js';
app.use(rateLimiter);

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/members', memberRoutes);
app.use('/api/v1/announcements', announcementRoutes);
app.use('/api/v1/societies', societyRoutes);
app.use('/api/v1/visitors', visitorRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/awards', awardRoutes);
app.use('/api/v1', collaborationRoutes);




// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date(),
    service: 'society-management-backend',
  });
});

// 404 Route handler for undefined endpoints
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.originalUrl}`,
  });
});

// Error handling middleware (MUST be last)
app.use(errorHandler);

// Create HTTP Server & Init Socket.IO
const httpServer = createServer(app);
initSocket(httpServer);

// Start Server
httpServer.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`===============================================`);
  await bootstrapDatabase();
});
