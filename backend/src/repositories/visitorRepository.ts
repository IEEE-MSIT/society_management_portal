import prisma from '../config/db.js';

export interface CreateVisitorInput {
  societyId: string;
  name: string;
  phone: string;
  purpose: string;
  otpCode?: string;
  qrCodeUrl?: string;
}

export class VisitorRepository {
  async create(data: CreateVisitorInput) {
    return prisma.visitor.create({
      data,
    });
  }

  async findById(id: string, societyId: string) {
    return prisma.visitor.findFirst({
      where: { id, societyId },
    });
  }

  async findByOtp(otpCode: string, societyId: string) {
    return prisma.visitor.findFirst({
      where: { otpCode, societyId },
    });
  }

  async update(id: string, societyId: string, data: any) {
    return prisma.visitor.updateMany({
      where: { id, societyId },
      data,
    });
  }

  async findMany(societyId: string) {
    return prisma.visitor.findMany({
      where: { societyId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
