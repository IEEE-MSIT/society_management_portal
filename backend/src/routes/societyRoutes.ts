import { Router } from 'express';
import { registerSociety } from '../controllers/societyController.js';

const router = Router();

router.post('/register', registerSociety);

export default router;
