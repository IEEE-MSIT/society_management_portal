import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { AwardService } from '../services/awardService.js';

const awardService = new AwardService();

export const getRules = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societyId = req.user?.societyId;
    if (!societyId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const rules = await awardService.listRules(societyId);
    res.status(200).json({ success: true, rules });
  } catch (error) {
    next(error);
  }
};

export const updateRule = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societyId = req.user?.societyId;
    if (!societyId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const {
      minEvents,
      minVolHours,
      minTasks,
      weightEvents,
      weightVolHrs,
      weightTasks,
    } = req.body;

    const updated = await awardService.updateRuleWeights(societyId, id, {
      minEvents: Number(minEvents),
      minVolHours: Number(minVolHours),
      minTasks: Number(minTasks),
      weightEvents: Number(weightEvents),
      weightVolHrs: Number(weightVolHrs),
      weightTasks: Number(weightTasks),
    });

    res.status(200).json({
      success: true,
      message: 'Award evaluation rules updated successfully.',
      rule: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const evaluatePeriod = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societyId = req.user?.societyId;
    if (!societyId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { period } = req.body;
    if (!period) {
      res.status(400).json({ success: false, message: 'Period parameter is required (e.g. 2026-07).' });
      return;
    }

    const nominations = await awardService.evaluatePeriod(societyId, period);

    res.status(200).json({
      success: true,
      message: `Performance evaluation completed for period ${period}. Nominations logged.`,
      nominations,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeaderboard = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societyId = req.user?.societyId;
    if (!societyId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { period } = req.query;
    if (!period) {
      res.status(400).json({ success: false, message: 'Period filter is required.' });
      return;
    }

    const leaderboard = await awardService.getLeaderboard(societyId, period as string);

    res.status(200).json({
      success: true,
      leaderboard,
    });
  } catch (error) {
    next(error);
  }
};

export const approveNomination = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societyId = req.user?.societyId;
    if (!societyId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;

    const winner = await awardService.approveNomination(societyId, id);

    res.status(200).json({
      success: true,
      message: 'Nomination approved successfully! Certificate issued.',
      winner,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to approve nomination.',
    });
  }
};

export const manualNomination = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societyId = req.user?.societyId;
    if (!societyId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { awardType, memberId, period, score, reason } = req.body;

    const nomination = await awardService.manualNominate(societyId, {
      awardType,
      memberId,
      period,
      score: Number(score),
      reason,
    });

    res.status(201).json({
      success: true,
      message: 'Manual nomination logged successfully.',
      nomination,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message || 'Failed to create manual nomination.',
    });
  }
};

export const getWinners = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societyId = req.user?.societyId;
    if (!societyId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const winners = await awardService.getWinners(societyId);

    res.status(200).json({
      success: true,
      winners,
    });
  } catch (error) {
    next(error);
  }
};

export const getNominationDetails = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const societyId = req.user?.societyId;
    if (!societyId) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { id } = req.params;
    const nomination = await awardService.getNomination(id, societyId);

    if (!nomination) {
      res.status(404).json({ success: false, message: 'Certificate record not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      nomination,
    });
  } catch (error) {
    next(error);
  }
};
