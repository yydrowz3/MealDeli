import { assertOwner } from './assert-owner';
import { parseCatalogInput } from './parse-catalog-input';
import {
  NormalizedCategoryName,
  normalizeCategoryName,
} from '../domain/category-name';
import { normalizeCatalogText, normalizeHttpUrl } from '../domain/catalog-text';
import { CatalogMutationError, CatalogResult } from '../domain/catalog-result';
import type { RestaurantModel } from '../models/restaurant.model';
import { CatalogMapper } from '../persistence/catalog.mapper';
import { hasPrismaCode } from '../persistence/prisma-error';
import { RestaurantRepository } from '../persistence/restaurant.repository';
import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import { CLOCK, type Clock } from '@/common/time/clock';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';

export interface CreateRestaurantCommand {
  name: string;
  address: string;
  coverImageUrl: string;
  categoryName: string;
}

export interface EditRestaurantCommand {
  restaurantId: string;
  name?: string | null;
  address?: string | null;
  coverImageUrl?: string | null;
  categoryName?: string | null;
}

interface RestaurantChanges {
  name?: string;
  address?: string;
  coverImageUrl?: string;
  category?: NormalizedCategoryName;
}

@Injectable()
export class RestaurantManagementService {
  constructor(
    private readonly restaurants: RestaurantRepository,
    private readonly mapper: CatalogMapper,
    @Inject(CLOCK)
    private readonly clock: Clock,
  ) {}

  async create(
    principal: AuthenticatedPrincipal,
    command: CreateRestaurantCommand,
  ): Promise<CatalogResult<RestaurantModel>> {
    assertOwner(principal);
    const input = parseCatalogInput(() => ({
      ownerId: principal.userId,
      name: normalizeCatalogText(command.name, 'name', 1, 120),
      address: normalizeCatalogText(command.address, 'address', 3, 255),
      coverImageUrl: normalizeHttpUrl(command.coverImageUrl, 'coverImageUrl'),
      category: normalizeCategoryName(command.categoryName),
    }));

    try {
      const created = await this.restaurants.create(input);
      return {
        ok: true,
        value: this.mapper.toRestaurant(created, this.clock.now()),
      };
    } catch (error) {
      if (hasPrismaCode(error, 'P2002')) {
        return {
          ok: false,
          error: CatalogMutationError.CategoryConflict,
        };
      }
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
    command: EditRestaurantCommand,
  ): Promise<CatalogResult<undefined>> {
    assertOwner(principal);
    const changes = parseCatalogInput(() => normalizeChanges(command));

    if (Object.keys(changes).length === 0) {
      throw new BadRequestException(
        'At least one restaurant field must be changed.',
      );
    }

    try {
      const updated = await this.restaurants.update({
        restaurantId: command.restaurantId,
        ownerId: principal.userId,
        ...changes,
      });
      return updated
        ? { ok: true, value: undefined }
        : {
            ok: false,
            error: CatalogMutationError.ResourceUnavailable,
          };
    } catch (error) {
      if (hasPrismaCode(error, 'P2002')) {
        return {
          ok: false,
          error: CatalogMutationError.CategoryConflict,
        };
      }
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
    restaurantId: string,
  ): Promise<CatalogResult<undefined>> {
    assertOwner(principal);

    try {
      const deleted = await this.restaurants.delete(
        restaurantId,
        principal.userId,
      );
      return deleted
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
}

function normalizeChanges(command: EditRestaurantCommand): RestaurantChanges {
  const changes: RestaurantChanges = {};

  if (command.name !== undefined && command.name !== null) {
    changes.name = normalizeCatalogText(command.name, 'name', 1, 120);
  }
  if (command.address !== undefined && command.address !== null) {
    changes.address = normalizeCatalogText(command.address, 'address', 3, 255);
  }
  if (command.coverImageUrl !== undefined && command.coverImageUrl !== null) {
    changes.coverImageUrl = normalizeHttpUrl(
      command.coverImageUrl,
      'coverImageUrl',
    );
  }
  if (command.categoryName !== undefined && command.categoryName !== null) {
    changes.category = normalizeCategoryName(command.categoryName);
  }

  return changes;
}
