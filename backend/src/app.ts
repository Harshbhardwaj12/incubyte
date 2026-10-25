import cors from 'cors';
import express from 'express';
import authRoutes from './routes/authRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import stockMovementRoutes from './routes/stockMovementRoutes.js';
import vehicleRoutes from './routes/vehicleRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/stock-movements', stockMovementRoutes);
  app.use('/api/vehicles', vehicleRoutes);

  app.use(errorHandler);

  return app;
}
