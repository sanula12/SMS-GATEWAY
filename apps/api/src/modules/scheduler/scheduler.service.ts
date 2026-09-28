import {
  Injectable, Inject, Logger,
  NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { eq, and, inArray, isNotNull, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';
import { DRIZZLE } from '../../database/drizzle.module';
import { messages, accounts, scheduledJobs } from '../../database/schema';
import { SMS_QUEUE } from './scheduler.processor';
import { ScheduleSmsDto, ImportExcelDto } from './dto';
import { normalizePhoneNumber } from '../../common/utils/phone.util';
import { resolveSenderId } from '../../common/utils/sender-id.util';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(
    @Inject(DRIZZLE) private db: any,
    @InjectQueue(SMS_QUEUE) private smsQueue: Queue,
  ) {}

  // ── Schedule a single SMS ─────────────────────────────────────────────────
  async scheduleSms(dto: ScheduleSmsDto, accountId: string) {
    const sendAt = new Date(dto.scheduledAt);
    const now = new Date();

    if (sendAt <= now) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    const delay = sendAt.getTime() - now.getTime();

    const to = normalizePhoneNumber(dto.to);
    if (!to) {
      throw new BadRequestException(`Invalid phone number: ${dto.to}`);
    }

    const finalSenderId = await resolveSenderId(this.db, accountId, dto.from);

    const creditCost = Math.ceil(dto.body.length / 160);

    const updateResult = await this.db
      .update(accounts)
      .set({ creditBalance: sql`${accounts.creditBalance} - ${creditCost}` })
      .where(and(
        eq(accounts.id, accountId),
        sql`${accounts.creditBalance} >= ${creditCost}`
      ));

    if (updateResult[0].affectedRows === 0) {
      throw new BadRequestException('Insufficient credits to schedule this message');
    }

    const messageId = uuidv4();

    // Save message record
    await this.db.insert(messages).values({
      id: messageId,
      accountId,
      to,
      from: finalSenderId,
      body: dto.body,
      status: 'queued',
      scheduledAt: sendAt,
      segmentCount: Math.ceil(dto.body.length / 160),
      creditCost: Math.ceil(dto.body.length / 160).toFixed(4),
    });

    // Add delayed job to BullMQ
    const job = await this.smsQueue.add(
      'send-sms',
      { messageId, to, from: finalSenderId, body: dto.body, accountId },
      { delay, attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
    );

    // Save scheduled job record
    await this.db.insert(scheduledJobs).values({
      id: uuidv4(),
      accountId,
      messageId,
      bullJobId: String(job.id),
      queueName: SMS_QUEUE,
      scheduledAt: sendAt,
      status: 'waiting',
    });

    // Save bull job id on message
    await this.db
      .update(messages)
      .set({ bullJobId: String(job.id) })
      .where(eq(messages.id, messageId));

    this.logger.log(`Scheduled SMS ${messageId} for ${sendAt.toISOString()} (delay: ${delay}ms)`);

    return {
      messageId,
      jobId: job.id,
      scheduledAt: sendAt,
      status: 'scheduled',
    };
  }

  // ── Cancel a scheduled SMS ────────────────────────────────────────────────
  async cancelScheduled(messageId: string, accountId: string) {
    const result = await this.db
      .select()
      .from(messages)
      .where(and(eq(messages.id, messageId), eq(messages.accountId, accountId)))
      .limit(1);

    if (result.length === 0) throw new NotFoundException('Message not found');

    const message = result[0];

    if (!message.bullJobId) {
      throw new BadRequestException('This message has no scheduled job');
    }

    // Remove from BullMQ
    const job = await this.smsQueue.getJob(message.bullJobId);
    if (job) await job.remove();

    // Update statuses
    await this.db
      .update(messages)
      .set({ status: 'failed', updatedAt: new Date() })
      .where(eq(messages.id, messageId));

    await this.db
      .update(scheduledJobs)
      .set({ status: 'cancelled' })
      .where(eq(scheduledJobs.messageId, messageId));

    return { message: 'Scheduled SMS cancelled successfully' };
  }

  // ── Import Excel and schedule per row ─────────────────────────────────────
  async importExcel(fileBuffer: Buffer, accountId: string, from?: string) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet) as any[];

    if (rows.length === 0) {
      throw new BadRequestException('Excel file is empty');
    }

    // Validate required columns
    const firstRow = rows[0];
    const requiredColumns = ['phone', 'message', 'send_at'];
    for (const col of requiredColumns) {
      if (!(col in firstRow)) {
        throw new BadRequestException(
          `Missing required column: "${col}". Required columns: phone, message, send_at, name (optional)`
        );
      }
    }

    const results = {
      total: rows.length,
      scheduled: 0,
      skipped: 0,
      errors: [] as string[],
    };

    const now = new Date();

    for (const [index, row] of rows.entries()) {
      try {
        // Validate and normalize phone
        const to = normalizePhoneNumber(row.phone);
        if (!to) {
          results.errors.push(`Row ${index + 2}: Invalid phone number "${row.phone}"`);
          results.skipped++;
          continue;
        }

        // Parse send_at — handles both date objects and strings
        let sendAt: Date;
        if (row.send_at instanceof Date) {
          // xlsx cellDates=true creates UTC Date matching wall clock
          // e.g., 23:30 in Excel becomes 23:30:00 UTC. We force it to Asia/Colombo (+05:30)
          const wallClockStr = row.send_at.toISOString().split('.')[0];
          sendAt = new Date(wallClockStr + '+05:30');
        } else if (typeof row.send_at === 'string') {
          const cleanedDate = row.send_at.trim().replace(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2}(:\d{2})?)/, '$1T$2');
          if (!cleanedDate.includes('+') && !cleanedDate.endsWith('Z')) {
            sendAt = new Date(cleanedDate + '+05:30');
          } else {
            sendAt = new Date(cleanedDate);
          }
        } else {
          sendAt = new Date(row.send_at);
        }

        if (isNaN(sendAt.getTime())) {
          results.errors.push(`Row ${index + 2}: Invalid date "${row.send_at}"`);
          results.skipped++;
          continue;
        }

        if (sendAt <= now) {
          results.errors.push(`Row ${index + 2}: Date is in the past "${row.send_at}"`);
          results.skipped++;
          continue;
        }

        // Replace {name} placeholder in message
        const name = row.name ?? '';
        const body = String(row.message).replace(/\{name\}/gi, name);

        if (!body.trim()) {
          results.errors.push(`Row ${index + 2}: Empty message`);
          results.skipped++;
          continue;
        }

        let finalSender: string;
        try {
          finalSender = await resolveSenderId(this.db, accountId, row.sender_id ?? row.senderId ?? from ?? undefined);
        } catch(e: any) {
          results.errors.push(`Row ${index + 2}: ${e.message}`);
          results.skipped++;
          continue;
        }
        const delay = sendAt.getTime() - now.getTime();
        const messageId = uuidv4();
        const cost = Math.ceil(body.length / 160);

        // Deduct credits for this row
        const updateResult = await this.db
          .update(accounts)
          .set({ creditBalance: sql`${accounts.creditBalance} - ${cost}` })
          .where(and(
            eq(accounts.id, accountId),
            sql`${accounts.creditBalance} >= ${cost}`
          ));

        if (updateResult[0].affectedRows === 0) {
          results.errors.push(`Row ${index + 2}: Insufficient credits to schedule this message`);
          results.skipped++;
          continue;
        }

        // Save message
        await this.db.insert(messages).values({
          id: messageId,
          accountId,
          to,
          from: finalSender,
          body,
          status: 'queued',
          scheduledAt: sendAt,
          segmentCount: cost,
          creditCost: cost.toFixed(4),
        });

        // Queue delayed job
        const job = await this.smsQueue.add(
          'send-sms',
          { messageId, to, from: finalSender, body, accountId },
          {
            delay,
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
          },
        );

        // Save scheduled job record
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

        results.scheduled++;
      } catch (error: any) {
        results.errors.push(`Row ${index + 2}: ${error.message}`);
        results.skipped++;
      }
    }

    this.logger.log(
      `Excel import for ${accountId}: ${results.scheduled} scheduled, ${results.skipped} skipped`
    );

    return results;
  }

  // ── Get scheduled messages ────────────────────────────────────────────────
  async getScheduled(accountId: string) {
    return this.db
      .select()
      .from(messages)
      .where(and(
        eq(messages.accountId, accountId),
        inArray(messages.status, ['queued', 'sent', 'failed']),
        isNotNull(messages.scheduledAt),
      ))
      .orderBy(messages.scheduledAt);
  }

  // ── Get queue stats ───────────────────────────────────────────────────────
  async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.smsQueue.getWaitingCount(),
      this.smsQueue.getActiveCount(),
      this.smsQueue.getCompletedCount(),
      this.smsQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }
}