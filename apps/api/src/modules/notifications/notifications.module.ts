import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { DrizzleModule } from '../../database/drizzle.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [DrizzleModule, SmsModule],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
