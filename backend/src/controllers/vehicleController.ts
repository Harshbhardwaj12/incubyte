import type { Request, Response, NextFunction } from 'express';
import * as vehicleService from '../services/vehicleService.js';
import {
  createVehicleSchema,
  adjustmentSchema,
  purchaseSchema,
  restockSchema,
  searchVehiclesSchema,
  updateVehicleRequestSchema,
} from '../validation/vehicles.js';

import { z } from 'zod';

const vehicleIdSchema = z.string().uuid();

function parseVehicleId(id: string): string {
  return vehicleIdSchema.parse(id);
}

export async function create(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = createVehicleSchema.parse(req.body);
    const vehicle = await vehicleService.addVehicle({
      ...body,
      image_url: body.image_url || null,
    }, req.user!.sub);
    res.status(201).json({ vehicle });
  } catch (error) {
    next(error);
  }
}

export async function list(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const vehicles = await vehicleService.getAllVehicles();
    res.status(200).json({ vehicles });
  } catch (error) {
    next(error);
  }
}

export async function search(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const filters = searchVehiclesSchema.parse(req.query);
    const result = await vehicleService.searchVehicles(filters);
    res.status(200).json({
      vehicles: result.vehicles,
      pagination: {
        page: filters.page,
        pageSize: filters.pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / filters.pageSize),
      },
    });
  } catch (error) {
    next(error);
  }
}

export async function update(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = updateVehicleRequestSchema.parse(req.body);
    const { reason, ...vehicleInput } = body;
    const vehicle = await vehicleService.updateVehicle(
      parseVehicleId(req.params.id),
      {
        ...vehicleInput,
        image_url: vehicleInput.image_url === '' ? null : vehicleInput.image_url,
      },
      req.user!.sub,
      reason,
    );
    res.status(200).json({ vehicle });
  } catch (error) {
    next(error);
  }
}

export async function detail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const vehicle = await vehicleService.getVehicle(parseVehicleId(req.params.id));
    res.status(200).json({ vehicle });
  } catch (error) {
    next(error);
  }
}

export async function remove(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    await vehicleService.removeVehicle(parseVehicleId(req.params.id));
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function purchase(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = purchaseSchema.parse(req.body);
    const result = await vehicleService.purchaseVehicle(
      parseVehicleId(req.params.id),
      req.user!.sub,
      body.quantity,
    );
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

export async function restock(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = restockSchema.parse(req.body);
    const vehicle = await vehicleService.restockVehicle(
      parseVehicleId(req.params.id),
      body.quantity,
      req.user!.sub,
      body.reason,
    );
    res.status(200).json({ vehicle });
  } catch (error) {
    next(error);
  }
}

export async function adjust(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = adjustmentSchema.parse(req.body);
    const vehicle = await vehicleService.adjustStock(
      parseVehicleId(req.params.id),
      body.quantityChange,
      req.user!.sub,
      body.reason,
    );
    res.status(200).json({ vehicle });
  } catch (error) {
    next(error);
  }
}
