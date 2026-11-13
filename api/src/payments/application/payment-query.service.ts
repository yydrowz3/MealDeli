import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import type { PageResult } from '@/common/pagination/page.types';
import { UserRole } from '@/users/user-role.enum';
import { PaymentModel } from '../models/payment.model';
import { PaymentMapper } from '../persistence/payment.mapper';
import { PaymentRepository } from '../persistence/payment.repository';
import { ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class PaymentQueryService {
  constructor(
    private readonly payments: PaymentRepository,
    private readonly mapper: PaymentMapper,
  ) {}

  async myPayments(
    principal: AuthenticatedPrincipal,
    page: number,
  ): Promise<PageResult<PaymentModel>> {
    if (principal.role !== UserRole.OWNER) {
      throw new ForbiddenException('Owner access is required.');
    }

    const result = await this.payments.listOwnerPayments(
      principal.userId,
      page,
    );
    return {
      ...result,
      results: result.results.map((payment) => this.mapper.toModel(payment)),
    };
  }
}
