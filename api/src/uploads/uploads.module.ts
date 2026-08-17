import { Module } from '@nestjs/common';
import { UploadsController } from './uploads.controller';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../auth/auth.module';
import { UploadsService } from './uploads.service';
import { S3UploadsStorage, UPLOADS_STORAGE } from './uploads.storage';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [UploadsController],
  providers: [
    UploadsService,
    { provide: UPLOADS_STORAGE, useClass: S3UploadsStorage },
  ],
})
export class UploadsModule {}
