import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/auth.js';
import { checkPermission } from '../middlewares/rbac.js';
import { validate } from '../middlewares/validate.js';
import {
  createComplaint,
  getComplaints,
  updateComplaintStatus,
} from '../controllers/complaintController.js';

const router = Router();

// Validation Schemas
const createComplaintSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters long'),
    description: z.string().min(10, 'Description must be at least 10 characters long'),
  }),
});

const updateStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid complaint ID format'),
  }),
  body: z.object({
    status: z.enum(['OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'], {
      errorMap: () => ({ message: 'Status must be OPEN, IN_PROGRESS, RESOLVED, or REJECTED' }),
    }),
  }),
});

const queryComplaintSchema = z.object({
  query: z.object({
    category: z.string().optional(),
    priority: z.string().optional(),
    status: z.string().optional(),
  }),
});

// Protect all routes with auth middleware
router.use(authenticate);

// Routes
router.post(
  '/',
  checkPermission('complaint:create'),
  validate(createComplaintSchema),
  createComplaint
);

router.get(
  '/',
  checkPermission('complaint:read'),
  validate(queryComplaintSchema),
  getComplaints
);

router.patch(
  '/:id/status',
  checkPermission('complaint:update'),
  validate(updateStatusSchema),
  updateComplaintStatus
);

export default router;
