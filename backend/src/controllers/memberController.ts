import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import prisma from '../config/db.js';

export const getMembers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societyId = req.user?.societyId;
    if (!societyId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { page = 1, limit = 10, search, status, roleId, sortBy = 'createdAt', sortOrder = 'desc' } = req.query as any;

    const skip = (page - 1) * limit;

    // Build filter conditions
    const whereClause: any = {
      societyId,
      deletedAt: null,
    };

    if (status) {
      whereClause.status = status;
    }

    if (roleId) {
      whereClause.user = {
        roleId,
      };
    }

    if (search) {
      const searchLower = search.toString();
      whereClause.OR = [
        { firstName: { contains: searchLower, mode: 'insensitive' } },
        { lastName: { contains: searchLower, mode: 'insensitive' } },
        { phone: { contains: searchLower, mode: 'insensitive' } },
        {
          user: {
            email: { contains: searchLower, mode: 'insensitive' },
          },
        },
      ];
    }

    // Fetch members and total count
    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              status: true,
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.member.count({ where: whereClause }),
    ]);

    res.status(200).json({
      success: true,
      data: members,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMemberById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const societyId = req.user?.societyId;

    const member = await prisma.member.findFirst({
      where: {
        id,
        societyId,
        deletedAt: null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            role: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!member) {
      res.status(404).json({
        success: false,
        message: 'Member not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

export const createMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societyId = req.user?.societyId;
    if (!societyId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { firstName, lastName, email, phone, roleId, status = 'ACTIVE', bio, profileImage, unitNumber = 'TBD' } = req.body;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({
        success: false,
        message: 'Email address already in use by another user.',
      });
      return;
    }

    // Verify role exists in the society
    const role = await prisma.role.findFirst({
      where: { id: roleId, societyId },
    });

    if (!role) {
      res.status(400).json({
        success: false,
        message: 'Invalid role for this society.',
      });
      return;
    }

    // Create user and member inside a transaction
    const defaultPasswordHash = await bcrypt.hash('ChangeMe123!', 10);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: defaultPasswordHash,
          status: status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE',
          roleId,
          societyId,
        },
      });

      const member = await tx.member.create({
        data: {
          userId: user.id,
          societyId,
          firstName,
          lastName,
          phone,
          unitNumber,
          bio,
          avatarUrl: profileImage,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              status: true,
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      return member;
    });

    res.status(201).json({
      success: true,
      message: 'Member created successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const societyId = req.user?.societyId;

    // Find member
    const member = await prisma.member.findFirst({
      where: { id, societyId, deletedAt: null },
    });

    if (!member) {
      res.status(404).json({
        success: false,
        message: 'Member not found',
      });
      return;
    }

    const { firstName, lastName, phone, roleId, status, bio, profileImage, unitNumber } = req.body;

    // Update member and user inside a transaction
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updatedMember = await tx.member.update({
        where: { id },
        data: {
          firstName,
          lastName,
          phone,
          unitNumber,
          bio,
          avatarUrl: profileImage,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              status: true,
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Update user details if applicable
      if (member.userId) {
        const userData: any = {};
        if (status) {
          userData.status = status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE';
        }
        if (roleId) {
          // Verify role is part of society
          const role = await tx.role.findFirst({
            where: { id: roleId, societyId },
          });
          if (!role) {
            throw new Error('Invalid role specified');
          }
          userData.roleId = roleId;
        }

        if (Object.keys(userData).length > 0) {
          await tx.user.update({
            where: { id: member.userId },
            data: userData,
          });
        }
      }

      // Re-fetch updated member info to include updated user info
      return tx.member.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              status: true,
              role: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });
    });

    res.status(200).json({
      success: true,
      message: 'Member updated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const societyId = req.user?.societyId;

    const member = await prisma.member.findFirst({
      where: { id, societyId, deletedAt: null },
    });

    if (!member) {
      res.status(404).json({
        success: false,
        message: 'Member not found',
      });
      return;
    }

    // Soft delete member and user in transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const now = new Date();
      await tx.member.update({
        where: { id },
        data: {
          deletedAt: now,
        },
      });

      if (member.userId) {
        await tx.user.update({
          where: { id: member.userId },
          data: {
            deletedAt: now,
            status: 'INACTIVE',
          },
        });
      }
    });

    res.status(200).json({
      success: true,
      message: 'Member deleted successfully (soft delete)',
    });
  } catch (error) {
    next(error);
  }
};

export const getRoles = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societyId = req.user?.societyId;
    if (!societyId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const roles = await prisma.role.findMany({
      where: { societyId },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    res.status(200).json({
      success: true,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
};

export const inviteMember = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, roleId } = req.body;
    const societyId = req.user?.societyId;

    if (!societyId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    if (!email || !roleId) {
      res.status(400).json({ success: false, message: 'Email and Role are required.' });
      return;
    }

    // Verify role exists in the society
    const role = await prisma.role.findFirst({
      where: { id: roleId, societyId },
    });

    if (!role) {
      res.status(400).json({ success: false, message: 'Invalid role selected.' });
      return;
    }

    // Create Clerk invitation
    const secretKey = process.env.CLERK_SECRET_KEY;
    const { createClerkClient } = await import('@clerk/backend');
    const clerkClient = createClerkClient({ secretKey });

    const clientUrl = process.env.ALLOWED_ORIGINS 
      ? process.env.ALLOWED_ORIGINS.split(',')[0]
      : 'http://localhost:5173';

    const invitation = await clerkClient.invitations.createInvitation({
      emailAddress: email,
      publicMetadata: {
        roleId,
        societyId,
      },
      redirectUrl: `${clientUrl}/signup`,
    });

    res.status(200).json({
      success: true,
      message: 'Invitation sent successfully.',
      data: invitation,
    });
  } catch (error: any) {
    console.error('Error creating invitation:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send invitation.',
    });
  }
};
