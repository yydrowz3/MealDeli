export class InvalidUploadedImageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidUploadedImageError';
  }
}

export class PublicImageStorageUnavailableError extends Error {
  constructor() {
    super('Public image storage is unavailable.');
    this.name = 'PublicImageStorageUnavailableError';
  }
}
