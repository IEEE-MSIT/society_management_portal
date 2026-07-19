import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { verifyToken as verifyClerkToken } from '@clerk/backend';
import prisma from '../config/db.js';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    roleId: string;
    roleName: string;
    societyId: string;
    permissions: string[];
  };
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    // 1. Try to extract from Authorization Header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fallback: Try to extract from Cookies
    if (!token && req.headers.cookie) {
      const cookies = Object.fromEntries(
        req.headers.cookie.split('; ').map((c) => c.split('='))
      );
      token = cookies['accessToken'] || cookies['access_token'] || cookies['__session'];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No session token provided.',
      });
      return;
    }

    // Try verifying as custom local JWT first
    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      return next();
    } catch (err) {
      // If local JWT validation fails, check if Clerk is configured and try verifying as Clerk token
      const secretKey = process.env.CLERK_SECRET_KEY;
      if (!secretKey) {
        res.status(401).json({
          success: false,
          message: 'Access denied. Invalid token (local validation failed, Clerk not configured).',
        });
        return;
      }

      try {
        const jwtKey = process.env.CLERK_JWT_KEY;
        const decodedClerk = await verifyClerkToken(token, {
          secretKey,
          jwtKey,
        });

        const clerkUserId = decodedClerk.sub;
        if (!clerkUserId) {
          res.status(401).json({
            success: false,
            message: 'Access denied. Invalid Clerk token claims.',
          });
          return;
        }

        // Find user by clerkId in database
        let dbUser = await prisma.user.findUnique({
          where: { clerkId: clerkUserId },
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        });

        // Fallback: Link by email if first time logging in via Clerk for seeded users
        if (!dbUser) {
          const { createClerkClient } = await import('@clerk/backend');
          const clerkClient = createClerkClient({ secretKey });
          const clerkUser = await clerkClient.users.getUser(clerkUserId);
          const email = clerkUser.emailAddresses[0]?.emailAddress;

          if (email) {
            dbUser = await prisma.user.findUnique({
              where: { email },
              include: {
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
              },
            });

            if (dbUser) {
              dbUser = await prisma.user.update({
                where: { id: dbUser.id },
                data: { clerkId: clerkUserId },
                include: {
                  role: {
                    include: {
                      permissions: {
                        include: {
                          permission: true,
                        },
                      },
                    },
                  },
                },
              });
            }
          }
        }

        if (!dbUser) {
          // If calling /me route to auto-register
          if (req.path === '/me' || req.originalUrl.endsWith('/auth/me')) {
            req.user = {
              userId: clerkUserId,
              email: '',
              roleId: '',
              roleName: '',
              societyId: '',
              permissions: [],
            };
            return next();
          }

          res.status(401).json({
            success: false,
            message: 'Account not registered in society portal.',
          });
          return;
        }

        if (dbUser.deletedAt) {
          res.status(403).json({
            success: false,
            message: 'Your account has been deleted.',
          });
          return;
        }

        if (dbUser.status !== 'ACTIVE') {
          res.status(403).json({
            success: false,
            message: 'Your account is inactive.',
          });
          return;
        }

        const permissions = dbUser.role.permissions.map(
          (rp: { permission: { name: string } }) => rp.permission.name
        );

        req.user = {
          userId: dbUser.id,
          email: dbUser.email,
          roleId: dbUser.roleId,
          roleName: dbUser.role.name,
          societyId: dbUser.societyId,
          permissions,
        };

        return next();
      } catch (clerkErr: any) {
        console.error('Hybrid auth: Clerk verification failed:', clerkErr.message || clerkErr);
        res.status(401).json({
          success: false,
          message: 'Access denied. Invalid session token.',
        });
      }
    }
  } catch (error) {
    console.error('Authentication middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
};
