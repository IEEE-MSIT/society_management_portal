import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService.js';
import prisma from '../config/db.js';

const authService = new AuthService();

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;
    const deviceInfo = req.headers['user-agent'];

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Email and password are required.',
      });
      return;
    }

    const data = await authService.login(email, password, deviceInfo);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken: data.accessToken,
      user: data.user,
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.cookies?.refreshToken;

    if (!token && req.headers.cookie) {
      const cookies = Object.fromEntries(
        req.headers.cookie.split('; ').map((c) => c.split('='))
      );
      token = cookies['refreshToken'];
    }

    if (token) {
      await authService.logout(token);
    }

    // Clear client cookies
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.status(200).json({
      success: true,
      message: 'Logged out successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = req.cookies?.refreshToken;

    if (!token && req.headers.cookie) {
      const cookies = Object.fromEntries(
        req.headers.cookie.split('; ').map((c) => c.split('='))
      );
      token = cookies['refreshToken'];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Session invalid: Refresh token missing.',
      });
      return;
    }

    const data = await authService.refreshToken(token);

    res.status(200).json({
      success: true,
      accessToken: data.accessToken,
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: error.message || 'Token refresh failed.',
    });
  }
};

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
      return;
    }

    const { userId } = req.user;
    let user;

    // Check if user exists by local ID or Clerk ID
    const isClerkId = userId.startsWith('user_');

    if (isClerkId) {
      user = await prisma.user.findUnique({
        where: { clerkId: userId },
        include: {
          society: true,
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
          member: true,
        },
      });
    } else {
      user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          society: true,
          role: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
          member: true,
        },
      });
    }

    // Auto-register Clerk user if not found in database
    if (!user && isClerkId) {
      const secretKey = process.env.CLERK_SECRET_KEY;
      if (secretKey) {
        try {
          const { createClerkClient } = await import('@clerk/backend');
          const clerkClient = createClerkClient({ secretKey });
          const clerkUser = await clerkClient.users.getUser(userId);
          const email = clerkUser.emailAddresses[0]?.emailAddress;

          if (email) {
            // Find default society
            let defaultSociety = await prisma.society.findFirst();
            if (!defaultSociety) {
              // Create a default society if none exists
              defaultSociety = await prisma.society.create({
                data: {
                  name: 'Default Society',
                },
              });
            }

            // Find default role (General Member)
            let defaultRole = await prisma.role.findFirst({
              where: {
                societyId: defaultSociety.id,
                name: 'General Member',
              },
            });

            if (!defaultRole) {
              defaultRole = await prisma.role.create({
                data: {
                  name: 'General Member',
                  description: 'Standard member role',
                  societyId: defaultSociety.id,
                },
              });
            }

            const firstName = clerkUser.firstName || email.split('@')[0];
            const lastName = clerkUser.lastName || '';

            // Create user & member
            user = await prisma.user.create({
              data: {
                email,
                clerkId: userId,
                status: 'ACTIVE',
                societyId: defaultSociety.id,
                roleId: defaultRole.id,
                member: {
                  create: {
                    societyId: defaultSociety.id,
                    firstName,
                    lastName,
                    unitNumber: 'TBD', // default block
                    phone: clerkUser.phoneNumbers[0]?.phoneNumber || null,
                    avatarUrl: clerkUser.imageUrl || null,
                  },
                },
              },
              include: {
                society: true,
                role: {
                  include: {
                    permissions: {
                      include: {
                        permission: true,
                      },
                    },
                  },
                },
                member: true,
              },
            });
            console.log(`Auto-registered Clerk user: ${email}`);
          }
        } catch (clerkErr) {
          console.error('Failed to auto-register Clerk user:', clerkErr);
        }
      }
    }

    if (!user || user.deletedAt) {
      res.status(404).json({
        success: false,
        message: 'User not found',
      });
      return;
    }

    if (user.status !== 'ACTIVE') {
      res.status(403).json({
        success: false,
        message: 'User account is inactive',
      });
      return;
    }

    const permissions = user.role.permissions.map(
      (rp: { permission: { name: string } }) => rp.permission.name
    );

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        status: user.status,
        societyId: user.societyId,
        societyName: user.society.name,
        role: {
          id: user.role.id,
          name: user.role.name,
        },
        permissions,
        member: user.member
          ? {
              id: user.member.id,
              firstName: user.member.firstName,
              lastName: user.member.lastName,
              unitNumber: user.member.unitNumber,
              phone: user.member.phone,
              avatarUrl: user.member.avatarUrl,
            }
          : null,
      },
    });
  } catch (error) {
    next(error);
  }
};
