import { Test, TestingModule } from '@nestjs/testing';
import { WhitelabelController } from './whitelabel.controller';

describe('WhitelabelController', () => {
  let controller: WhitelabelController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhitelabelController],
    }).compile();

    controller = module.get<WhitelabelController>(WhitelabelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
