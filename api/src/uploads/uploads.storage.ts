import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

export const UPLOADS_STORAGE = Symbol('UPLOADS_STORAGE');

export type StoreUploadInput = {
  key: string;
  body: Buffer;
  contentType: string;
};

export interface UploadsStorage {
  put(input: StoreUploadInput): Promise<void>;
}

@Injectable()
export class S3UploadsStorage implements UploadsStorage {
  private readonly bucket: string;
  private readonly client: S3Client;

  constructor(configService: ConfigService) {
    this.bucket = configService.getOrThrow<string>('AWS_S3_BUCKET');
    this.client = new S3Client({
      region: configService.getOrThrow<string>('AWS_REGION'),
      endpoint: configService.get<string>('AWS_ENDPOINT_URL_S3') || undefined,
      credentials: {
        accessKeyId: configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: configService.getOrThrow<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  async put({ key, body, contentType }: StoreUploadInput): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
  }
}
