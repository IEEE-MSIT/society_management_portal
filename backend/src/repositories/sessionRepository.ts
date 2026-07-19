import prisma from '../config/db.js';

export interface CreateSessionInput {
  userId: string;
  token: string;
  expiresAt: Date;
  deviceInfo?: string;
}

export class SessionRepository {
  async create(data: CreateSessionInput) {
    return prisma.session.create({
      data,
    });
  }

  async findByToken(token: string) {
    return prisma.session.findUnique({
      where: { token },
      include: {
        user: {
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
          },
        },
      },
    });
  }

  async delete(token: string) {
    return prisma.session.delete({
      where: { token },
    });
  }

  async deleteAllForUser(userId: string) {
    return prisma.session.deleteMany({
      where: { userId },
    });
  }

  async deleteExpired() {
    return prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
  }
}
