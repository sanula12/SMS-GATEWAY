import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { eq, and, isNull, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { DRIZZLE } from '../../database/drizzle.module';
import { systemSettings, accounts } from '../../database/schema';

@Injectable()
export class SettingsService implements OnModuleInit {
  private readonly logger = new Logger(SettingsService.name);

  constructor(@Inject(DRIZZLE) private db: any) {}

  async onModuleInit() {
    await this.ensureTable();
  }

  private async ensureTable() {
    try {
      await this.db.execute(sql`
        CREATE TABLE IF NOT EXISTS \`system_settings\` (
          \`id\` varchar(36) NOT NULL,
          \`account_id\` varchar(36) DEFAULT NULL,
          \`category\` varchar(50) NOT NULL,
          \`key\` varchar(100) NOT NULL,
          \`value\` json DEFAULT NULL,
          \`updated_at\` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (\`id\`),
          KEY \`account_key_idx\` (\`account_id\`, \`key\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
      this.logger.log('system_settings table verified / ensured.');
    } catch (err: any) {
      this.logger.warn(`Could not verify system_settings table: ${err.message}`);
    }
  }

  async getGlobalSettings() {
    try {
      const records = await this.db
        .select()
        .from(systemSettings)
        .where(isNull(systemSettings.accountId));
      
      return this.formatSettings(records);
    } catch (err: any) {
      this.logger.warn(`Error in getGlobalSettings: ${err.message}. Attempting table creation...`);
      await this.ensureTable();
      try {
        const records = await this.db
          .select()
          .from(systemSettings)
          .where(isNull(systemSettings.accountId));
        return this.formatSettings(records);
      } catch {
        return {};
      }
    }
  }

  async getSettingsForAccount(accountId: string, role: string) {
    try {
      if (role === 'super_admin') {
        return await this.getGlobalSettings();
      }

      let targetAccountId = accountId;

      if (role === 'customer') {
        const [acc] = await this.db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
        if (acc && acc.parentId) {
          const [parent] = await this.db.select().from(accounts).where(eq(accounts.id, acc.parentId)).limit(1);
          if (parent && parent.role === 'reseller') {
            targetAccountId = parent.id;
          } else {
            return await this.getGlobalSettings();
          }
        } else {
          return await this.getGlobalSettings();
        }
      }

      const records = await this.db
        .select()
        .from(systemSettings)
        .where(eq(systemSettings.accountId, targetAccountId));

      const globalRecords = await this.db
        .select()
        .from(systemSettings)
        .where(isNull(systemSettings.accountId));

      // Billing keys are reseller-specific and must NOT fall back to admin's values.
      // A reseller's customers should see the reseller's bank details, not the admin's.
      const RESELLER_ONLY_KEYS = ['bank_name', 'account_name', 'account_number', 'branch', 'support_email', 'support_phone'];
      const globalFormatted = this.formatSettings(globalRecords);
      const globalFiltered = Object.fromEntries(
        Object.entries(globalFormatted).filter(([k]) => !RESELLER_ONLY_KEYS.includes(k))
      );

      // Reseller settings override remaining global settings
      return { ...globalFiltered, ...this.formatSettings(records) };
    } catch (err: any) {
      this.logger.warn(`Error in getSettingsForAccount: ${err.message}`);
      await this.ensureTable();
      return {};
    }
  }

  async upsertSettings(callerId: string, callerRole: string, settings: { category: string; key: string; value: any }[]) {
    await this.ensureTable();
    const targetAccountId = callerRole === 'super_admin' ? null : callerId;

    for (const item of settings) {
      const query = targetAccountId === null
        ? and(isNull(systemSettings.accountId), eq(systemSettings.key, item.key))
        : and(eq(systemSettings.accountId, targetAccountId), eq(systemSettings.key, item.key));

      const existing = await this.db.select().from(systemSettings).where(query).limit(1);

      if (existing.length > 0) {
        await this.db
          .update(systemSettings)
          .set({ value: item.value, updatedAt: new Date() })
          .where(eq(systemSettings.id, existing[0].id));
      } else {
        await this.db.insert(systemSettings).values({
          id: uuidv4(),
          accountId: targetAccountId,
          category: item.category,
          key: item.key,
          value: item.value,
        });
      }
    }

    return { success: true };
  }

  private formatSettings(records: any[]) {
    const result: Record<string, any> = {};
    if (!Array.isArray(records)) return result;
    for (const r of records) {
      result[r.key] = r.value;
    }
    return result;
  }
}
