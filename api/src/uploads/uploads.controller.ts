import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { Express } from 'express';
import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly configService: ConfigService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('please upload with multipart/form-data');
    }

    const bucket = this.configService.getOrThrow<string>('AWS_S3_BUCKET');
    const client = new S3Client({
      region: this.configService.getOrThrow<string>('AWS_REGION'),
      endpoint:
        this.configService.get<string>('AWS_ENDPOINT_URL_S3') || undefined,
      credentials: {
        accessKeyId: this.configService.getOrThrow<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.getOrThrow<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });
    const key = `uploads/${randomUUID()}${extname(file.originalname).toLowerCase()}`;

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    const url = await getSignedUrl(
      client,
      new GetObjectCommand({ Bucket: bucket, Key: key }),
    );

    return { key, url };
  }
}
