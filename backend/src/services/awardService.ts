import { AwardRepository } from '../repositories/awardRepository.js';
import { emitToSociety } from '../config/socket.js';
import prisma from '../config/db.js';

const awardRepo = new AwardRepository();

export class AwardService {
  // 1. Seed default rules
  async seedDefaultRules(societyId: string) {
    const defaults = [
      {
        awardType: 'MEMBER_OF_MONTH',
        name: 'Member of the Month',
        description: 'Awarded to the most active, overall contributor of the month.',
        minEvents: 2,
        minVolHours: 5,
        minTasks: 1,
        weightEvents: 2.0,
        weightVolHrs: 1.5,
        weightTasks: 3.0,
      },
      {
        awardType: 'BEST_VOLUNTEER',
        name: 'Best Volunteer',
        description: 'Awarded to the member with the most volunteer hours.',
        minEvents: 1,
        minVolHours: 10,
        minTasks: 0,
        weightEvents: 1.0,
        weightVolHrs: 4.0,
        weightTasks: 1.0,
      },
      {
        awardType: 'BEST_DEVELOPER',
        name: 'Best Developer',
        description: 'Awarded to the member completing the most technical/engineering tasks.',
        minEvents: 0,
        minVolHours: 0,
        minTasks: 4,
        weightEvents: 0.5,
        weightVolHrs: 1.0,
        weightTasks: 5.0,
      },
    ];

    for (const rule of defaults) {
      await awardRepo.upsertRule(societyId, rule.awardType, rule);
    }
  }

  // 2. Core metrics evaluation engine
  async evaluatePeriod(societyId: string, period: string) {
    // Ensure default rules exist
    await this.seedDefaultRules(societyId);

    const rules = await awardRepo.listRules(societyId);
    const members = await prisma.member.findMany({
      where: { societyId, deletedAt: null },
    });

    const nominationsList = [];

    for (const rule of rules) {
      const candidates = [];

      for (const member of members) {
        // Calculate mock/random metrics for demonstration, mixed with DB constraints
        // For a real production app, this queries bookings/attendance/tasks records
        const seedValue = parseInt(member.id.substring(0, 4), 16) || 12;
        const periodOffset = parseInt(period.split('-')[1]) || 7;
        
        const events = (seedValue % 5) + (periodOffset % 3);
        const volHours = ((seedValue * 7) % 20) + (periodOffset * 1.5);
        const tasks = (seedValue % 4) + (periodOffset % 2);

        // Eligibility validation
        if (
          events >= rule.minEvents &&
          volHours >= rule.minVolHours &&
          tasks >= rule.minTasks
        ) {
          // Score formula
          const score =
            events * rule.weightEvents +
            volHours * rule.weightVolHrs +
            tasks * rule.weightTasks;

          candidates.push({
            member,
            score: Math.round(score * 10) / 10,
            reason: `AI Score breakdown: Attended ${events} events (${rule.weightEvents}w), Logged ${volHours} vol hours (${rule.weightVolHrs}w), Completed ${tasks} tasks (${rule.weightTasks}w).`,
          });
        }
      }

      // Sort by score descending (tie breaker: alphabetical name comparison if score matches)
      candidates.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.member.firstName.localeCompare(b.member.firstName);
      });

      // Nominate the top 3 candidates
      const topCandidates = candidates.slice(0, 3);
      for (const cand of topCandidates) {
        const nom = await awardRepo.upsertNomination({
          societyId,
          awardRuleId: rule.id,
          memberId: cand.member.id,
          period,
          score: cand.score,
          status: 'NOMINATED',
          reason: cand.reason,
        });
        nominationsList.push(nom);
      }
    }

    return nominationsList;
  }

  // 3. Approve nomination and issue certificates
  async approveNomination(societyId: string, nominationId: string) {
    const nomination = await awardRepo.findNominationById(nominationId, societyId);

    if (!nomination) {
      throw new Error('Nomination record not found.');
    }

    if (nomination.status === 'APPROVED') {
      throw new Error('Nomination has already been approved.');
    }

    // 1. Update nomination status
    const updatedNom = await awardRepo.updateNominationStatus(nominationId, 'APPROVED');

    // 2. Generate certificate & QR code details
    const winnerId = Math.random().toString(36).substring(2, 11).toUpperCase();
    const badgeType = nomination.awardRule.awardType.toLowerCase();
    const badgeUrl = `/assets/badges/${badgeType}.png`;
    const certificateUrl = `http://localhost:5180/awards/certificate/${nominationId}`;
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
      `http://localhost:5180/awards/verify/${updatedNom.id}`
    )}`;

    const winner = await awardRepo.createWinner({
      nominationId,
      certificateUrl,
      qrCodeUrl,
      badgeUrl,
      shareCardUrl: `/assets/shares/${updatedNom.id}.png`,
    });

    // 3. Broadcast real-time announcement to society
    emitToSociety(societyId, 'award_approved', {
      id: winner.id,
      memberName: `${nomination.member.firstName} ${nomination.member.lastName}`,
      awardName: nomination.awardRule.name,
      period: nomination.period,
      badgeUrl,
    });

    return winner;
  }

  // 4. Manual nomination override
  async manualNominate(
    societyId: string,
    data: {
      awardType: string;
      memberId: string;
      period: string;
      score: number;
      reason: string;
    }
  ) {
    let rule = await awardRepo.findRuleByType(societyId, data.awardType);
    if (!rule) {
      // Seed default rules if missing
      await this.seedDefaultRules(societyId);
      rule = await awardRepo.findRuleByType(societyId, data.awardType);
    }

    if (!rule) {
      throw new Error('Award category config not found.');
    }

    return awardRepo.upsertNomination({
      societyId,
      awardRuleId: rule.id,
      memberId: data.memberId,
      period: data.period,
      score: data.score,
      status: 'NOMINATED',
      reason: `Manual Admin Nomination: ${data.reason}`,
    });
  }

  async listRules(societyId: string) {
    await this.seedDefaultRules(societyId);
    return awardRepo.listRules(societyId);
  }

  async updateRuleWeights(
    societyId: string,
    id: string,
    weights: {
      minEvents: number;
      minVolHours: number;
      minTasks: number;
      weightEvents: number;
      weightVolHrs: number;
      weightTasks: number;
    }
  ) {
    return prisma.awardRule.update({
      where: { id, societyId },
      data: weights,
    });
  }

  async getLeaderboard(societyId: string, period: string) {
    const nominations = await awardRepo.listNominations(societyId, period);
    return nominations;
  }

  async getWinners(societyId: string) {
    return awardRepo.listWinners(societyId);
  }

  async getNomination(id: string, societyId: string) {
    return awardRepo.findNominationById(id, societyId);
  }
}
