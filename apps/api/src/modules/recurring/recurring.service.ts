import { Injectable, Logger, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { DRIZZLE } from '../../database/drizzle.module';
import { recurringCampaigns, contacts, messages, accounts } from '../../database/schema';
import { SMS_QUEUE } from '../scheduler/scheduler.processor';
import { CreateRecurringDto, UpdateRecurringDto } from './dto';
import { eq, and, sql, desc, like } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { normalizePhoneNumber } from '../../common/utils/phone.util';
import { resolveSenderId } from '../../common/utils/sender-id.util';

@Injectable()
export class RecurringService {
  private readonly logger = new Logger(RecurringService.name);

  constructor(
    @Inject(DRIZZLE) private db: any,
    @InjectQueue(SMS_QUEUE) private smsQueue: Queue,
  ) {}

  // 1. Import Excel & Create Campaign
  async createFromExcel(dto: CreateRecurringDto, fileBuffer: Buffer, accountId: string) {
    const finalSenderId = await resolveSenderId(this.db, accountId, dto.senderId);

    const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet) as any[];

    if (rows.length === 0) throw new BadRequestException('Excel file is empty');

    const firstRow = rows[0];
    if (!('phone' in firstRow) || !('event_date' in firstRow)) {
      throw new BadRequestException('Missing required columns: phone, event_date');
    }

    const groupId = uuidv4();
    const campaignId = uuidv4();

    await this.db.insert(recurringCampaigns).values({
      id: campaignId,
      accountId,
      name: dto.name,
      groupId,
      messageTemplate: dto.messageTemplate,
      senderId: finalSenderId,
      status: 'active',
      sendTime: dto.sendTime,
      frequency: dto.frequency || 'yearly',
    });

    let imported = 0;
    const contactsToInsert: any[] = [];

    for (const row of rows) {
      if (!row.phone) continue;
      const phone = normalizePhoneNumber(row.phone);
      if (!phone) continue;

      const name = row.name ? String(row.name).substring(0, 100) : null;
      
      let eventDate: string | null = null;
      if (row.event_date instanceof Date) {
        eventDate = row.event_date.toISOString().split('T')[0];
      } else if (typeof row.event_date === 'string') {
        eventDate = row.event_date.replace(/\//g, '-');
      } else if (typeof row.event_date === 'number') {
        const date = new Date(Math.round((row.event_date - 25569) * 864e5));
        eventDate = date.toISOString().split('T')[0];
      }

      if (!eventDate) continue;

      contactsToInsert.push({
        id: uuidv4(),
        accountId,
        groupId,
        phone,
        firstName: name,
        eventDate,
      });
      imported++;
    }

    const chunkSize = 1000;
    for (let i = 0; i < contactsToInsert.length; i += chunkSize) {
      const chunk = contactsToInsert.slice(i, i + chunkSize);
      await this.db.insert(contacts).values(chunk);
    }

    return { campaignId, imported };
  }

  // 2. Get all campaigns
  async findAll(accountId: string) {
    return this.db.select()
      .from(recurringCampaigns)
      .where(eq(recurringCampaigns.accountId, accountId))
      .orderBy(desc(recurringCampaigns.createdAt));
  }

  // 3. Update
  async update(id: string, dto: UpdateRecurringDto, accountId: string) {
    await this.db.update(recurringCampaigns)
      .set({ ...dto })
      .where(and(eq(recurringCampaigns.id, id), eq(recurringCampaigns.accountId, accountId)));
    return { success: true };
  }

  // 4. Delete
  async remove(id: string, accountId: string) {
    const campaign = await this.db.select().from(recurringCampaigns).where(and(eq(recurringCampaigns.id, id), eq(recurringCampaigns.accountId, accountId))).limit(1);
    if (campaign.length === 0) throw new NotFoundException('Campaign not found');

    await this.db.delete(contacts).where(eq(contacts.groupId, campaign[0].groupId));
    await this.db.delete(recurringCampaigns).where(eq(recurringCampaigns.id, id));
    return { success: true };
  }

  // 5. CRON - Runs every minute
  @Cron(CronExpression.EVERY_MINUTE)
  async processRecurringEvents() {
    const now = new Date();
    
    // Evaluate in Sri Lanka time (Asia/Colombo)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Colombo',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    const p: Record<string, string> = {};
    for (const part of formatter.formatToParts(now)) {
      p[part.type] = part.value;
    }
    
    if (p.hour === '24') p.hour = '00'; // Safari/V8 edge case
    
    const currentTime = `${p.hour}:${p.minute}`;
    const mmdd = `${p.month}-${p.day}`;

    const activeCampaigns = await this.db.select()
      .from(recurringCampaigns)
      .where(and(
        eq(recurringCampaigns.status, 'active'),
        eq(recurringCampaigns.sendTime, currentTime)
      ));

    if (activeCampaigns.length === 0) return;

    const todayString = `${p.year}-${p.month}-${p.day}`;
    const dd = p.day;

    for (const campaign of activeCampaigns) {
      let condition;
      
      if (campaign.frequency === 'daily') {
        condition = eq(contacts.groupId, campaign.groupId);
      } else if (campaign.frequency === 'weekly') {
        condition = and(
          eq(contacts.groupId, campaign.groupId),
          sql`DAYOFWEEK(${contacts.eventDate}) = DAYOFWEEK(${todayString})`
        );
      } else if (campaign.frequency === 'monthly') {
        condition = and(
          eq(contacts.groupId, campaign.groupId),
          like(contacts.eventDate, '%-' + dd)
        );
      } else {
        // yearly (default)
        condition = and(
          eq(contacts.groupId, campaign.groupId),
          like(contacts.eventDate, '%' + mmdd)
        );
      }

      const matchedContacts = await this.db.select()
        .from(contacts)
        .where(condition);

      if (matchedContacts.length === 0) continue;

      this.logger.log(`Triggering Recurring Campaign ${campaign.name} for ${matchedContacts.length} contacts`);

      const [account] = await this.db.select().from(accounts).where(eq(accounts.id, campaign.accountId));
      if (!account) continue;

      for (const contact of matchedContacts) {
        const body = campaign.messageTemplate.replace(/\{name\}/gi, contact.firstName ?? '');
        const cost = Math.ceil(body.length / 160);

        if (parseFloat(account.creditBalance || '0') < cost) {
          this.logger.warn(`Account ${campaign.accountId} out of credits for recurring campaign`);
          break;
        }

        const messageId = uuidv4();
        await this.db.insert(messages).values({
          id: messageId,
          accountId: campaign.accountId,
          to: contact.phone,
          from: campaign.senderId,
          body,
          status: 'queued',
          type: 'scheduled',
          segmentCount: cost,
          creditCost: cost.toFixed(4),
          scheduledAt: now,
        });

        await this.db.update(accounts)
          .set({ creditBalance: sql`credit_balance - ${cost}` })
          .where(eq(accounts.id, campaign.accountId));

        await this.smsQueue.add('send-sms', {
          messageId,
          to: contact.phone,
          from: campaign.senderId ?? undefined,
          body,
          accountId: campaign.accountId,
        });
      }


      await this.db.update(recurringCampaigns)
        .set({ lastRunAt: now })
        .where(eq(recurringCampaigns.id, campaign.id));
    }
  }
}
