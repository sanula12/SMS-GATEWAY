import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject } from '@nestjs/common';
import { Job } from 'bullmq';
import { eq, sql } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.module';
import { messages, campaigns, accounts } from '../../database/schema';
import { SmsProviderFactory } from '../sms/providers/sms-provider.factory';

export const SMS_QUEUE = 'sms-queue';

@Processor(SMS_QUEUE)
export class SchedulerProcessor extends WorkerHost {
  private readonly logger = new Logger(SchedulerProcessor.name);

  constructor(
    @Inject(DRIZZLE) private db: any,
    private providerFactory: SmsProviderFactory,
  ) {
    super();
  }

  private async updateCampaignStats(campaignId: string) {
    try {
      const stats = await this.db
        .select({
          status: messages.status,
          count: sql<number>`count(*)`,
        })
        .from(messages)
        .where(eq(messages.campaignId, campaignId))
        .groupBy(messages.status);

      let sent = 0, failed = 0, delivered = 0;
      stats.forEach((row: any) => {
        const c = Number(row.count);
        if (row.status === 'sent') sent += c;
        if (row.status === 'failed' || row.status === 'rejected') failed += c;
        if (row.status === 'delivered') delivered += c;
      });

      const [campaign] = await this.db.select().from(campaigns).where(eq(campaigns.id, campaignId)).limit(1);
      if (!campaign) return;

      const isCompleted = (sent + failed + delivered) >= campaign.totalCount;

      await this.db.update(campaigns).set({
        sentCount: sent,
        failedCount: failed,
        status: isCompleted && campaign.status !== 'completed' ? 'completed' : campaign.status,
      }).where(eq(campaigns.id, campaignId));
    } catch (err: any) {
      this.logger.error(`Error updating campaign stats for ${campaignId}: ${err.message}`);
    }
  }

  async process(job: Job): Promise<void> {
    const { messageId, to, from, body, provider, accountId, campaignId } = job.data;

    this.logger.log(`Processing SMS job ${job.id} -> ${to}`);

    try {
      const smsProvider = this.providerFactory.getProvider(provider);
      const result = await smsProvider.send({ to, from, body });

      await this.db
        .update(messages)
        .set({
          status: result.success ? 'sent' : 'failed',
          providerMessageId: result.providerMessageId,
          providerResponse: result.providerResponse,
          sentAt: result.success ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(messages.id, messageId));

      if (campaignId) await this.updateCampaignStats(campaignId);

      if (result.success) {
        this.logger.log(`SMS job ${job.id} sent successfully`);
      } else {
        this.logger.error(`SMS job ${job.id} failed: ${result.error}`);
        throw new Error(result.error);
      }
    } catch (error: any) {
      this.logger.error(`SMS job ${job.id} error: ${error.message}`);
      
      const isFinalAttempt = job.attemptsMade >= (job.opts.attempts || 1) - 1;

      await this.db
        .update(messages)
        .set({ status: 'failed', updatedAt: new Date() })
        .where(eq(messages.id, messageId));

      if (campaignId) await this.updateCampaignStats(campaignId);
      
      if (isFinalAttempt) {
        const msgResult = await this.db.select({ creditCost: messages.creditCost }).from(messages).where(eq(messages.id, messageId)).limit(1);
        if (msgResult.length > 0 && msgResult[0].creditCost) {
          await this.db.update(accounts)
            .set({ creditBalance: sql`${accounts.creditBalance} + ${msgResult[0].creditCost}` })
            .where(eq(accounts.id, accountId));
          this.logger.log(`Refunded ${msgResult[0].creditCost} credits for failed SMS job ${job.id}`);
        }
      }

      throw error;
    }
  }
}