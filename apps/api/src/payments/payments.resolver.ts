import { Args, Resolver, Query, Mutation } from '@nestjs/graphql';
import { PaymentsService } from './payments.service';
import { Payment } from './entities/payment.entity';
import {
  CreatePaymentInput,
  CreatePaymentOutput,
} from './dto/create-payment.dto';
import { AuthUser } from '../auth/decorator/auth-user.decorator';
import { User } from '../users/entities/user.entity';
import { Roles } from '../auth/decorator/roles.decorator';
import { UserRole } from '../users/enums/role.enum';
import { GetPaymentsOutput } from './dto/get-payments.dto';

@Resolver(() => Payment)
export class PaymentsResolver {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Mutation(() => CreatePaymentOutput)
  @Roles(UserRole.OWNER)
  createPayment(
    @AuthUser() owner: User,
    @Args('input') createPaymentInput: CreatePaymentInput,
  ): Promise<CreatePaymentOutput> {
    return this.paymentsService.createPayment(owner, createPaymentInput);
  }

  @Query(() => GetPaymentsOutput)
  @Roles(UserRole.OWNER)
  getPayments(@AuthUser() owner: User): Promise<GetPaymentsOutput> {
    return this.paymentsService.getPayments(owner);
  }
}
