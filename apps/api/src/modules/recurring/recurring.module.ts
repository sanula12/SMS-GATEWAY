import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { RecurringController } from './recurring.controller';
import { RecurringService } from './recurring.service';
import { SMS_QUEUE } from '../scheduler/scheduler.processor';

@Module({
  imports: [
    BullModule.registerQueue({
      name: SMS_QUEUE,
    }),
  ],
  controllers: [RecurringController],
  providers: [RecurringService],
})
export class RecurringModule {}
