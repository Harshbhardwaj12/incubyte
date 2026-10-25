import { AppError } from '../errors.js';
import { withTransaction } from '../db/pool.js';
import * as vehicleRepository from '../repositories/vehicleRepository.js';
import type {
  VehicleInput,
  VehicleSearchFilters,
  VehicleSearchResult,
} from '../repositories/vehicleRepository.js';
import * as purchaseRepository from '../repositories/purchaseRepository.js';
import * as stockMovementRepository from '../repositories/stockMovementRepository.js';
import type { Purchase, Vehicle } from '../types.js';

export async function addVehicle(input: VehicleInput, actingUserId: string): Promise<Vehicle> {
  return withTransaction(async (client) => {
    const vehicle = await vehicleRepository.createVehicle(input, client);
    if (vehicle.quantity > 0) {
      await stockMovementRepository.createMovement(
        {
          vehicleId: vehicle.id,
          vehicleMake: vehicle.make,
          vehicleModel: vehicle.model,
          vehicleCategory: vehicle.category,
          movementType: 'adjustment',
          quantityChange: vehicle.quantity,
          previousQuantity: 0,
          newQuantity: vehicle.quantity,
          actingUserId,
          reason: 'Initial inventory',
        },
        client,
      );
    }
    return vehicle;
  });
}

export async function getAllVehicles(): Promise<Vehicle[]> {
  return vehicleRepository.listVehicles();
}

export async function getVehicle(id: string): Promise<Vehicle> {
  const vehicle = await vehicleRepository.findVehicleById(id);
  if (!vehicle) {
    throw new AppError(404, 'Vehicle not found', 'NOT_FOUND');
  }
  return vehicle;
}

export async function searchVehicles(
  filters: VehicleSearchFilters,
): Promise<VehicleSearchResult> {
  return vehicleRepository.searchVehicles(filters);
}

export async function updateVehicle(
  id: string,
  input: Partial<VehicleInput>,
  actingUserId: string,
  reason?: string,
): Promise<Vehicle> {
  return withTransaction(async (client) => {
    const current = input.quantity === undefined
      ? null
      : await vehicleRepository.findVehicleByIdForUpdate(id, client);
    if (input.quantity !== undefined && !current) {
      throw new AppError(404, 'Vehicle not found', 'NOT_FOUND');
    }
    if (
      current &&
      input.quantity !== current.quantity &&
      !reason
    ) {
      throw new AppError(400, 'A reason is required for stock changes', 'REASON_REQUIRED');
    }

    const updated = await vehicleRepository.updateVehicle(id, input, client);
    if (!updated) {
      throw new AppError(404, 'Vehicle not found', 'NOT_FOUND');
    }

    if (current && input.quantity !== current.quantity) {
      await stockMovementRepository.createMovement(
        {
          vehicleId: updated.id,
          vehicleMake: updated.make,
          vehicleModel: updated.model,
          vehicleCategory: updated.category,
          movementType: 'adjustment',
          quantityChange: updated.quantity - current.quantity,
          previousQuantity: current.quantity,
          newQuantity: updated.quantity,
          actingUserId,
          reason: reason!,
        },
        client,
      );
    }
    return updated;
  });
}

export async function removeVehicle(id: string): Promise<void> {
  const deleted = await vehicleRepository.deleteVehicle(id);
  if (!deleted) {
    throw new AppError(404, 'Vehicle not found', 'NOT_FOUND');
  }
}

export async function purchaseVehicle(
  vehicleId: string,
  userId: string,
  quantity: number,
): Promise<{ vehicle: Vehicle; purchase: Purchase }> {
  return withTransaction(async (client) => {
    const vehicle = await vehicleRepository.findVehicleByIdForUpdate(vehicleId, client);
    if (!vehicle) {
      throw new AppError(404, 'Vehicle not found', 'NOT_FOUND');
    }

    const updated = await vehicleRepository.decrementStockIfAvailable(
      vehicleId,
      quantity,
      client,
    );
    if (!updated) {
      throw new AppError(409, 'Insufficient stock', 'INSUFFICIENT_STOCK');
    }

    await stockMovementRepository.createMovement(
      {
        vehicleId: updated.id,
        vehicleMake: updated.make,
        vehicleModel: updated.model,
        vehicleCategory: updated.category,
        movementType: 'purchase',
        quantityChange: -quantity,
        previousQuantity: vehicle.quantity,
        newQuantity: updated.quantity,
        actingUserId: userId,
        reason: 'Customer purchase',
      },
      client,
    );

    const unitPrice = Number(vehicle.price);
    const purchase = await purchaseRepository.createPurchase(
      {
        userId,
        vehicleId,
        quantity,
        unitPrice,
        totalPrice: unitPrice * quantity,
        vehicleMake: vehicle.make,
        vehicleModel: vehicle.model,
        vehicleCategory: vehicle.category,
      },
      client,
    );

    return { vehicle: updated, purchase };
  });
}

export async function restockVehicle(
  vehicleId: string,
  quantity: number,
  actingUserId: string,
  reason = 'Admin restock',
): Promise<Vehicle> {
  return withTransaction(async (client) => {
    const current = await vehicleRepository.findVehicleByIdForUpdate(vehicleId, client);
    if (!current) {
      throw new AppError(404, 'Vehicle not found', 'NOT_FOUND');
    }
    const updated = await vehicleRepository.incrementStock(vehicleId, quantity, client);
    if (!updated) {
      throw new AppError(404, 'Vehicle not found', 'NOT_FOUND');
    }
    await stockMovementRepository.createMovement(
      {
        vehicleId: updated.id,
        vehicleMake: updated.make,
        vehicleModel: updated.model,
        vehicleCategory: updated.category,
        movementType: 'restock',
        quantityChange: quantity,
        previousQuantity: current.quantity,
        newQuantity: updated.quantity,
        actingUserId,
        reason,
      },
      client,
    );
    return updated;
  });
}

export async function adjustStock(
  vehicleId: string,
  quantityChange: number,
  actingUserId: string,
  reason: string,
): Promise<Vehicle> {
  return withTransaction(async (client) => {
    const current = await vehicleRepository.findVehicleByIdForUpdate(vehicleId, client);
    if (!current) {
      throw new AppError(404, 'Vehicle not found', 'NOT_FOUND');
    }
    const newQuantity = current.quantity + quantityChange;
    if (newQuantity < 0) {
      throw new AppError(409, 'Stock cannot become negative', 'INVALID_STOCK_ADJUSTMENT');
    }
    const updated = await vehicleRepository.updateVehicle(
      vehicleId,
      { quantity: newQuantity },
      client,
    );
    if (!updated) {
      throw new AppError(404, 'Vehicle not found', 'NOT_FOUND');
    }
    await stockMovementRepository.createMovement(
      {
        vehicleId: updated.id,
        vehicleMake: updated.make,
        vehicleModel: updated.model,
        vehicleCategory: updated.category,
        movementType: 'adjustment',
        quantityChange,
        previousQuantity: current.quantity,
        newQuantity: updated.quantity,
        actingUserId,
        reason,
      },
      client,
    );
    return updated;
  });
}
