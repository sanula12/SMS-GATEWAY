import { Module } from '@nestjs/common';
import { PackagesController } from './packages.controller';
import { PaymentWebhooksController } from './payment-webhooks.controller';
import { PackagesService } from './packages.service';
import { DrizzleModule } from '../../database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [PackagesController, PaymentWebhooksController],
  providers: [PackagesService],
  exports: [PackagesService],
})
export class PackagesModule {}
