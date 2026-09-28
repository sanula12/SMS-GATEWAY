import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { SchedulerService } from './scheduler.service';
import { SchedulerProcessor, SMS_QUEUE } from './scheduler.processor';
import { SchedulerController } from './scheduler.controller';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host'),
          port: config.get<number>('redis.port'),
          password: config.get<string>('redis.password') || undefined,
        },
      }),
    }),
    BullModule.registerQueue({ name: SMS_QUEUE }),
    SmsModule,
  ],
  controllers: [SchedulerController],
  providers: [SchedulerService, SchedulerProcessor],
  exports: [SchedulerService],
})
export class SchedulerModule {}