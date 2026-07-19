import { Router } from 'express';
import {
  preRegisterVisitor,
  verifyVisitorEntry,
  verifyVisitorExit,
  getVisitors,
  cancelVisitorPass,
} from '../controllers/visitorController.js';
import { authenticate } from '../middlewares/auth.js';
import { requireTenant } from '../middlewares/tenant.js';

const router = Router();

// Apply authorization and tenant isolation checks to all visitor gates
router.use(authenticate, requireTenant);

router.get('/', getVisitors);
router.post('/pre-register', preRegisterVisitor);
router.post('/verify-entry', verifyVisitorEntry);
router.post('/:id/verify-exit', verifyVisitorExit);
router.patch('/:id/cancel', cancelVisitorPass);

export default router;
