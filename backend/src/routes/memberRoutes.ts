import { Router } from 'express';
import {
  getMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember,
  getRoles,
  inviteMember,
} from '../controllers/memberController.js';
import { authenticate } from '../middlewares/auth.js';
import { checkPermission } from '../middlewares/rbac.js';
import { validate } from '../middlewares/validate.js';
import {
  createMemberSchema,
  updateMemberSchema,
  queryMemberSchema,
} from '../schemas/member.js';

const router = Router();

// Apply authenticate middleware to all member routes
router.use(authenticate);

// Get all roles inside the user's society (needed for forms)
router.get('/roles', getRoles);

// Members list
router.get('/', checkPermission('member:read'), validate(queryMemberSchema), getMembers);

// Member detail
router.get('/:id', checkPermission('member:read'), getMemberById);

// Create member
router.post('/', checkPermission('member:create'), validate(createMemberSchema), createMember);

// Invite member
router.post('/invite', checkPermission('member:create'), inviteMember);

// Update member
router.put('/:id', checkPermission('member:update'), validate(updateMemberSchema), updateMember);

// Delete member (soft-delete)
router.delete('/:id', checkPermission('member:delete'), deleteMember);

export default router;
