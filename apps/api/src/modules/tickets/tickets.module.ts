import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { DrizzleModule } from '../../database/drizzle.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [DrizzleModule, NotificationsModule],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}
