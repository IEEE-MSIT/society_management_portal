import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middlewares/auth.js';
import { checkPermission } from '../middlewares/rbac.js';
import { validate } from '../middlewares/validate.js';
import {
  createProject,
  listProjects,
  getProject,
  addProjectMember,
  addProjectMilestone,
  addProjectTask,
  updateTaskStatus,
  createEvent,
  listEvents,
  getEvent,
  registerForEvent,
  checkInAttendee,
  updatePortfolio,
  getPortfolio,
  aiEventPlanner,
  aiResumeReview,
  aiGenerateWriting,
} from '../controllers/collaborationController.js';

const router = Router();

// Zod Validation Schemas
const createProjectSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters'),
    description: z.string().min(5, 'Description must be at least 5 characters'),
    githubUrl: z.string().url().optional().or(z.literal('')),
    demoUrl: z.string().url().optional().or(z.literal('')),
    techStack: z.string().min(2, 'Tech stack is required'),
  }),
});

const createEventSchema = z.object({
  body: z.object({
    title: z.string().min(3),
    description: z.string().min(5),
    startDate: z.string(),
    endDate: z.string(),
    location: z.string().min(2),
    budget: z.number().min(0).optional(),
    speakers: z.string().optional(),
    sponsors: z.string().optional(),
  }),
});

const checkInSchema = z.object({
  body: z.object({
    checkInCode: z.string().min(5),
  }),
});

// Protect all routes
router.use(authenticate);

// ==========================================
// Projects Routes
// ==========================================
router.post('/projects', validate(createProjectSchema), checkPermission('member:read'), createProject);
router.get('/projects', checkPermission('member:read'), listProjects);
router.get('/projects/:id', checkPermission('member:read'), getProject);
router.post('/projects/:id/members', checkPermission('member:read'), addProjectMember);
router.post('/projects/:id/milestones', checkPermission('member:read'), addProjectMilestone);
router.post('/projects/:id/tasks', checkPermission('member:read'), addProjectTask);
router.patch('/projects/tasks/:taskId', checkPermission('member:read'), updateTaskStatus);

// ==========================================
// Events Routes
// ==========================================
router.post('/events', validate(createEventSchema), checkPermission('announcement:create'), createEvent);
router.get('/events', checkPermission('member:read'), listEvents);
router.get('/events/:id', checkPermission('member:read'), getEvent);
router.post('/events/:id/register', checkPermission('member:read'), registerForEvent);
router.post('/events/:id/checkin', validate(checkInSchema), checkPermission('visitor:read'), checkInAttendee);

// ==========================================
// Portfolios Routes
// ==========================================
router.put('/portfolio', checkPermission('member:read'), updatePortfolio);
router.get('/portfolio/:id', checkPermission('member:read'), getPortfolio);

// ==========================================
// AI Hub Routes
// ==========================================
router.post('/ai/event-planner', checkPermission('member:read'), aiEventPlanner);
router.post('/ai/resume-review', checkPermission('member:read'), aiResumeReview);
router.post('/ai/generate-writing', checkPermission('member:read'), aiGenerateWriting);

export default router;
