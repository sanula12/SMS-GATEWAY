import {
  Injectable, Inject, NotFoundException, Logger,
} from '@nestjs/common';
import { eq, and, desc, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'node:crypto';
import { DRIZZLE } from '../../database/drizzle.module';
import { webhookEndpoints, messages, campaigns, accounts } from '../../database/schema';
import { CreateWebhookDto, DlrCallbackDto } from './dto';

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(@Inject(DRIZZLE) private readonly db: any) {}

  // ── Get all webhooks ──────────────────────────────────────────────────────
  async findAll(accountId: string) {
    return this.db
      .select()
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.accountId, accountId))
      .orderBy(desc(webhookEndpoints.createdAt));
  }

  // ── Create webhook ────────────────────────────────────────────────────────
  async create(dto: CreateWebhookDto, accountId: string) {
    const id = uuidv4();

    await this.db.insert(webhookEndpoints).values({
      id,
      accountId,
      url: dto.url,
      events: dto.events ?? ['dlr.delivered', 'dlr.failed', 'dlr.sent'],
      secret: dto.secret ?? crypto.randomBytes(16).toString('hex'),
      isActive: true,
    });

    const result = await this.db
      .select()
      .from(webhookEndpoints)
      .where(eq(webhookEndpoints.id, id))
      .limit(1);

    return result[0];
  }

  // ── Delete webhook ────────────────────────────────────────────────────────
  async remove(id: string, accountId: string) {
    const result = await this.db
      .select()
      .from(webhookEndpoints)
      .where(and(eq(webhookEndpoints.id, id), eq(webhookEndpoints.accountId, accountId)))
      .limit(1);

    if (result.length === 0) throw new NotFoundException('Webhook not found');

    await this.db
      .delete(webhookEndpoints)
      .where(eq(webhookEndpoints.id, id));

    return { message: 'Webhook deleted successfully' };
  }

  // ── Handle inbound DLR from SMS provider ─────────────────────────────────
  async handleDlr(dto: DlrCallbackDto) {
    this.logger.log(`DLR received: messageId=${dto.messageId} status=${dto.status}`);

    // Map provider status to our status
    const statusMap: Record<string, string> = {
      'DELIVERED': 'delivered',
      'FAILED': 'failed',
      'SENT': 'sent',
      'REJECTED': 'rejected',
      'delivered': 'delivered',
      'failed': 'failed',
      'sent': 'sent',
    };

    const mappedStatus = statusMap[dto.status] ?? 'failed';

    // Find message by provider message ID and optionally by phone number for bulk batches
    let queryBuilder = this.db.select().from(messages).where(eq(messages.providerMessageId, dto.providerMessageId ?? dto.messageId));
    if (dto.toPhone) {
       // Match trailing numbers since Hutch might send '947' while DB has '+947'
       queryBuilder = queryBuilder.where(and(
         eq(messages.providerMessageId, dto.providerMessageId ?? dto.messageId),
         sql`${messages.to} LIKE ${'%' + dto.toPhone}`
       ));
    }
    
    const messageResult = await queryBuilder.limit(1);

    if (messageResult.length === 0) {
      this.logger.warn(`DLR received for unknown message: ${dto.messageId} to ${dto.toPhone}`);
      return { received: true };
    }

    const message = messageResult[0];

    // If it transitions to failed/rejected, refund the user
    if ((mappedStatus === 'failed' || mappedStatus === 'rejected') && message.status !== 'failed' && message.status !== 'rejected') {
      await this.db
        .update(accounts)
        .set({ creditBalance: sql`${accounts.creditBalance} + ${message.creditCost}` })
        .where(eq(accounts.id, message.accountId));
    }

    // Update message status
    await this.db
      .update(messages)
      .set({
        status: mappedStatus,
        deliveredAt: mappedStatus === 'delivered' ? new Date() : undefined,
        updatedAt: new Date(),
      })
      .where(eq(messages.id, message.id));

    // Update campaign delivered/failed counts if applicable
    if (message.campaignId && (mappedStatus === 'delivered' || mappedStatus === 'failed' || mappedStatus === 'rejected')) {
      const campaign = await this.db
        .select()
        .from(campaigns)
        .where(eq(campaigns.id, message.campaignId))
        .limit(1);

      if (campaign.length > 0) {
        const updateData: any = {};
        if (mappedStatus === 'delivered') {
          updateData.deliveredCount = (campaign[0].deliveredCount ?? 0) + 1;
        } else {
          updateData.failedCount = (campaign[0].failedCount ?? 0) + 1;
        }

        await this.db
          .update(campaigns)
          .set(updateData)
          .where(eq(campaigns.id, message.campaignId));
      }
    }

    // Fire outbound webhook to customer's registered URL
    await this.fireOutboundWebhook(message.accountId, {
      event: `dlr.${mappedStatus}`,
      messageId: message.id,
      to: message.to,
      status: mappedStatus,
      timestamp: new Date().toISOString(),
    });

    return { received: true };
  }

  async handleHutchDlr(query:any){

    this.logger.log(`Provider DLR received: ${JSON.stringify(query)}`);

    const typeMap: Record<string, string> = {
      '1': 'DELIVERED',
      '2': 'FAILED',
      '3': 'REJECTED',
    }

    const mappedStatus = typeMap[String(query.type)] ?? 'FAILED';

    return this.handleDlr({
      messageId: 'hutch-webhook',
      providerMessageId: query.server_ref,
      status: mappedStatus,
      toPhone: query.number,
    });

  }



  
  public async fireOutboundWebhook(accountId: string, payload: any) {
    const endpoints = await this.db
      .select()
      .from(webhookEndpoints)
      .where(
        and(
          eq(webhookEndpoints.accountId, accountId),
          eq(webhookEndpoints.isActive, true),
        )
      );

    for (const endpoint of endpoints) {
      const events = endpoint.events as string[];
      if (!events.includes(payload.event)) continue;

      try {
        const body = JSON.stringify(payload);
        const signature = crypto
          .createHmac('sha256', endpoint.secret ?? '')
          .update(body)
          .digest('hex');

        await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SMSGate-Signature': `sha256=${signature}`,
            'X-SMSGate-Event': payload.event,
          },
          body,
        });

        this.logger.log(`Webhook fired to ${endpoint.url} for event ${payload.event}`);
      } catch (error: any) {
        this.logger.error(`Webhook delivery failed to ${endpoint.url}: ${error.message}`);
      }
    }
  }
}