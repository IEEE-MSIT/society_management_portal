import prisma from '../config/db.js';

export class ComplaintRepository {
  async create(data: {
    societyId: string;
    creatorId: string;
    title: string;
    description: string;
    category?: string;
    priority?: string;
    status?: string;
  }) {
    return prisma.complaint.create({
      data: {
        societyId: data.societyId,
        creatorId: data.creatorId,
        title: data.title,
        description: data.description,
        category: data.category || 'OTHER',
        priority: data.priority || 'MEDIUM',
        status: data.status || 'OPEN',
      },
      include: {
        creator: {
          include: {
            member: true,
          },
        },
      },
    });
  }

  async findById(id: string, societyId: string) {
    return prisma.complaint.findFirst({
      where: { id, societyId },
      include: {
        creator: {
          include: {
            member: true,
          },
        },
        tasks: true,
        attachments: true,
      },
    });
  }

  async list(societyId: string, filters: { category?: string; priority?: string; status?: string }) {
    return prisma.complaint.findMany({
      where: {
        societyId,
        ...(filters.category && { category: filters.category }),
        ...(filters.priority && { priority: filters.priority }),
        ...(filters.status && { status: filters.status }),
      },
      include: {
        creator: {
          include: {
            member: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(
    id: string,
    societyId: string,
    data: {
      category?: string;
      priority?: string;
      status?: string;
    }
  ) {
    return prisma.complaint.update({
      where: { id },
      data,
      include: {
        creator: {
          include: {
            member: true,
          },
        },
      },
    });
  }
}
