import { Injectable, Inject, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, sql, desc } from 'drizzle-orm';
import { DRIZZLE } from '../../database/drizzle.module';
import { notifications, accounts } from '../../database/schema';
import { SmsProviderFactory } from '../sms/providers/sms-provider.factory';
import { EmailService } from '../email/email.service';

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private checkInterval!: NodeJS.Timeout;

  constructor(
    @Inject(DRIZZLE) private db: any,
    private providerFactory: SmsProviderFactory,
    private emailService: EmailService,
  ) {}

  onModuleInit() {
    // Run the low balance check every 5 minutes
    this.checkInterval = setInterval(() => {
      this.checkLowBalances().catch(e => this.logger.error('Low balance check failed', e));
    }, 5 * 60 * 1000);
    
    // Also run once on startup
    setTimeout(() => {
      this.checkLowBalances().catch(e => this.logger.error('Startup low balance check failed', e));
    }, 5000);
  }

  onModuleDestroy() {
    if (this.checkInterval) clearInterval(this.checkInterval);
  }

  /**
   * Scans all accounts for low balances that haven't been notified yet
   */
  async checkLowBalances() {
    const lowBalanceAccounts = await this.db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.lowBalanceNotified, false),
          sql`${accounts.creditBalance} <= ${accounts.lowBalanceThreshold}`
        )
      );

    if (lowBalanceAccounts.length === 0) return;

    this.logger.log(`Found ${lowBalanceAccounts.length} accounts with low balance. Sending alerts...`);

    for (const acc of lowBalanceAccounts) {
      await this.sendLowBalanceAlert(acc);
    }
  }

  /**
   * Send a low balance notification via Email, SMS, and In-App
   */
  async sendLowBalanceAlert(account: any) {
    const message = `Alert: Your SMS credits balance is low (Current: ${parseFloat(account.creditBalance).toFixed(0)} credits). Please top up to avoid service interruption.`;

    // 1. In-App Notification
    await this.db.insert(notifications).values({
      id: uuidv4(),
      accountId: account.id,
      title: 'Low Balance Warning',
      message,
      type: 'low_balance',
    });

    // 2. Email Notification (via Resend)
    try {
      await this.emailService.sendLowBalanceEmail(
        account.email,
        account.name || 'Valued User',
        parseFloat(account.creditBalance) || 0,
        account.lowBalanceThreshold || 100,
        account.role || 'customer',
      );
    } catch (e: any) {
      this.logger.error(`Failed to send low balance email to ${account.email}: ${e.message}`);
    }

    // 3. SMS Notification (Using default system provider, bypassing credit deduction)
    if (account.phone) {
      try {
        const provider = this.providerFactory.getProvider('default'); // Or default
        await provider.send({
          to: account.phone,
          body: message,
          from: 'SystemAlert', 
        });
        this.logger.log(`[SMS] Low balance alert sent to ${account.phone}`);
      } catch (e: any) {
        this.logger.error(`Failed to send low balance SMS to ${account.phone}: ${e.message}`);
      }
    }

    // Mark as notified so we don't spam them
    await this.db
      .update(accounts)
      .set({ lowBalanceNotified: true })
      .where(eq(accounts.id, account.id));
  }

  /**
   * Create an in-app notification for a specific account
   */
  async createNotification(accountId: string, title: string, message: string, type: string) {
    const id = uuidv4();
    await this.db.insert(notifications).values({
      id,
      accountId,
      title,
      message,
      type,
      isRead: false,
    });
    return id;
  }

  /**
   * Fan out an in-app notification to all super admins
   */
  async notifySuperAdmins(title: string, message: string, type: string) {
    try {
      const superAdmins = await this.db
        .select({ id: accounts.id })
        .from(accounts)
        .where(eq(accounts.role, 'super_admin'));

      for (const admin of superAdmins) {
        await this.createNotification(admin.id, title, message, type);
      }
    } catch (err: any) {
      this.logger.error(`Failed to notify super admins: ${err.message}`);
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    await this.db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  /**
   * Get unread notifications for an account (newest first)
   */
  async getUnread(accountId: string) {
    return this.db
      .select()
      .from(notifications)
      .where(
        and(
          eq(notifications.accountId, accountId),
          eq(notifications.isRead, false)
        )
      )
      .orderBy(desc(notifications.createdAt));
  }
}
