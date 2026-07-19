import prisma from '../config/db.js';

export interface CreateFacilityInput {
  societyId: string;
  name: string;
  description?: string;
  costPerHour?: number;
}

export class FacilityRepository {
  async create(data: CreateFacilityInput) {
    return prisma.facility.create({
      data,
    });
  }

  async findById(id: string, societyId: string) {
    return prisma.facility.findFirst({
      where: { id, societyId },
    });
  }

  async findMany(societyId: string) {
    return prisma.facility.findMany({
      where: { societyId },
      orderBy: { name: 'asc' },
    });
  }
}
