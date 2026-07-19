import { Router } from 'express';
import {
  createAnnouncement,
  getAnnouncements,
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
  togglePinAnnouncement,
} from '../controllers/announcementController.js';
import { authenticate } from '../middlewares/auth.js';
import { checkPermission } from '../middlewares/rbac.js';
import { validate } from '../middlewares/validate.js';
import {
  createAnnouncementSchema,
  updateAnnouncementSchema,
} from '../schemas/announcement.js';

const router = Router();

// Apply authenticate middleware to all routes
router.use(authenticate);

// List announcements
router.get('/', checkPermission('announcement:read'), getAnnouncements);

// Get single announcement
router.get('/:id', checkPermission('announcement:read'), getAnnouncementById);

// Create announcement
router.post(
  '/',
  checkPermission('announcement:create'),
  validate(createAnnouncementSchema),
  createAnnouncement
);

// Update announcement
router.put(
  '/:id',
  checkPermission('announcement:update'),
  validate(updateAnnouncementSchema),
  updateAnnouncement
);

// Delete announcement
router.delete('/:id', checkPermission('announcement:delete'), deleteAnnouncement);

// Pin/Unpin announcement
router.patch('/:id/pin', checkPermission('announcement:update'), togglePinAnnouncement);

export default router;
