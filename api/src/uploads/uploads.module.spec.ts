import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';

jest.mock('../prisma/prisma.service', () => ({
  PrismaService: class PrismaService {},
}));
jest.mock('../users/users.service', () => ({
  UsersService: class UsersService {},
}));
jest.mock('../mails/mails.service', () => ({
  MailsService: class MailsService {},
}));

import { AccessTokenVerifier } from '../auth/access-token-verifier';
import { RestAccessTokenGuard } from '../auth/rest-access-token.guard';
import { UsersService } from '../users/users.service';
import { UploadsController } from './uploads.controller';
import { UploadsModule } from './uploads.module';
import { UPLOADS_STORAGE } from './uploads.storage';

describe('UploadsModule assembly', () => {
  it('resolves the REST guard and its shared access-token verifier', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        JwtModule.register({ global: true, secret: 'test-secret' }),
        UploadsModule,
      ],
    })
      .overrideProvider(UsersService)
      .useValue({ findUserByActiveSession: jest.fn() })
      .overrideProvider(UPLOADS_STORAGE)
      .useValue({ put: jest.fn() })
      .compile();

    expect(moduleRef.get(UploadsController)).toBeInstanceOf(UploadsController);
    expect(moduleRef.get(RestAccessTokenGuard)).toBeInstanceOf(
      RestAccessTokenGuard,
    );
    expect(moduleRef.get(AccessTokenVerifier)).toBeInstanceOf(
      AccessTokenVerifier,
    );

    await moduleRef.close();
  });
});
