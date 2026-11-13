import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { ExpiredPromotionFact } from '../domain/promotion-event';
import { Injectable } from '@nestjs/common';

interface ExpiredPromotionRow {
  restaurantId: string;
  expiredAt: Date;
}

@Injectable()
export class PromotionExpiryRepository {
  constructor(private readonly prisma: PrismaService) {}

  expireBatch(now: Date, batchSize: number): Promise<ExpiredPromotionFact[]> {
    return this.prisma.$queryRaw<ExpiredPromotionRow[]>(Prisma.sql`
      WITH expired AS (
        SELECT "id", "promoted_until"
        FROM "restaurants"
        WHERE "promoted_until" IS NOT NULL
          AND "promoted_until" <= ${now}
        ORDER BY "promoted_until" ASC, "id" ASC
        FOR UPDATE SKIP LOCKED
        LIMIT ${batchSize}
      )
      UPDATE "restaurants" AS restaurant
      SET "promoted_until" = NULL,
          "updated_at" = ${now}
      FROM expired
      WHERE restaurant."id" = expired."id"
      RETURNING
        restaurant."id" AS "restaurantId",
        expired."promoted_until" AS "expiredAt"
    `);
  }
}
