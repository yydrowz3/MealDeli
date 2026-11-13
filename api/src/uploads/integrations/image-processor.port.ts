import type {
  UPLOAD_OUTPUT_CONTENT_TYPE,
  UPLOAD_OUTPUT_EXTENSION,
} from '@/uploads/upload.constants';

export const IMAGE_PROCESSOR = Symbol('IMAGE_PROCESSOR');

export interface IncomingImage {
  bytes: Buffer;
  declaredContentType: string;
}

export interface ProcessedImage {
  bytes: Buffer;
  contentType: typeof UPLOAD_OUTPUT_CONTENT_TYPE;
  extension: typeof UPLOAD_OUTPUT_EXTENSION;
  sizeBytes: number;
  width: number;
  height: number;
}

export interface ImageProcessorPort {
  process(input: IncomingImage): Promise<ProcessedImage>;
}
