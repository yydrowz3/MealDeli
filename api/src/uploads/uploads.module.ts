import { AuthModule } from '@/auth/auth.module';
import { UploadImageService } from '@/uploads/application/upload-image.service';
import { IMAGE_PROCESSOR } from '@/uploads/integrations/image-processor.port';
import { PUBLIC_IMAGE_STORAGE } from '@/uploads/integrations/public-image-storage.port';
import { SharpImageProcessor } from '@/uploads/integrations/sharp-image.processor';
import { SupabaseImageStorageAdapter } from '@/uploads/integrations/supabase-image-storage.adapter';
import {
  UPLOAD_RATE_LIMIT_MAX,
  UPLOAD_RATE_LIMIT_TTL_MS,
} from '@/uploads/upload.constants';
import { UploadThrottlerGuard } from '@/uploads/upload-throttler.guard';
import { UploadsController } from '@/uploads/uploads.controller';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    AuthModule,
    ConfigModule,
    ThrottlerModule.forRoot([
      {
        name: 'uploads',
        ttl: UPLOAD_RATE_LIMIT_TTL_MS,
        limit: UPLOAD_RATE_LIMIT_MAX,
      },
    ]),
  ],
  controllers: [UploadsController],
  providers: [
    UploadImageService,
    SharpImageProcessor,
    SupabaseImageStorageAdapter,
    UploadThrottlerGuard,
    {
      provide: IMAGE_PROCESSOR,
      useExisting: SharpImageProcessor,
    },
    {
      provide: PUBLIC_IMAGE_STORAGE,
      useExisting: SupabaseImageStorageAdapter,
    },
  ],
})
export class UploadsModule {}
