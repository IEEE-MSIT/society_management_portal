import prisma from '../config/db.js';

export interface CreateUserInput {
  email: string;
  passwordHash: string;
  roleId: string;
  societyId: string;
  status?: string;
}

export class UserRepository {
  async create(data: CreateUserInput) {
    return prisma.user.create({
      data,
      include: {
        role: true,
        society: true,
      },
    });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({
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
        society: true,
        member: true,
      },
    });
  }

  async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
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
        society: true,
        member: true,
      },
    });
  }

  async findByClerkId(clerkId: string) {
    return prisma.user.findUnique({
      where: { clerkId },
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
        society: true,
        member: true,
      },
    });
  }

  async update(id: string, data: any) {
    return prisma.user.update({
      where: { id },
      data,
    });
  }
}
