import { BadRequestException } from '@nestjs/common';
import type { Express } from 'express';

jest.mock('../auth/rest-access-token.guard', () => ({
  RestAccessTokenGuard: class {},
}));

import { UploadsController } from './uploads.controller';
import { UploadsService } from './uploads.service';

describe('UploadsController', () => {
  it('returns HTTP 400 when the multipart file field is missing', () => {
    const controller = new UploadsController({} as UploadsService);
    expect(() => controller.uploadFile()).toThrow(BadRequestException);
  });

  it('delegates validated multipart input to the upload service', async () => {
    const file = { originalname: 'meal.png' } as Express.Multer.File;
    const upload = jest.fn().mockResolvedValue({
      key: 'uploads/id.png',
      url: 'https://assets.example.com/uploads/id.png',
    });
    const controller = new UploadsController({
      upload,
    } as unknown as UploadsService);
    await expect(controller.uploadFile(file)).resolves.toMatchObject({
      key: 'uploads/id.png',
    });
    expect(upload).toHaveBeenCalledWith(file);
  });
});
