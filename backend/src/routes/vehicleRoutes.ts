import { Router } from 'express';
import * as vehicleController from '../controllers/vehicleController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', vehicleController.list);
router.get('/search', vehicleController.search);
router.get('/:id', vehicleController.detail);
router.post('/', requireRole('admin'), vehicleController.create);
router.put('/:id', requireRole('admin'), vehicleController.update);
router.delete('/:id', requireRole('admin'), vehicleController.remove);
router.post('/:id/purchase', vehicleController.purchase);
router.post('/:id/restock', requireRole('admin'), vehicleController.restock);
router.post('/:id/adjust', requireRole('admin'), vehicleController.adjust);

export default router;
