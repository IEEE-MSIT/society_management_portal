import prisma from '../config/db.js';

export class AwardRepository {
  // 1. Award Rules Config
  async upsertRule(
    societyId: string,
    awardType: string,
    data: {
      name: string;
      description?: string;
      minEvents?: number;
      minVolHours?: number;
      minTasks?: number;
      weightEvents?: number;
      weightVolHrs?: number;
      weightTasks?: number;
      isActive?: boolean;
    }
  ) {
    return prisma.awardRule.upsert({
      where: {
        societyId_awardType: {
          societyId,
          awardType,
        },
      },
      update: data,
      create: {
        societyId,
        awardType,
        ...data,
      },
    });
  }

  async findRuleByType(societyId: string, awardType: string) {
    return prisma.awardRule.findUnique({
      where: {
        societyId_awardType: {
          societyId,
          awardType,
        },
      },
    });
  }

  async listRules(societyId: string) {
    return prisma.awardRule.findMany({
      where: { societyId, isActive: true },
    });
  }

  // 2. Award Nominations
  async upsertNomination(data: {
    societyId: string;
    awardRuleId: string;
    memberId: string;
    period: string;
    score: number;
    status?: string;
    reason?: string;
  }) {
    return prisma.awardNomination.upsert({
      where: {
        awardRuleId_memberId_period: {
          awardRuleId: data.awardRuleId,
          memberId: data.memberId,
          period: data.period,
        },
      },
      update: {
        score: data.score,
        reason: data.reason,
      },
      create: data,
      include: {
        member: true,
        awardRule: true,
      },
    });
  }

  async findNominationById(id: string, societyId: string) {
    return prisma.awardNomination.findFirst({
      where: { id, societyId },
      include: {
        member: true,
        awardRule: true,
        winner: true,
      },
    });
  }

  async listNominations(societyId: string, period: string) {
    return prisma.awardNomination.findMany({
      where: { societyId, period },
      include: {
        member: true,
        awardRule: true,
        winner: true,
      },
      orderBy: {
        score: 'desc',
      },
    });
  }

  async updateNominationStatus(id: string, status: string, reason?: string) {
    return prisma.awardNomination.update({
      where: { id },
      data: {
        status,
        ...(reason && { reason }),
      },
      include: {
        member: true,
        awardRule: true,
      },
    });
  }

  // 3. Award Winners
  async createWinner(data: {
    nominationId: string;
    certificateUrl?: string;
    qrCodeUrl?: string;
    badgeUrl?: string;
    shareCardUrl?: string;
  }) {
    return prisma.awardWinner.create({
      data,
      include: {
        nomination: {
          include: {
            member: true,
            awardRule: true,
          },
        },
      },
    });
  }

  async listWinners(societyId: string) {
    return prisma.awardWinner.findMany({
      where: {
        nomination: {
          societyId,
        },
      },
      include: {
        nomination: {
          include: {
            member: true,
            awardRule: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}
