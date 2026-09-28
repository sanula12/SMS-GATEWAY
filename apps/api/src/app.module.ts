import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { DrizzleModule } from './database/drizzle.module';
import { AuthModule } from './modules/auth/auth.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { SmsModule } from './modules/sms/sms.module';
import { ContactsModule } from './modules/contacts/contacts.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { ApiKeysModule } from './modules/api-keys/api-keys.module';
import { SenderIdsModule } from './modules/sender-ids/sender-ids.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { StatsModule } from './modules/stats/stats.module';
import { PackagesModule } from './modules/packages/packages.module';
import { WhitelabelModule } from './modules/whitelabel/whitelabel.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { EmailModule } from './modules/email/email.module';
import { StorageModule } from './modules/storage/storage.module';
import { SettingsModule } from './modules/settings/settings.module';
import { RecurringModule } from './modules/recurring/recurring.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { InquiriesModule } from './modules/inquiries/inquiries.module';
import configuration from './config/configuration';

import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{
          ttl: 60000,
          limit: 100,
        }],
        storage: new ThrottlerStorageRedisService(
          config.get<string>('redis.password')
            ? `redis://:${config.get<string>('redis.password')}@${config.get<string>('redis.host', 'localhost')}:${config.get<number>('redis.port', 6379)}`
            : `redis://${config.get<string>('redis.host', 'localhost')}:${config.get<number>('redis.port', 6379)}`
        ),
      }),
    }),
    DrizzleModule,
    AuthModule,
    AccountsModule,
    SmsModule,
    ContactsModule,
    SchedulerModule,
    CampaignsModule,
    ApiKeysModule,
    SenderIdsModule,
    WebhooksModule,
    StatsModule,
    PackagesModule,
    WhitelabelModule,
    NotificationsModule,
    EmailModule,
    StorageModule,
    SettingsModule,
    RecurringModule,
    TicketsModule,
    InquiriesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}