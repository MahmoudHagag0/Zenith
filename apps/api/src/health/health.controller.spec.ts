import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { PrismaService } from '../database/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: { $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]) },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  it('returns ok status with a timestamp', async () => {
    const result = await controller.check();
    expect(result.status).toBe('ok');
    expect(typeof result.timestamp).toBe('string');
  });
});
