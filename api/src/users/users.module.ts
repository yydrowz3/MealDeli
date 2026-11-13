import { AuthModule } from '@/auth/auth.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { ResendVerificationMailer } from '@/users/resend-verification-mailer.service';
import { UsersRepository } from '@/users/users.repository';
import { UsersResolver } from '@/users/users.resolver';
import { UsersService } from '@/users/users.service';
import { VERIFICATION_MAILER } from '@/users/verification-mailer.port';
import { VerificationTokenService } from '@/users/verification-token.service';
import { Module } from '@nestjs/common';

@Module({
  imports: [PrismaModule, AuthModule],
  providers: [
    UsersResolver,
    UsersService,
    UsersRepository,
    VerificationTokenService,
    ResendVerificationMailer,
    {
      provide: VERIFICATION_MAILER,
      useExisting: ResendVerificationMailer,
    },
  ],
})
export class UsersModule {}
