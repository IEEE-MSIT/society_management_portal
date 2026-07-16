import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt.js';
import { verifyToken as verifyClerkToken } from '@clerk/backend';
import prisma from '../config/db.js';

let io: Server | null = null;

export interface AuthenticatedSocket extends Socket {
  user?: {
    userId: string;
    email: string;
    roleName: string;
    societyId: string;
  };
}

export const initSocket = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
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
    },
  });

  // Socket authorization middleware (hybrid support for local JWT and Clerk tokens)
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication failed: Token missing.'));
      }

      // First try: Custom local JWT
      try {
        const decoded = verifyAccessToken(token);
        socket.user = {
          userId: decoded.userId,
          email: decoded.email,
          roleName: decoded.roleName,
          societyId: decoded.societyId,
        };
        return next();
      } catch (err) {
        // Fallback: Verify as Clerk token
        const secretKey = process.env.CLERK_SECRET_KEY;
        if (!secretKey) {
          return next(new Error('Authentication failed: Local verification failed, Clerk not configured.'));
        }

        try {
          const jwtKey = process.env.CLERK_JWT_KEY;
          const decodedClerk = await verifyClerkToken(token, {
            secretKey,
            jwtKey,
          });

          const clerkUserId = decodedClerk.sub;
          if (!clerkUserId) {
            return next(new Error('Authentication failed: Invalid Clerk token claims.'));
          }

          // Find user by clerkId in database
          const dbUser = await prisma.user.findUnique({
            where: { clerkId: clerkUserId },
            include: {
              role: true,
            },
          });

          if (!dbUser) {
            return next(new Error('Authentication failed: Account not registered in society portal.'));
          }

          socket.user = {
            userId: dbUser.id,
            email: dbUser.email,
            roleName: dbUser.role.name,
            societyId: dbUser.societyId,
          };

          return next();
        } catch (clerkErr: any) {
          console.error('Socket hybrid auth: Clerk verification failed:', clerkErr.message || clerkErr);
          return next(new Error('Authentication failed: Invalid session token.'));
        }
      }
    } catch (error) {
      console.error('Socket authorization middleware error:', error);
      next(new Error('Authentication failed: Internal server error.'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const societyId = socket.user?.societyId;
    if (societyId) {
      // Join society-specific room for tenant-isolated alerts
      socket.join(societyId);
      console.log(`Socket connected: [User: ${socket.user?.email}] joined tenant room: [${societyId}]`);
    }

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: [User: ${socket.user?.email}]`);
    });
  });

  return io;
};

// Global helper to broadcast real-time events to a specific tenant (society)
export const emitToSociety = (societyId: string, event: string, data: any): void => {
  if (io) {
    io.to(societyId).emit(event, data);
    console.log(`[Socket] Broadcast event [${event}] to society room: [${societyId}]`);
  } else {
    console.warn('[Socket] Server not initialized. Cannot emit event.');
  }
};
