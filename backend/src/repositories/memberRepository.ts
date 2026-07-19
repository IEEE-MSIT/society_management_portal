import prisma from '../config/db.js';

export interface CreateMemberInput {
  userId: string;
  societyId: string;
  firstName: string;
  lastName: string;
  unitNumber: string;
  phone?: string;
  avatarUrl?: string;
}

export interface GetMembersFilter {
  societyId: string;
  status?: string;
  search?: string;
  roleId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class MemberRepository {
  async create(data: CreateMemberInput) {
    return prisma.member.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            role: true,
          },
        },
      },
    });
  }

  async update(id: string, data: any) {
    return prisma.member.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            role: true,
          },
        },
      },
    });
  }

  async findById(id: string, societyId: string) {
    return prisma.member.findFirst({
      where: { id, societyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            role: true,
          },
        },
      },
    });
  }

  async findByUserId(userId: string) {
    return prisma.member.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            role: true,
          },
        },
      },
    });
  }

  async findMany(filters: GetMembersFilter) {
    const {
      societyId,
      status,
      search,
      roleId,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    const whereClause: any = {
      societyId,
    };

    if (status) {
      whereClause.user = {
        status,
      };
    }

    if (roleId) {
      whereClause.user = {
        ...whereClause.user,
        roleId,
      };
    }

    if (search) {
      const searchLower = search.toString();
      whereClause.OR = [
        { firstName: { contains: searchLower } },
        { lastName: { contains: searchLower } },
        { phone: { contains: searchLower } },
        { unitNumber: { contains: searchLower } },
        {
          user: {
            email: { contains: searchLower },
          },
        },
      ];
    }

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

    return {
      members,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
