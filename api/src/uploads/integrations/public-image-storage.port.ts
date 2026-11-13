export const PUBLIC_IMAGE_STORAGE = Symbol('PUBLIC_IMAGE_STORAGE');

export interface PutPublicImageCommand {
  objectKey: string;
  bytes: Buffer;
  contentType: 'image/webp';
  cacheControlSeconds: number;
}

export interface StoredPublicImage {
  url: string;
}

export interface PublicImageStoragePort {
  put(command: PutPublicImageCommand): Promise<StoredPublicImage>;
}
