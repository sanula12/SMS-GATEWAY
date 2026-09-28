import {
  Injectable, Inject, BadRequestException,
  ForbiddenException, Logger, NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { eq, desc, and, sql, or, like, count } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import { DRIZZLE } from '../../database/drizzle.module';
import { messages, accounts, campaigns, contacts, scheduledJobs } from '../../database/schema';
import { SmsProviderFactory } from './providers/sms-provider.factory';
import { SendSmsDto, SendBulkSmsDto } from './dto';
import { SMS_QUEUE } from '../scheduler/scheduler.processor';
import { normalizePhoneNumber } from '../../common/utils/phone.util';
import { resolveSenderId } from '../../common/utils/sender-id.util';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  constructor(
    @Inject(DRIZZLE) private db: any,
    private providerFactory: SmsProviderFactory,
    @InjectQueue(SMS_QUEUE) private smsQueue: Queue,
    private webhooksService: WebhooksService,
  ) {}


  // ── Validate and normalise phone number ───────────────────────────────────
  private normalizePhone(phone: string): string {
    const normalized = normalizePhoneNumber(phone);
    if (!normalized) {
      throw new BadRequestException(`Invalid phone number: ${phone}`);
    }
    return normalized;
  }

  private async deductCredits(accountId: string, amount: number): Promise<void> {
    const [result] = await this.db
      .update(accounts)
      .set({ creditBalance: sql`${accounts.creditBalance} - ${amount}` })
      .where(and(eq(accounts.id, accountId), sql`${accounts.creditBalance} >= ${amount}`));

    if (result.affectedRows === 0) {
      throw new ForbiddenException('Insufficient credit balance or account not found');
    }
  }

  // ── Calculate credit cost (1 credit per SMS segment) ─────────────────────
  private calculateCost(body: string): number {
    const segmentSize = 160;
    const segments = Math.ceil(body.length / segmentSize);
    return segments * 1;
  }

  // ── Send single SMS ───────────────────────────────────────────────────────
  async sendSingle(dto: SendSmsDto, accountId: string) {
    const to = this.normalizePhone(dto.to);
    const finalSenderId = await resolveSenderId(this.db, accountId, dto.from);
    const cost = this.calculateCost(dto.body);

    await this.deductCredits(accountId, cost);

    const messageId = uuidv4();
    const provider = this.providerFactory.getProvider(dto.provider);

    // Create message record
    await this.db.insert(messages).values({
      id: messageId,
      accountId,
      to,
      from: finalSenderId,
      body: dto.body,
      status: 'queued',
      provider: provider.name,
      segmentCount: Math.ceil(dto.body.length / 160),
      creditCost: cost.toFixed(4),
      scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
    });

    // Send immediately if not scheduled
    if (!dto.scheduledAt) {
      const result = await provider.send({ to, from: finalSenderId, body: dto.body });

      await this.db
        .update(messages)
        .set({
          status: result.success ? 'sent' : 'failed',
          providerMessageId: result.providerMessageId,
          providerResponse: result.providerResponse,
          sentAt: result.success ? new Date() : undefined,
        })
        .where(eq(messages.id, messageId));

      if (!result.success) {
        // Refund credits on failure
        await this.db
          .update(accounts)
          .set({ creditBalance: sql`${accounts.creditBalance} + ${cost}` })
          .where(eq(accounts.id, accountId));
      }

      this.webhooksService.fireOutboundWebhook(accountId, {
        event: result.success ? 'dlr.sent' : 'dlr.failed',
        messageId: messageId,
        to: to,
        status: result.success ? 'sent' : 'failed',
        timestamp: new Date().toISOString(),
      }).catch(e => this.logger.error('Webhook error', e));
      
      return {
        messageId,
        status: result.success ? 'sent' : 'failed',
        provider: provider.name,
        error: result.error,
      };
    }

    // Enqueue a delayed BullMQ job for future delivery
    const sendAt = new Date(dto.scheduledAt);
    const delay = sendAt.getTime() - Date.now();

    if (delay <= 0) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    const job = await this.smsQueue.add(
      'send-sms',
      { messageId, to, from: finalSenderId, body: dto.body, provider: provider.name, accountId },
      { delay, attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    // Track the scheduled job for cancellation support
    await this.db.insert(scheduledJobs).values({
      id: uuidv4(),
      accountId,
      messageId,
      bullJobId: String(job.id),
      queueName: SMS_QUEUE,
      scheduledAt: sendAt,
      status: 'waiting',
    });

    await this.db
      .update(messages)
      .set({ bullJobId: String(job.id) })
      .where(eq(messages.id, messageId));

    this.logger.log(`Scheduled single SMS ${messageId} via sms/send for ${sendAt.toISOString()} (delay: ${delay}ms)`);

    return { messageId, status: 'scheduled', scheduledAt: dto.scheduledAt };
  }


  // ── Send bulk SMS ─────────────────────────────────────────────────────────
  async sendBulk(dto: SendBulkSmsDto, accountId: string) {
    const finalSenderId = await resolveSenderId(this.db, accountId, dto.from);

    let targets: { to: string; firstName?: string; lastName?: string; email?: string; custom1?: string; custom2?: string }[] = [];

    if (dto.groupId) {
      const groupContacts = await this.db
        .select()
        .from(contacts)
        .where(and(eq(contacts.groupId, dto.groupId), eq(contacts.accountId, accountId)));

      if (groupContacts.length === 0) throw new BadRequestException('Contact group is empty or not found');

      targets = groupContacts.map(c => ({
        to: this.normalizePhone(c.phone),
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        custom1: c.custom1,
        custom2: c.custom2,
      }));
    } else if (dto.to && dto.to.length > 0) {
      targets = dto.to.map(n => ({ to: this.normalizePhone(n) }));
    } else {
      throw new BadRequestException('Either "to" array or "groupId" must be provided');
    }

    // Process merge fields & dynamic costing
    let totalCost = 0;
    const personalizedMessages = targets.map(target => {
      let body = dto.body;
      if (body.includes('{FIRSTNAME}')) body = body.replace(/{FIRSTNAME}/g, target.firstName || '');
      if (body.includes('{LASTNAME}')) body = body.replace(/{LASTNAME}/g, target.lastName || '');
      if (body.includes('{EMAIL}')) body = body.replace(/{EMAIL}/g, target.email || '');
      if (body.includes('{CUSTOM1}')) body = body.replace(/{CUSTOM1}/g, target.custom1 || '');
      if (body.includes('{CUSTOM2}')) body = body.replace(/{CUSTOM2}/g, target.custom2 || '');

      const cost = this.calculateCost(body);
      totalCost += cost;
      return { ...target, body, cost };
    });

    await this.deductCredits(accountId, totalCost);

    // Create campaign record
    const campaignId = uuidv4();
    await this.db.insert(campaigns).values({
      id: campaignId,
      accountId,
      name: dto.campaignName ?? `Bulk SMS ${new Date().toISOString()}`,
      message: dto.body,
      senderId: finalSenderId,
      status: 'processing',
      type: dto.groupId ? 'excel_import' : 'instant',
      totalCount: targets.length,
    });

    const provider = this.providerFactory.getProvider(dto.provider);
    let sentCount = 0;
    let failedCount = 0;

    // ── Scheduled Bulk: enqueue a delayed BullMQ job per recipient ────────────
    if (dto.scheduledAt) {
      const sendAt = new Date(dto.scheduledAt);
      const delay = sendAt.getTime() - Date.now();

      if (delay <= 0) {
        throw new BadRequestException('Scheduled time must be in the future');
      }

      await Promise.all(personalizedMessages.map(async (msg) => {
        const messageId = uuidv4();

        await this.db.insert(messages).values({
          id: messageId,
          accountId,
          campaignId,
          to: msg.to,
          from: finalSenderId,
          body: msg.body,
          status: 'queued',
          provider: provider.name,
          segmentCount: Math.ceil(msg.body.length / 160),
          creditCost: msg.cost.toFixed(4),
          scheduledAt: sendAt,
        });

        const job = await this.smsQueue.add(
          'send-sms',
          { messageId, to: msg.to, from: finalSenderId, body: msg.body, provider: provider.name, accountId, campaignId },
          { delay, attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
        );

        await this.db.insert(scheduledJobs).values({
          id: uuidv4(),
          accountId,
          messageId,
          bullJobId: String(job.id),
          queueName: SMS_QUEUE,
          scheduledAt: sendAt,
          status: 'waiting',
        });

        await this.db
          .update(messages)
          .set({ bullJobId: String(job.id) })
          .where(eq(messages.id, messageId));
      }));

      await this.db
        .update(campaigns)
        .set({ status: 'scheduled' })
        .where(eq(campaigns.id, campaignId));

      this.logger.log(`Scheduled bulk campaign ${campaignId} for ${sendAt.toISOString()} — ${personalizedMessages.length} jobs queued`);
      return { campaignId, totalCount: targets.length, sentCount: 0, failedCount: 0, status: 'scheduled', scheduledAt: dto.scheduledAt };
    }

    // ── Immediate Send: batches of 50 ─────────────────────────────────────────
    const batchSize = 50;
    for (let i = 0; i < personalizedMessages.length; i += batchSize) {
      const batch = personalizedMessages.slice(i, i + batchSize);

      if (provider.sendBatch) {
        // Use native bulk provider method
        const payloads = batch.map(msg => ({ to: msg.to, from: finalSenderId, body: msg.body }));
        const results = await provider.sendBatch(payloads);

        await Promise.all(batch.map(async (msg, index) => {
          const messageId = uuidv4();
          const result = results[index];

          await this.db.insert(messages).values({
            id: messageId,
            accountId,
            campaignId,
            to: msg.to,
            from: finalSenderId,
            body: msg.body,
            status: result.success ? 'sent' : 'failed',
            provider: provider.name,
            providerMessageId: result.providerMessageId,
            providerResponse: result.providerResponse,
            segmentCount: Math.ceil(msg.body.length / 160),
            creditCost: msg.cost.toFixed(4),
            sentAt: result.success ? new Date() : undefined,
          });

          if (result.success) {
            sentCount++;
          } else {
            failedCount++;
            await this.db
              .update(accounts)
              .set({ creditBalance: sql`${accounts.creditBalance} + ${msg.cost}` })
              .where(eq(accounts.id, accountId));
          }
          
          this.webhooksService.fireOutboundWebhook(accountId, {
            event: result.success ? 'dlr.sent' : 'dlr.failed',
            messageId: messageId,
            to: msg.to,
            status: result.success ? 'sent' : 'failed',
            timestamp: new Date().toISOString(),
          }).catch(e => this.logger.error('Webhook error', e));
        }));

      } else {
        // Fallback to sequential Promise.all
        await Promise.all(batch.map(async (msg) => {
          const messageId = uuidv4();

          await this.db.insert(messages).values({
            id: messageId,
            accountId,
            campaignId,
            to: msg.to,
            from: finalSenderId,
            body: msg.body,
            status: 'queued',
            provider: provider.name,
            segmentCount: Math.ceil(msg.body.length / 160),
            creditCost: msg.cost.toFixed(4),
          });

          const result = await provider.send({ to: msg.to, from: finalSenderId, body: msg.body });

          await this.db
            .update(messages)
            .set({
              status: result.success ? 'sent' : 'failed',
              providerMessageId: result.providerMessageId,
              providerResponse: result.providerResponse,
              sentAt: result.success ? new Date() : undefined,
            })
            .where(eq(messages.id, messageId));

          if (result.success) {
            sentCount++;
          } else {
            failedCount++;
            await this.db
              .update(accounts)
              .set({ creditBalance: sql`${accounts.creditBalance} + ${msg.cost}` })
              .where(eq(accounts.id, accountId));
          }
        }));
      }
    }

    // Update campaign status
    await this.db
      .update(campaigns)
      .set({
        status: 'completed',
        sentCount,
        failedCount,
      })
      .where(eq(campaigns.id, campaignId));

    return { campaignId, totalCount: targets.length, sentCount, failedCount };
  }


  // ── Get message history ───────────────────────────────────────────────────
  
  async getMessageTrace(messageId: string, accountId: string, role: string) {
    let queryBuilder = this.db
      .select({
        id: messages.id,
        accountId: messages.accountId,
        campaignId: messages.campaignId,
        to: messages.to,
        from: messages.from,
        body: messages.body,
        status: messages.status,
        provider: messages.provider,
        providerMessageId: messages.providerMessageId,
        providerResponse: messages.providerResponse,
        segmentCount: messages.segmentCount,
        creditCost: messages.creditCost,
        scheduledAt: messages.scheduledAt,
        sentAt: messages.sentAt,
        deliveredAt: messages.deliveredAt,
        createdAt: messages.createdAt,
        accountName: accounts.name,
        accountEmail: accounts.email,
        accountParentId: accounts.parentId,
      })
      .from(messages)
      .leftJoin(accounts, eq(messages.accountId, accounts.id))
      .where(eq(messages.id, messageId));

    const result = await queryBuilder.limit(1);
    if (result.length === 0) throw new NotFoundException('Message not found');
    
    const msg = result[0];
    
    if (role === 'customer' && msg.accountId !== accountId) {
      throw new UnauthorizedException('Unauthorized');
    }
    
    if (role === 'reseller' && msg.accountId !== accountId && msg.accountParentId !== accountId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return msg;
  }


  async getMessages(accountId: string, callerRole: string, callerId: string, page: string = '1', limit: string = '25', status?: string, search?: string) {
    const targetId = callerRole === 'super_admin' ? accountId : callerId;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 25;
    const offset = (pageNum - 1) * limitNum;

    let condition: any = eq(messages.accountId, targetId);

    if (status) {
       condition = and(condition, eq(messages.status, status as any));
    }
    if (search) {
       const searchCond = or(
           like(messages.to, `%${search}%`),
           like(messages.body, `%${search}%`),
           sql`CAST(${messages.id} AS CHAR) LIKE ${'%' + search + '%'}`
       );
       condition = and(condition, searchCond);
    }

    const dataQuery = this.db
      .select()
      .from(messages)
      .where(condition)
      .orderBy(desc(messages.createdAt))
      .limit(limitNum)
      .offset(offset);

    const countQuery = this.db
      .select({ total: count() })
      .from(messages)
      .where(condition);
      
    const [countResult] = await countQuery;
    const data = await dataQuery;

    return {
        data,
        total: Number(countResult?.total || 0)
    };
  }

  async getGlobalLogs(resellerId?: string, page: string = '1', limit: string = '25', status?: string, search?: string) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 25;
    const offset = (pageNum - 1) * limitNum;

    let condition: any = undefined;

    if (resellerId) {
       condition = eq(accounts.parentId, resellerId);
    }
    if (status) {
       condition = condition ? and(condition, eq(messages.status, status as any)) : eq(messages.status, status as any);
    }
    if (search) {
       const searchCond = or(
           like(messages.to, `%${search}%`),
           like(accounts.name, `%${search}%`),
           sql`CAST(${messages.id} AS CHAR) LIKE ${'%' + search + '%'}`
       );
       condition = condition ? and(condition, searchCond) : searchCond;
    }

    const dataQuery = this.db
      .select({
        id: messages.id,
        accountId: messages.accountId,
        accountName: accounts.name,
        campaignId: messages.campaignId,
        to: messages.to,
        from: messages.from,
        body: messages.body,
        status: messages.status,
        provider: messages.provider,
        providerMessageId: messages.providerMessageId,
        providerResponse: messages.providerResponse,
        segmentCount: messages.segmentCount,
        creditCost: messages.creditCost,
        createdAt: messages.createdAt,
        sentAt: messages.sentAt,
      })
      .from(messages)
      .leftJoin(accounts, eq(messages.accountId, accounts.id));

    if (condition) {
       dataQuery.where(condition);
    }

    const data = await dataQuery.orderBy(desc(messages.createdAt)).limit(limitNum).offset(offset);

    const countQuery = this.db
      .select({ total: count() })
      .from(messages)
      .leftJoin(accounts, eq(messages.accountId, accounts.id));
      
    if (condition) {
       countQuery.where(condition);
    }
    const [countResult] = await countQuery;

    return {
        data,
        total: Number(countResult?.total || 0)
    };
  }

  // ── Helper: get current balance ───────────────────────────────────────────
  private async getBalance(accountId: string): Promise<number> {
    const result = await this.db
      .select({ creditBalance: accounts.creditBalance })
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);
    return parseFloat(result[0]?.creditBalance ?? '0');
  }

  // ── Process Delivery Reports (Webhooks) ───────────────────────────────────
  async processDeliveryReport(providerMessageId: string, toPhone: string, status: 'delivered' | 'failed' | 'rejected') {
    const matchingMessages = await this.db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.providerMessageId, providerMessageId),
          sql`${messages.to} LIKE ${'%' + toPhone}`
        )
      )
      .limit(1);

    if (matchingMessages.length === 0) return;

    const msg = matchingMessages[0];

    if (msg.status === 'delivered' || msg.status === 'failed' || msg.status === 'rejected') {
      return;
    }

    await this.db
      .update(messages)
      .set({
        status,
        deliveredAt: status === 'delivered' ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(messages.id, msg.id));

    if (status === 'failed' || status === 'rejected') {
      const cost = parseFloat(msg.creditCost ?? '0');
      if (cost > 0) {
        await this.db
          .update(accounts)
          .set({ creditBalance: sql`${accounts.creditBalance} + ${cost}` })
          .where(eq(accounts.id, msg.accountId));
      }
    }
  }

  // ── Get available providers ─────────────────────────────────────────────────
  getProviders() {
    return this.providerFactory.getAvailableProviders();
  }
  async checkProviderHealth() {
    try {
      const resp = await fetch('https://bsms.hutch.lk', { method: 'HEAD', headers: { 'User-Agent': 'SMS-Gateway' } });
      return { status: (resp.ok || resp.status < 500) ? 'online' : 'offline' };
    } catch (e) {
      return { status: 'offline' };
    }
  }
}
