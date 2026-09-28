import { Test, TestingModule } from '@nestjs/testing';
import { WhitelabelService } from './whitelabel.service';

describe('WhitelabelService', () => {
  let service: WhitelabelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WhitelabelService],
    }).compile();

    service = module.get<WhitelabelService>(WhitelabelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
