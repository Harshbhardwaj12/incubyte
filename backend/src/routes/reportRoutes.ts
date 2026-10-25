import { Router } from 'express';
import * as reportController from '../controllers/reportController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);
router.get('/inventory.csv', reportController.inventoryCsv);
router.get('/sales.csv', requireRole('admin'), reportController.salesCsv);

export default router;
