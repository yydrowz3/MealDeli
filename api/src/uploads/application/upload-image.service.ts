import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import { UserRole } from '@/users/user-role.enum';
import {
  UPLOAD_PURPOSE_FOLDERS,
  type UploadPurpose,
} from '@/uploads/domain/upload-purpose';
import {
  IMAGE_PROCESSOR,
  type ImageProcessorPort,
  type IncomingImage,
} from '@/uploads/integrations/image-processor.port';
import {
  PUBLIC_IMAGE_STORAGE,
  type PublicImageStoragePort,
} from '@/uploads/integrations/public-image-storage.port';
import type { UploadImageResponse } from '@/uploads/dto/upload-image.response';
import { UPLOAD_PUBLIC_CACHE_SECONDS } from '@/uploads/upload.constants';
import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';

@Injectable()
export class UploadImageService {
  constructor(
    @Inject(IMAGE_PROCESSOR)
    private readonly imageProcessor: ImageProcessorPort,
    @Inject(PUBLIC_IMAGE_STORAGE)
    private readonly storage: PublicImageStoragePort,
  ) {}

  async upload(
    principal: AuthenticatedPrincipal,
    purpose: UploadPurpose,
    input: IncomingImage,
  ): Promise<UploadImageResponse> {
    if (principal.role !== UserRole.OWNER) {
      throw new ForbiddenException('Only restaurant owners may upload images.');
    }

    const processed = await this.imageProcessor.process(input);
    const folder = UPLOAD_PURPOSE_FOLDERS[purpose];
    const objectKey = `${folder}/${principal.userId}/${randomUUID()}.${processed.extension}`;
    const stored = await this.storage.put({
      objectKey,
      bytes: processed.bytes,
      contentType: processed.contentType,
      cacheControlSeconds: UPLOAD_PUBLIC_CACHE_SECONDS,
    });

    return {
      ok: true,
      url: stored.url,
      contentType: processed.contentType,
      sizeBytes: processed.sizeBytes,
      width: processed.width,
      height: processed.height,
    };
  }
}
