import {
  InternalServerErrorException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Express } from 'express';
import { MAX_UPLOAD_BYTES, UploadsService } from './uploads.service';
import type { StoreUploadInput, UploadsStorage } from './uploads.storage';

const signatures = {
  jpeg: Buffer.from([0xff, 0xd8, 0xff, 0x00]),
  png: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  webp: Buffer.from('RIFF0000WEBP', 'ascii'),
};

function buildFile(
  originalname: string,
  mimetype: string,
  buffer: Buffer,
): Express.Multer.File {
  return {
    fieldname: 'file',
    originalname,
    encoding: '7bit',
    mimetype,
    size: buffer.length,
    destination: '',
    filename: '',
    path: '',
    buffer,
    stream: undefined as never,
  };
}

describe('UploadsService', () => {
  let puts: StoreUploadInput[];
  let put: jest.MockedFunction<UploadsStorage['put']>;
  let storage: UploadsStorage;
  let service: UploadsService;

  beforeEach(() => {
    puts = [];
    put = jest.fn((input) => {
      puts.push(input);
      return Promise.resolve();
    });
    storage = { put };
    const config = new ConfigService({
      PUBLIC_ASSET_BASE_URL: 'https://assets.example.com/base',
      NODE_ENV: 'test',
    });
    service = new UploadsService(config, storage);
  });

  it.each([
    ['photo.jpeg', 'image/jpeg', signatures.jpeg, 'jpg'],
    ['photo.png', 'image/png', signatures.png, 'png'],
    ['photo.webp', 'image/webp', signatures.webp, 'webp'],
  ])(
    'accepts %s and rewrites a UUID key',
    async (name, mime, bytes, extension) => {
      const result = await service.upload(buildFile(name, mime, bytes));
      expect(result.key).toMatch(
        new RegExp(`^uploads/[0-9a-f-]{36}\\.${extension}$`),
      );
      expect(result.key).not.toContain('photo');
      expect(result.url).toBe(`https://assets.example.com/base/${result.key}`);
      expect(result.url).not.toContain('?');
      expect(puts).toEqual([
        { key: result.key, body: bytes, contentType: mime },
      ]);
    },
  );

  it('rejects oversized files before storage', async () => {
    const file = buildFile('large.png', 'image/png', signatures.png);
    file.size = MAX_UPLOAD_BYTES + 1;
    await expect(service.upload(file)).rejects.toBeInstanceOf(
      PayloadTooLargeException,
    );
    expect(put).not.toHaveBeenCalled();
  });

  it.each([
    ['photo.gif', 'image/gif', signatures.png],
    ['photo.jpg', 'image/png', signatures.png],
    ['photo.png', 'image/png', Buffer.from('not a png')],
  ])(
    'rejects forged format %s / %s before storage',
    async (name, mime, bytes) => {
      await expect(
        service.upload(buildFile(name, mime, bytes)),
      ).rejects.toBeInstanceOf(UnsupportedMediaTypeException);
      expect(put).not.toHaveBeenCalled();
    },
  );

  it('maps storage failures to a safe HTTP 500 without internal details', async () => {
    put.mockRejectedValue(new Error('secret credential'));
    await expect(
      service.upload(buildFile('photo.png', 'image/png', signatures.png)),
    ).rejects.toEqual(new InternalServerErrorException('Image upload failed.'));
  });
});
