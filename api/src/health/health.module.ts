import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { PrismaModule } from '@/prisma/prisma.module';
import { HealthController } from './health.controller';
import { HealthResolver } from './health.resolver';

@Module({
  imports: [TerminusModule, PrismaModule],
  controllers: [HealthController],
  providers: [HealthResolver],
})
export class HealthModule {}
