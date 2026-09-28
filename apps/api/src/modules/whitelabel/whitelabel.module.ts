import { Module } from '@nestjs/common';
import { WhitelabelController } from './whitelabel.controller';
import { WhitelabelService } from './whitelabel.service';
import { DrizzleModule } from '../../database/drizzle.module';

@Module({
  imports: [DrizzleModule],
  controllers: [WhitelabelController],
  providers: [WhitelabelService],
  exports: [WhitelabelService],
})
export class WhitelabelModule {}
