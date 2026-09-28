import {
  Injectable, Inject, NotFoundException,
  BadRequestException, Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { eq, and, desc, sql, isNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { DRIZZLE } from '../../database/drizzle.module';
import { campaigns, messages, contacts, accounts, scheduledJobs, systemSettings } from '../../database/schema';
import { SMS_QUEUE } from '../scheduler/scheduler.processor';
import { CreateCampaignDto } from './dto';
import { normalizePhoneNumber } from '../../common/utils/phone.util';
import { resolveSenderId } from '../../common/utils/sender-id.util';

@Injectable()
export class CampaignsService {
  private readonly logger = new Logger(CampaignsService.name);

  constructor(
    @Inject(DRIZZLE) private db: any,
    @InjectQueue(SMS_QUEUE) private smsQueue: Queue,
  ) {}

  // ── Get all campaigns ─────────────────────────────────────────────────────
  async findAll(accountId: string) {
    return this.db
      .select({
        id: campaigns.id,
        accountId: campaigns.accountId,
        name: campaigns.name,
        message: campaigns.message,
        senderId: campaigns.senderId,
        status: campaigns.status,
        type: campaigns.type,
        scheduledAt: campaigns.scheduledAt,
        totalCount: campaigns.totalCount,
        // Calculate exact stats in real-time from the messages table
        sentCount: sql<number>`(SELECT COUNT(*) FROM ${messages} WHERE ${messages.campaignId} = ${campaigns.id} AND ${messages.status} = 'sent')`,
        deliveredCount: sql<number>`(SELECT COUNT(*) FROM ${messages} WHERE ${messages.campaignId} = ${campaigns.id} AND ${messages.status} = 'delivered')`,
        failedCount: sql<number>`(SELECT COUNT(*) FROM ${messages} WHERE ${messages.campaignId} = ${campaigns.id} AND (${messages.status} = 'failed' OR ${messages.status} = 'rejected'))`,
        createdAt: campaigns.createdAt,
        updatedAt: campaigns.updatedAt,
      })
      .from(campaigns)
      .where(eq(campaigns.accountId, accountId))
      .orderBy(desc(campaigns.createdAt));
  }

  // ── Get single campaign ───────────────────────────────────────────────────
  async findOne(id: string, accountId: string) {
    const result = await this.db
      .select()
      .from(campaigns)
      .where(and(eq(campaigns.id, id), eq(campaigns.accountId, accountId)))
      .limit(1);

    if (result.length === 0) throw new NotFoundException('Campaign not found');
    return result[0];
  }

  // ── Sync All Campaign Stats (Backfill) ────────────────────────────────────
  async syncAllStats() {
    const allCampaigns = await this.db.select().from(campaigns);
    let updated = 0;

    for (const campaign of allCampaigns) {
      const messageStats = await this.db
        .select()
        .from(messages)
        .where(eq(messages.campaignId, campaign.id));

      const sent = messageStats.filter((m: any) => m.status === 'sent').length;
      const delivered = messageStats.filter((m: any) => m.status === 'delivered').length;
      const failed = messageStats.filter((m: any) => m.status === 'failed' || m.status === 'rejected').length;
      
      const isCompleted = (sent + failed + delivered) >= campaign.totalCount;

      await this.db
        .update(campaigns)
        .set({
          sentCount: sent,
          deliveredCount: delivered,
          failedCount: failed,
          status: isCompleted && campaign.status !== 'completed' ? 'completed' : campaign.status,
        })
        .where(eq(campaigns.id, campaign.id));
      
      updated++;
    }

    return { success: true, updatedCampaigns: updated, message: 'All campaign stats synced successfully' };
  }

  // ── Get campaign messages ─────────────────────────────────────────────────
  async getCampaignMessages(id: string, accountId: string) {
    await this.findOne(id, accountId);

    return this.db
      .select()
      .from(messages)
      .where(eq(messages.campaignId, id))
      .orderBy(desc(messages.createdAt));
  }

  // ── Create and launch campaign ────────────────────────────────────────────
  async create(dto: CreateCampaignDto, accountId: string) {
    const finalSenderId = await resolveSenderId(this.db, accountId, dto.senderId);

    // Collect all recipient numbers
    let recipientNumbers: string[] = [];

    // Add direct recipients
    if (dto.recipients && dto.recipients.length > 0) {
      recipientNumbers.push(...dto.recipients);
    }

    // Add contacts from groups
    if (dto.groupIds && dto.groupIds.length > 0) {
      for (const groupId of dto.groupIds) {
        const groupContacts = await this.db
          .select({ phone: contacts.phone, firstName: contacts.firstName })
          .from(contacts)
          .where(
            and(
              eq(contacts.accountId, accountId),
              eq(contacts.groupId, groupId),
              eq(contacts.isOptedOut, false),
            )
          );
        recipientNumbers.push(...groupContacts.map((c: any) => c.phone));
      }
    }

    if (recipientNumbers.length === 0) {
      throw new BadRequestException('Campaign must have at least one recipient');
    }

    // Validate and normalize all numbers
    const validRecipients: string[] = [];
    const invalidNumbers: string[] = [];

    for (const number of recipientNumbers) {
      const normalized = normalizePhoneNumber(number);
      if (normalized) {
        validRecipients.push(normalized);
      } else {
        invalidNumbers.push(number);
      }
    }

    if (validRecipients.length === 0) {
      throw new BadRequestException('No valid phone numbers found');
    }

    // Deduplicate
    const uniqueRecipients = [...new Set(validRecipients)];

    // Check credits
    const creditCost = uniqueRecipients.length * Math.ceil(dto.message.length / 160);
    const accountResult = await this.db
      .select({ creditBalance: accounts.creditBalance })
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);

    const balance = parseFloat(accountResult[0]?.creditBalance ?? '0');
    if (balance < creditCost) {
      throw new BadRequestException(
        `Insufficient credits. Required: ${creditCost}, Available: ${balance}`
      );
    }

    // Deduct credits
    // await this.db
    //   .update(accounts)
    //   .set({ creditBalance: (balance - creditCost).toFixed(4) })
    //   .where(eq(accounts.id, accountId));

    const [updateResults] = await this.db
      .update(accounts)
      .set({ creditBalance: sql`${accounts.creditBalance} - ${creditCost}`})
      .where(and(eq(accounts.id, accountId),
    sql`${accounts.creditBalance} >= ${creditCost}`));

    if(updateResults.affectedRows === 0){
         throw new BadRequestException('Insufficient credits detected during deduction');
    }


    // Check moderation threshold
    const modSetting = await this.db
      .select()
      .from(systemSettings)
      .where(and(isNull(systemSettings.accountId), eq(systemSettings.key, 'campaign_moderation')))
      .limit(1);

    let requiresApproval = false;
    if (modSetting.length > 0 && modSetting[0].value?.enabled) {
      if (uniqueRecipients.length >= (modSetting[0].value.threshold || 100)) {
        requiresApproval = true;
      }
    }

    const campaignId = uuidv4();
    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    let initialStatus = dto.type === 'scheduled' ? 'scheduled' : 'processing';
    if (requiresApproval) {
      initialStatus = 'pending_approval';
    }

    // Create campaign record
    await this.db.insert(campaigns).values({
      id: campaignId,
      accountId,
      name: dto.name,
      message: dto.message,
      senderId: finalSenderId,
      status: initialStatus as any,
      type: dto.type,
      scheduledAt,
      totalCount: uniqueRecipients.length,
      sentCount: 0,
      failedCount: 0,
    });

    // Queue jobs for each recipient
    const now = new Date();
    let delay = 0;

    if (dto.type === 'scheduled' && scheduledAt) {
      if (scheduledAt <= now) {
        throw new BadRequestException('Scheduled time must be in the future');
      }
      delay = scheduledAt.getTime() - now.getTime();
    }

    if (!requiresApproval) {
      for (const to of uniqueRecipients) {
        const messageId = uuidv4();

        // Get contact name for merge tag if available
        const contactResult = await this.db
          .select({ firstName: contacts.firstName })
          .from(contacts)
          .where(and(eq(contacts.accountId, accountId), eq(contacts.phone, to)))
          .limit(1);

        const name = contactResult[0]?.firstName ?? '';
        const body = dto.message.replace(/\{name\}/gi, name);

        await this.db.insert(messages).values({
          id: messageId,
          accountId,
          campaignId,
          to,
          from: finalSenderId,
          body,
          status: 'queued',
          provider: dto.provider,
          segmentCount: Math.ceil(body.length / 160),
          creditCost: Math.ceil(body.length / 160).toFixed(4),
          scheduledAt: scheduledAt,
        });

        const job = await this.smsQueue.add(
          'send-sms',
          { messageId, to, from: finalSenderId, body, accountId, campaignId, provider: dto.provider },
          {
            delay,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
          },
        );

        await this.db
          .update(messages)
          .set({ bullJobId: String(job.id) })
          .where(eq(messages.id, messageId));

        if (dto.type === 'scheduled') {
          await this.db.insert(scheduledJobs).values({
            id: uuidv4(),
            accountId,
            messageId,
            campaignId,
            bullJobId: String(job.id),
            queueName: SMS_QUEUE,
            scheduledAt: scheduledAt as Date,
            status: 'waiting',
          });
        }
      }
    } else {
      // If requires approval, just save the message bodies to the messages table with status 'pending'
      // We will queue them when approved.
      for (const to of uniqueRecipients) {
        const messageId = uuidv4();

        const contactResult = await this.db
          .select({ firstName: contacts.firstName })
          .from(contacts)
          .where(and(eq(contacts.accountId, accountId), eq(contacts.phone, to)))
          .limit(1);

        const name = contactResult[0]?.firstName ?? '';
        const body = dto.message.replace(/\{name\}/gi, name);

        await this.db.insert(messages).values({
          id: messageId,
          accountId,
          campaignId,
          to,
          from: finalSenderId,
          body,
          status: 'pending',
          provider: dto.provider,
          segmentCount: Math.ceil(body.length / 160),
          creditCost: Math.ceil(body.length / 160).toFixed(4),
          scheduledAt: scheduledAt,
        });
      }
    }

    this.logger.log(
      `Campaign ${campaignId} created: ${uniqueRecipients.length} recipients, ` +
      `${invalidNumbers.length} invalid numbers skipped`
    );

    return {
      campaignId,
      name: dto.name,
      totalRecipients: uniqueRecipients.length,
      invalidNumbers,
      creditsCost: creditCost,
      status: initialStatus,
      scheduledAt,
    };
  }
  // ── Admin: Get Pending Campaigns ──────────────────────────────────────────
  async getPendingCampaigns() {
    return this.db
      .select({
        id: campaigns.id,
        accountId: campaigns.accountId,
        accountName: accounts.name,
        name: campaigns.name,
        message: campaigns.message,
        senderId: campaigns.senderId,
        status: campaigns.status,
        type: campaigns.type,
        scheduledAt: campaigns.scheduledAt,
        totalCount: campaigns.totalCount,
        createdAt: campaigns.createdAt,
      })
      .from(campaigns)
      .leftJoin(accounts, eq(campaigns.accountId, accounts.id))
      .where(eq(campaigns.status, 'pending_approval'))
      .orderBy(desc(campaigns.createdAt));
  }

  // ── Admin: Approve Campaign ───────────────────────────────────────────────
  async approveCampaign(id: string) {
    const campaignResult = await this.db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    if (campaignResult.length === 0) throw new NotFoundException('Campaign not found');
    
    const campaign = campaignResult[0];
    if (campaign.status !== 'pending_approval') {
      throw new BadRequestException('Campaign is not pending approval');
    }

    const campaignMessages = await this.db.select().from(messages).where(and(eq(messages.campaignId, id), eq(messages.status, 'pending')));
    
    const now = new Date();
    let delay = 0;
    if (campaign.type === 'scheduled' && campaign.scheduledAt) {
      delay = new Date(campaign.scheduledAt).getTime() - now.getTime();
      if (delay < 0) delay = 0;
    }

    for (const msg of campaignMessages) {
      const job = await this.smsQueue.add(
        'send-sms',
        { messageId: msg.id, to: msg.to, from: msg.from, body: msg.body, accountId: msg.accountId, campaignId: campaign.id, provider: msg.provider },
        { delay, attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      );

      await this.db.update(messages).set({ status: 'queued', bullJobId: String(job.id) }).where(eq(messages.id, msg.id));

      if (campaign.type === 'scheduled' && campaign.scheduledAt) {
        await this.db.insert(scheduledJobs).values({
          id: uuidv4(),
          accountId: msg.accountId,
          messageId: msg.id,
          campaignId: campaign.id,
          bullJobId: String(job.id),
          queueName: SMS_QUEUE,
          scheduledAt: campaign.scheduledAt,
          status: 'waiting',
        });
      }
    }

    const newStatus = campaign.type === 'scheduled' ? 'scheduled' : 'processing';
    await this.db.update(campaigns).set({ status: newStatus as any }).where(eq(campaigns.id, id));

    return { success: true, message: 'Campaign approved and queued', status: newStatus };
  }

  // ── Admin: Reject Campaign ────────────────────────────────────────────────
  async rejectCampaign(id: string) {
    const campaignResult = await this.db.select().from(campaigns).where(eq(campaigns.id, id)).limit(1);
    if (campaignResult.length === 0) throw new NotFoundException('Campaign not found');
    
    const campaign = campaignResult[0];
    if (campaign.status !== 'pending_approval') {
      throw new BadRequestException('Campaign is not pending approval');
    }

    // Refund credits
    const campaignMessages = await this.db.select().from(messages).where(eq(messages.campaignId, id));
    let refundAmount = 0;
    for (const msg of campaignMessages) {
      refundAmount += parseFloat(msg.creditCost ?? '0');
    }

    if (refundAmount > 0) {
      await this.db
        .update(accounts)
        .set({ creditBalance: sql`${accounts.creditBalance} + ${refundAmount}` })
        .where(eq(accounts.id, campaign.accountId));
    }

    await this.db.update(messages).set({ status: 'rejected' }).where(eq(messages.campaignId, id));
    await this.db.update(campaigns).set({ status: 'rejected' as any }).where(eq(campaigns.id, id));

    return { success: true, message: 'Campaign rejected and credits refunded', refundedCredits: refundAmount };
  }

  // ── Cancel a scheduled campaign ───────────────────────────────────────────
  async cancel(id: string, accountId: string) {
    const campaign = await this.findOne(id, accountId);

    if (!['scheduled', 'processing'].includes(campaign.status)) {
      throw new BadRequestException('Only scheduled or processing campaigns can be cancelled');
    }

    // Get all queued messages for this campaign
    const campaignMessages = await this.db
      .select()
      .from(messages)
      .where(and(eq(messages.campaignId, id), eq(messages.status, 'queued')));

    // Remove BullMQ jobs
    for (const message of campaignMessages) {
      if (message.bullJobId) {
        const job = await this.smsQueue.getJob(message.bullJobId);
        if (job) await job.remove();
      }
    }

    // Update message statuses
    await this.db
      .update(messages)
      .set({ status: 'failed' })
      .where(and(eq(messages.campaignId, id), eq(messages.status, 'queued')));

    // Update campaign status
    await this.db
      .update(campaigns)
      .set({ status: 'cancelled' })
      .where(eq(campaigns.id, id));

    // Refund credits for unsent messages
    const refundAmount = campaignMessages.length * (parseFloat(campaign.creditCost ?? '1'));
    if (refundAmount > 0) {
      await this.db
           .update(accounts)
        .set({ creditBalance: sql`${accounts.creditBalance} + ${refundAmount}` })
        .where(eq(accounts.id, accountId));
    }

    return { message: 'Campaign cancelled successfully' };
  }

  // ── Get campaign stats ────────────────────────────────────────────────────
  async getStats(id: string, accountId: string) {
    const campaign = await this.findOne(id, accountId);

    const messageStats = await this.db
      .select()
      .from(messages)
      .where(eq(messages.campaignId, id));

    const stats = {
      total: campaign.totalCount,
      sent: messageStats.filter((m: any) => m.status === 'sent').length,
      delivered: messageStats.filter((m: any) => m.status === 'delivered').length,
      failed: messageStats.filter((m: any) => m.status === 'failed' || m.status === 'rejected').length,
      queued: messageStats.filter((m: any) => m.status === 'queued').length,
      deliveryRate: 0,
    };

    stats.deliveryRate = stats.total > 0
      ? Math.round((stats.delivered / stats.total) * 100)
      : 0;

    return { campaign, stats };
  }
}
