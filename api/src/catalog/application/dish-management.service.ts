import { assertOwner } from './assert-owner';
import { parseCatalogInput } from './parse-catalog-input';
import {
  normalizeCatalogText,
  normalizeHttpUrl,
  normalizeNullableHttpUrl,
} from '../domain/catalog-text';
import {
  MenuOptionDefinition,
  parseMenuOptionDefinitions,
} from '../domain/menu-option-definition';
import { parseMoneyMinor } from '../domain/money';
import { CatalogMutationError, CatalogResult } from '../domain/catalog-result';
import { DishModel } from '../models/dish.model';
import { CatalogMapper } from '../persistence/catalog.mapper';
import { DishRepository } from '../persistence/dish.repository';
import { hasPrismaCode } from '../persistence/prisma-error';
import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import { BadRequestException, Injectable } from '@nestjs/common';

export interface CreateDishCommand {
  restaurantId: string;
  name: string;
  description: string;
  priceMinor: number;
  photoUrl?: string | null;
  options: unknown;
}

export interface EditDishCommand {
  dishId: string;
  name?: string | null;
  description?: string | null;
  priceMinor?: number | null;
  photoUrl?: string | null;
  options?: unknown;
}

interface DishChanges {
  name?: string;
  description?: string;
  priceMinor?: number;
  photoUrl?: string | null;
  options?: MenuOptionDefinition[];
}

@Injectable()
export class DishManagementService {
  constructor(
    private readonly dishes: DishRepository,
    private readonly mapper: CatalogMapper,
  ) {}

  async create(
    principal: AuthenticatedPrincipal,
    command: CreateDishCommand,
  ): Promise<CatalogResult<DishModel>> {
    assertOwner(principal);
    const input = parseCatalogInput(() => ({
      ownerId: principal.userId,
      restaurantId: command.restaurantId,
      name: normalizeCatalogText(command.name, 'name', 1, 120),
      description: normalizeCatalogText(
        command.description,
        'description',
        5,
        500,
      ),
      priceMinor: parseMoneyMinor(command.priceMinor, 'priceMinor'),
      photoUrl: normalizeNullableHttpUrl(command.photoUrl, 'photoUrl'),
      options: parseMenuOptionDefinitions(command.options),
    }));

    try {
      const created = await this.dishes.create(input);
      return created
        ? {
            ok: true,
            value: this.mapper.toDish(created),
          }
        : {
            ok: false,
            error: CatalogMutationError.ResourceUnavailable,
          };
    } catch (error) {
      if (hasPrismaCode(error, 'P2003') || hasPrismaCode(error, 'P2025')) {
        return {
          ok: false,
          error: CatalogMutationError.ResourceUnavailable,
        };
      }
      throw error;
    }
  }

  async edit(
    principal: AuthenticatedPrincipal,
    command: EditDishCommand,
  ): Promise<CatalogResult<undefined>> {
    assertOwner(principal);
    const changes = parseCatalogInput(() => normalizeChanges(command));

    if (Object.keys(changes).length === 0) {
      throw new BadRequestException('At least one dish field must be changed.');
    }

    try {
      const updated = await this.dishes.update({
        ownerId: principal.userId,
        dishId: command.dishId,
        ...changes,
      });
      return updated
        ? { ok: true, value: undefined }
        : {
            ok: false,
            error: CatalogMutationError.ResourceUnavailable,
          };
    } catch (error) {
      if (hasPrismaCode(error, 'P2003') || hasPrismaCode(error, 'P2025')) {
        return {
          ok: false,
          error: CatalogMutationError.ResourceUnavailable,
        };
      }
      throw error;
    }
  }

  async delete(
    principal: AuthenticatedPrincipal,
    dishId: string,
  ): Promise<CatalogResult<undefined>> {
    assertOwner(principal);
    const deleted = await this.dishes.delete(dishId, principal.userId);
    return deleted
      ? { ok: true, value: undefined }
      : {
          ok: false,
          error: CatalogMutationError.ResourceUnavailable,
        };
  }
}

function normalizeChanges(command: EditDishCommand): DishChanges {
  const changes: DishChanges = {};

  if (command.name !== undefined && command.name !== null) {
    changes.name = normalizeCatalogText(command.name, 'name', 1, 120);
  }
  if (command.description !== undefined && command.description !== null) {
    changes.description = normalizeCatalogText(
      command.description,
      'description',
      5,
      500,
    );
  }
  if (command.priceMinor !== undefined && command.priceMinor !== null) {
    changes.priceMinor = parseMoneyMinor(command.priceMinor, 'priceMinor');
  }
  if (command.photoUrl !== undefined) {
    changes.photoUrl =
      command.photoUrl === null
        ? null
        : normalizeHttpUrl(command.photoUrl, 'photoUrl');
  }
  if (command.options !== undefined && command.options !== null) {
    changes.options = parseMenuOptionDefinitions(command.options);
  }

  return changes;
}
