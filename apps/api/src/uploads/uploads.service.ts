import {
  Inject,
  Injectable,
  InternalServerErrorException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Express } from 'express';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { buildPublicAssetUrl, getPublicAssetBaseUrl } from './public-asset-url';
import { UPLOADS_STORAGE, type UploadsStorage } from './uploads.storage';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

type ImageFormat = {
  mime: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: 'jpg' | 'png' | 'webp';
  acceptedOriginalExtensions: string[];
  hasSignature(buffer: Buffer): boolean;
};

const IMAGE_FORMATS: ImageFormat[] = [
  {
    mime: 'image/jpeg',
    extension: 'jpg',
    acceptedOriginalExtensions: ['.jpg', '.jpeg'],
    hasSignature: (buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  {
    mime: 'image/png',
    extension: 'png',
    acceptedOriginalExtensions: ['.png'],
    hasSignature: (buffer) =>
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  {
    mime: 'image/webp',
    extension: 'webp',
    acceptedOriginalExtensions: ['.webp'],
    hasSignature: (buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP',
  },
];

export type UploadedImageResponse = { key: string; url: string };

@Injectable()
export class UploadsService {
  constructor(
    private readonly configService: ConfigService,
    @Inject(UPLOADS_STORAGE) private readonly storage: UploadsStorage,
  ) {}

  async upload(file: Express.Multer.File): Promise<UploadedImageResponse> {
    if (file.size > MAX_UPLOAD_BYTES || file.buffer.length > MAX_UPLOAD_BYTES) {
      throw new PayloadTooLargeException('Image must be 5 MB or smaller.');
    }

    const format = IMAGE_FORMATS.find(
      (candidate) =>
        candidate.mime === file.mimetype &&
        candidate.acceptedOriginalExtensions.includes(
          extname(file.originalname).toLowerCase(),
        ) &&
        candidate.hasSignature(file.buffer),
    );
    if (!format) {
      throw new UnsupportedMediaTypeException(
        'Choose a JPEG, PNG, or WebP image.',
      );
    }

    const key = `uploads/${randomUUID()}.${format.extension}`;
    const baseUrl = getPublicAssetBaseUrl(this.configService);
    try {
      await this.storage.put({
        key,
        body: file.buffer,
        contentType: format.mime,
      });
    } catch {
      throw new InternalServerErrorException('Image upload failed.');
    }

    return { key, url: buildPublicAssetUrl(baseUrl, key) };
  }
}
