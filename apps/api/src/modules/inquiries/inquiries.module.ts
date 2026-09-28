import { Module } from '@nestjs/common';
import { InquiriesController } from './inquiries.controller';
import { InquiriesService } from './inquiries.service';
import { DrizzleModule } from '../../database/drizzle.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DrizzleModule, NotificationsModule],
  controllers: [InquiriesController],
  providers: [InquiriesService],
})
export class InquiriesModule {}
