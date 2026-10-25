import { Router } from 'express';
import * as stockMovementController from '../controllers/stockMovementController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/', stockMovementController.list);

export default router;
