import type { AuthenticatedPrincipal } from '@/auth/auth-principal';
import { CurrentHttpPrincipal } from '@/auth/current-http-principal.decorator';
import { HttpAuthGuard } from '@/auth/http-auth.guard';
import { Roles } from '@/auth/roles.decorator';
import { RolesGuard } from '@/auth/roles.guard';
import { UserRole } from '@/users/user-role.enum';
import { UploadImageService } from '@/uploads/application/upload-image.service';
import {
  InvalidUploadedImageError,
  PublicImageStorageUnavailableError,
} from '@/uploads/domain/upload-errors';
import { UploadImageBody } from '@/uploads/dto/upload-image.body';
import type { UploadImageResponse } from '@/uploads/dto/upload-image.response';
import {
  UPLOAD_FILE_FIELD,
  UPLOAD_MAX_SOURCE_BYTES,
} from '@/uploads/upload.constants';
import { UploadThrottlerGuard } from '@/uploads/upload-throttler.guard';
import {
  BadRequestException,
  Body,
  Controller,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  ServiceUnavailableException,
  UnprocessableEntityException,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Express } from 'express';

@Controller('uploads')
@UseGuards(HttpAuthGuard, RolesGuard, UploadThrottlerGuard)
@Roles(UserRole.OWNER)
export class UploadsController {
  constructor(private readonly uploads: UploadImageService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Header('Cache-Control', 'no-store')
  @UseInterceptors(
    FileInterceptor(UPLOAD_FILE_FIELD, {
      limits: {
        fieldNameSize: 50,
        fieldSize: 100,
        fields: 1,
        fileSize: UPLOAD_MAX_SOURCE_BYTES,
        files: 1,
        parts: 2,
      },
    }),
  )
  async uploadImage(
    @CurrentHttpPrincipal() principal: AuthenticatedPrincipal,
    @Body() body: UploadImageBody,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<UploadImageResponse> {
    if (!file) {
      throw new BadRequestException(
        `Multipart field "${UPLOAD_FILE_FIELD}" is required.`,
      );
    }

    try {
      return await this.uploads.upload(principal, body.purpose, {
        bytes: file.buffer,
        declaredContentType: file.mimetype,
      });
    } catch (error: unknown) {
      if (error instanceof InvalidUploadedImageError) {
        throw new UnprocessableEntityException(error.message);
      }

      if (error instanceof PublicImageStorageUnavailableError) {
        throw new ServiceUnavailableException(
          'Image storage is temporarily unavailable.',
        );
      }

      throw error;
    }
  }
}
