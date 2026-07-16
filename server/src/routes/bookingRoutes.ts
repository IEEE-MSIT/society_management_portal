import { Router } from 'express';
import {
  createFacility,
  getFacilities,
  bookFacility,
  getBookings,
  cancelBooking,
} from '../controllers/bookingController.js';
import { authenticate } from '../middlewares/auth.js';
import { requireTenant } from '../middlewares/tenant.js';
import { checkPermission } from '../middlewares/rbac.js';

const router = Router();

// Apply auth and tenant scoping checks
router.use(authenticate, requireTenant);

router.get('/facilities', checkPermission('booking:read'), getFacilities);
router.post('/facilities', checkPermission('booking:create'), createFacility);

router.get('/', checkPermission('booking:read'), getBookings);
router.post('/', checkPermission('booking:create'), bookFacility);
router.delete('/:id', checkPermission('booking:delete'), cancelBooking);

export default router;
