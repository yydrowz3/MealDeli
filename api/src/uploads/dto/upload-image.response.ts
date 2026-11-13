import type { UPLOAD_OUTPUT_CONTENT_TYPE } from '@/uploads/upload.constants';

export interface UploadImageResponse {
  ok: true;
  url: string;
  contentType: typeof UPLOAD_OUTPUT_CONTENT_TYPE;
  sizeBytes: number;
  width: number;
  height: number;
}
