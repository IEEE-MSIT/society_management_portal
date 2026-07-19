import prisma from '../config/db.js';

export interface CreateSocietyInput {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export class SocietyRepository {
  async create(data: CreateSocietyInput) {
    return prisma.society.create({
      data,
    });
  }

  async findById(id: string) {
    return prisma.society.findUnique({
      where: { id },
    });
  }

  async findByName(name: string) {
    return prisma.society.findFirst({
      where: { name },
    });
  }

  async findAll() {
    return prisma.society.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
