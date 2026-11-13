import { Test, TestingModule } from '@nestjs/testing';
import {
  HealthCheckResult,
  HealthCheckService,
  HealthIndicatorFunction,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '@/prisma/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  const healthResult: HealthCheckResult = {
    status: 'ok',
    info: {},
    error: {},
    details: {},
  };
  const healthCheckService = {
    check: jest.fn().mockResolvedValue(healthResult),
  };
  const databaseHealthIndicator = {
    pingCheck: jest.fn(),
  };
  const prismaService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: healthCheckService,
        },
        {
          provide: PrismaHealthIndicator,
          useValue: databaseHealthIndicator,
        },
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    jest.clearAllMocks();
  });

  it('reports liveness without checking external dependencies', async () => {
    await expect(controller.live()).resolves.toEqual(healthResult);

    expect(healthCheckService.check).toHaveBeenCalledWith([]);
    expect(databaseHealthIndicator.pingCheck).not.toHaveBeenCalled();
  });

  it('checks Prisma for readiness', async () => {
    healthCheckService.check.mockImplementationOnce(
      async (checks: HealthIndicatorFunction[]) => {
        await Promise.all(checks.map((check) => Promise.resolve(check())));
        return healthResult;
      },
    );
    databaseHealthIndicator.pingCheck.mockResolvedValueOnce({
      database: { status: 'up' },
    });

    await expect(controller.ready()).resolves.toEqual(healthResult);

    expect(databaseHealthIndicator.pingCheck).toHaveBeenCalledWith(
      'database',
      prismaService,
      { timeout: 1_000 },
    );
  });
});
