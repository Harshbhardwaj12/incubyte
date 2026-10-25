import type { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService.js';
import { loginSchema, registerSchema } from '../validation/auth.js';

export async function register(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = registerSchema.parse(req.body);
    const result = await authService.register(body.email, body.password);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = loginSchema.parse(req.body);
    const result = await authService.login(body.email, body.password);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

export async function me(req: Request, res: Response): Promise<void> {
  res.status(200).json({
    user: {
      id: req.user!.sub,
      email: req.user!.email,
      role: req.user!.role,
    },
  });
}
