import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { SmsController } from './sms.controller';
import { SmsWebhookController } from './sms-webhook.controller';
import { SmsService } from './sms.service';
import { SmsProviderFactory } from './providers/sms-provider.factory';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { SMS_QUEUE } from '../scheduler/scheduler.processor';

@Module({
  imports: [
    ApiKeysModule,
    WebhooksModule,
    BullModule.registerQueue({ name: SMS_QUEUE }),
  ],
  controllers: [SmsController, SmsWebhookController],
  providers: [SmsService, SmsProviderFactory],
  exports: [SmsService, SmsProviderFactory],
})
export class SmsModule {}