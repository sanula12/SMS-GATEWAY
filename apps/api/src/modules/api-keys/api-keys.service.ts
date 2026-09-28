import {
  Injectable, Inject, NotFoundException,
  ForbiddenException, Logger,
} from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import { DRIZZLE } from '../../database/drizzle.module';
import { apiKeys, accounts } from '../../database/schema';
import { CreateApiKeyDto } from './dto';

@Injectable()
export class ApiKeysService {
  private readonly logger = new Logger(ApiKeysService.name);

  constructor(@Inject(DRIZZLE) private db: any) {}

  // ── Generate a new API key ────────────────────────────────────────────────
  async create(dto: CreateApiKeyDto, accountId: string) {
    // Generate key: prefix + random bytes
    const prefix = 'sg_live_';
    const rawKey = prefix + crypto.randomBytes(32).toString('hex');
    const keyHash = await bcrypt.hash(rawKey, 10);
    const keyPrefix = rawKey.substring(0, 12);

    const id = uuidv4();

    await this.db.insert(apiKeys).values({
      id,
      accountId,
      name: dto.name,
      keyHash,
      keyPrefix,
      permissions: dto.permissions ?? ['sms:send', 'contacts:read'],
      expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      isActive: true,
    });

    this.logger.log(`API key created for account ${accountId}: ${keyPrefix}...`);

    // Return the raw key ONCE — never stored in plain text
    return {
      id,
      name: dto.name,
      key: rawKey,
      keyPrefix,
      permissions: dto.permissions ?? ['sms:send', 'contacts:read'],
      expiresAt: dto.expiresAt ?? null,
      warning: 'Save this key now — it will never be shown again',
    };
  }

  // ── List all keys for an account (never shows full key) ───────────────────
  async findAll(accountId: string) {
    return this.db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        permissions: apiKeys.permissions,
        isActive: apiKeys.isActive,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.accountId, accountId))
      .orderBy(desc(apiKeys.createdAt));
  }

  // ── Revoke a key ──────────────────────────────────────────────────────────
  async revoke(id: string, accountId: string) {
    const result = await this.db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.accountId, accountId)))
      .limit(1);

    if (result.length === 0) throw new NotFoundException('API key not found');

    await this.db
      .update(apiKeys)
      .set({ isActive: false })
      .where(eq(apiKeys.id, id));

    return { message: 'API key revoked successfully' };
  }

  // ── Validate API key (used by API key auth guard) ─────────────────────────
  async validateApiKey(rawKey: string) {
    const prefix = rawKey.substring(0, 12);

    const keys = await this.db
      .select()
      .from(apiKeys)
      .where(eq(apiKeys.keyPrefix, prefix));

    for (const key of keys) {
      if (!key.isActive) continue;
      if (key.expiresAt && new Date(key.expiresAt) < new Date()) continue;

      const match = await bcrypt.compare(rawKey, key.keyHash);
      if (match) {
        // Update last used
        await this.db
          .update(apiKeys)
          .set({ lastUsedAt: new Date() })
          .where(eq(apiKeys.id, key.id));

        // Get account
        const account = await this.db
          .select()
          .from(accounts)
          .where(eq(accounts.id, key.accountId))
          .limit(1);

        return {
          valid: true,
          accountId: key.accountId,
          permissions: key.permissions,
          account: account[0],
        };
      }
    }

    return { valid: false };
  }
}