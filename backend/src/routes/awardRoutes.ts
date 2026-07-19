import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/auth.js';
import { checkPermission } from '../middlewares/rbac.js';
import { validate } from '../middlewares/validate.js';
import {
  getRules,
  updateRule,
  evaluatePeriod,
  getLeaderboard,
  approveNomination,
  manualNomination,
  getWinners,
  getNominationDetails,
} from '../controllers/awardController.js';

const router = Router();

// Validation Schemas
const updateRuleSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid rule ID format'),
  }),
  body: z.object({
    minEvents: z.number().min(0),
    minVolHours: z.number().min(0),
    minTasks: z.number().min(0),
    weightEvents: z.number().min(0),
    weightVolHrs: z.number().min(0),
    weightTasks: z.number().min(0),
  }),
});

const evaluatePeriodSchema = z.object({
  body: z.object({
    period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format'),
  }),
});

const queryLeaderboardSchema = z.object({
  query: z.object({
    period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format'),
  }),
});

const manualNominationSchema = z.object({
  body: z.object({
    awardType: z.string(),
    memberId: z.string().uuid('Invalid member ID format'),
    period: z.string().regex(/^\d{4}-\d{2}$/, 'Period must be in YYYY-MM format'),
    score: z.number().min(0),
    reason: z.string().min(5, 'Reason must be at least 5 characters long'),
  }),
});

const approveNominationSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid nomination ID format'),
  }),
});

// Protect all routes
router.use(authenticate);

// Publicly readable endpoints (by all whitelisted members)
router.get('/rules', checkPermission('member:read'), getRules);
router.get('/leaderboard', validate(queryLeaderboardSchema), checkPermission('member:read'), getLeaderboard);
router.get('/winners', checkPermission('member:read'), getWinners);
router.get('/nominations/:id', checkPermission('member:read'), getNominationDetails);

// Admin-only endpoints
router.put('/rules/:id', validate(updateRuleSchema), checkPermission('award:write'), updateRule);
router.post('/evaluate', validate(evaluatePeriodSchema), checkPermission('award:write'), evaluatePeriod);
router.post('/nominations/manual', validate(manualNominationSchema), checkPermission('award:write'), manualNomination);
router.patch('/nominations/:id/approve', validate(approveNominationSchema), checkPermission('award:write'), approveNomination);

export default router;
