import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '@/prisma/prisma.service';

describe('Application health (e2e)', () => {
  let app: INestApplication<App>;
  const prismaService = {
    $runCommandRaw: jest
      .fn()
      .mockRejectedValue(new Error('Use the mongodb provider')),
    $queryRawUnsafe: jest.fn().mockResolvedValue([{ result: 1 }]),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('reports process liveness without querying PostgreSQL', async () => {
    await request(app.getHttpServer())
      .get('/health/live')
      .expect(200)
      .expect(({ body }) => {
        const responseBody: unknown = body;

        expect(responseBody).toMatchObject({ status: 'ok' });
      });

    expect(prismaService.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it('reports readiness when PostgreSQL responds', async () => {
    await request(app.getHttpServer())
      .get('/health/ready')
      .expect(200)
      .expect(({ body }) => {
        const responseBody: unknown = body;

        expect(responseBody).toMatchObject({
          status: 'ok',
          info: { database: { status: 'up' } },
        });
      });

    expect(prismaService.$queryRawUnsafe).toHaveBeenCalledWith('SELECT 1');
  });

  it('reports an unavailable PostgreSQL dependency', async () => {
    prismaService.$queryRawUnsafe.mockRejectedValueOnce(
      new Error('Database unavailable'),
    );

    await request(app.getHttpServer())
      .get('/health/ready')
      .expect(503)
      .expect(({ body }) => {
        const responseBody: unknown = body;

        expect(responseBody).toMatchObject({
          status: 'error',
          error: { database: { status: 'down' } },
        });
      });
  });

  it('exposes the minimal GraphQL status query', async () => {
    await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: 'query ApiStatus { apiStatus }',
      })
      .expect(200)
      .expect(({ body }) => {
        const responseBody: unknown = body;

        expect(responseBody).toEqual({ data: { apiStatus: 'ok' } });
      });
  });

  afterAll(async () => {
    await app?.close();
  });
});
