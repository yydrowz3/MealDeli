import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [UploadsController],
})
export class UploadsModule {}
