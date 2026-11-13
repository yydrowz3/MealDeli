import { InvalidUploadedImageError } from '@/uploads/domain/upload-errors';
import type {
  ImageProcessorPort,
  IncomingImage,
  ProcessedImage,
} from '@/uploads/integrations/image-processor.port';
import {
  UPLOAD_MAX_DIMENSION,
  UPLOAD_MAX_OUTPUT_BYTES,
  UPLOAD_MAX_PIXELS,
  UPLOAD_MAX_SOURCE_BYTES,
  UPLOAD_OUTPUT_CONTENT_TYPE,
  UPLOAD_OUTPUT_EXTENSION,
} from '@/uploads/upload.constants';
import { Injectable } from '@nestjs/common';
import sharp, { type Sharp } from 'sharp';

const EXPECTED_FORMAT_BY_CONTENT_TYPE = new Map<string, string>([
  ['image/jpeg', 'jpeg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
]);

@Injectable()
export class SharpImageProcessor implements ImageProcessorPort {
  async process(input: IncomingImage): Promise<ProcessedImage> {
    validateSourceSize(input.bytes);

    const expectedFormat = EXPECTED_FORMAT_BY_CONTENT_TYPE.get(
      input.declaredContentType.toLowerCase(),
    );
    if (!expectedFormat) {
      throw new InvalidUploadedImageError(
        'Only JPEG, PNG, and WebP images are accepted.',
      );
    }

    try {
      const metadata = await createSafeSharp(input.bytes).metadata();
      if (metadata.format !== expectedFormat) {
        throw new InvalidUploadedImageError(
          'The declared content type does not match the image content.',
        );
      }

      if ((metadata.pages ?? 1) !== 1) {
        throw new InvalidUploadedImageError(
          'Animated or multi-page images are not accepted.',
        );
      }

      const width = metadata.width;
      const height = metadata.height;
      if (!width || !height) {
        throw new InvalidUploadedImageError(
          'The image dimensions could not be determined.',
        );
      }

      if (width > UPLOAD_MAX_DIMENSION || height > UPLOAD_MAX_DIMENSION) {
        throw new InvalidUploadedImageError(
          `Image width and height must not exceed ${UPLOAD_MAX_DIMENSION}px.`,
        );
      }

      if (width * height > UPLOAD_MAX_PIXELS) {
        throw new InvalidUploadedImageError(
          `Image pixel count must not exceed ${UPLOAD_MAX_PIXELS}.`,
        );
      }

      const { data, info } = await createSafeSharp(input.bytes)
        .rotate()
        .webp({
          quality: 82,
          alphaQuality: 90,
          effort: 4,
          smartSubsample: true,
        })
        .toBuffer({ resolveWithObject: true });

      if (data.byteLength > UPLOAD_MAX_OUTPUT_BYTES) {
        throw new InvalidUploadedImageError(
          'The processed image exceeds the storage size limit.',
        );
      }

      return {
        bytes: data,
        contentType: UPLOAD_OUTPUT_CONTENT_TYPE,
        extension: UPLOAD_OUTPUT_EXTENSION,
        sizeBytes: data.byteLength,
        width: info.width,
        height: info.height,
      };
    } catch (error: unknown) {
      if (error instanceof InvalidUploadedImageError) {
        throw error;
      }

      throw new InvalidUploadedImageError(
        'File content is not a valid supported image.',
      );
    }
  }
}

function validateSourceSize(bytes: Buffer): void {
  if (bytes.byteLength === 0) {
    throw new InvalidUploadedImageError('The uploaded file is empty.');
  }

  if (bytes.byteLength > UPLOAD_MAX_SOURCE_BYTES) {
    throw new InvalidUploadedImageError(
      `The uploaded file must not exceed ${UPLOAD_MAX_SOURCE_BYTES} bytes.`,
    );
  }
}

function createSafeSharp(bytes: Buffer): Sharp {
  return sharp(bytes, {
    animated: false,
    failOn: 'warning',
    limitInputPixels: UPLOAD_MAX_PIXELS,
    pages: 1,
  });
}
