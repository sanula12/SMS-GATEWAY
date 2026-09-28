import {
  Injectable, Inject, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { DRIZZLE } from '../../database/drizzle.module';
import { whitelabelSettings, accounts } from '../../database/schema';

export interface WhitelabelDto {
  domain?: string;
  companyName: string;
  logoUrl?: string;
  primaryColor?: string;
  supportEmail?: string;
}

@Injectable()
export class WhitelabelService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  // ── Public: look up branding by domain (used by Next.js middleware) ────────
  async findByDomain(domain: string) {
    const [setting] = await this.db
      .select()
      .from(whitelabelSettings)
      .where(eq(whitelabelSettings.domain, domain))
      .limit(1);

    if (!setting) throw new NotFoundException('No branding found for this domain');
    return setting;
  }

  // ── Get own whitelabel settings (reseller) ────────────────────────────────
  async getMySettings(accountId: string) {
    const [setting] = await this.db
      .select()
      .from(whitelabelSettings)
      .where(eq(whitelabelSettings.accountId, accountId))
      .limit(1);

    return setting ?? null;
  }

  // ── Create or update whitelabel settings (reseller) ───────────────────────
  async upsert(dto: WhitelabelDto, accountId: string, callerRole: string) {
    if (callerRole !== 'super_admin' && callerRole !== 'reseller') {
      throw new ForbiddenException('Only resellers and admins can configure white-labeling');
    }

    // If domain is being set, make sure it's not taken by another account
    if (dto.domain) {
      const [existing] = await this.db
        .select()
        .from(whitelabelSettings)
        .where(eq(whitelabelSettings.domain, dto.domain))
        .limit(1);

      if (existing && existing.accountId !== accountId) {
        throw new ConflictException('This domain is already registered to another account');
      }
    }

    const [current] = await this.db
      .select()
      .from(whitelabelSettings)
      .where(eq(whitelabelSettings.accountId, accountId))
      .limit(1);

    if (current) {
      // Update
      await this.db
        .update(whitelabelSettings)
        .set({
          domain: dto.domain ?? current.domain,
          companyName: dto.companyName,
          logoUrl: dto.logoUrl ?? current.logoUrl,
          primaryColor: dto.primaryColor ?? current.primaryColor,
          supportEmail: dto.supportEmail ?? current.supportEmail,
          updatedAt: new Date(),
        })
        .where(eq(whitelabelSettings.accountId, accountId));
    } else {
      // Insert new
      await this.db.insert(whitelabelSettings).values({
        id: uuidv4(),
        accountId,
        domain: dto.domain ?? null,
        companyName: dto.companyName,
        logoUrl: dto.logoUrl ?? null,
        primaryColor: dto.primaryColor ?? '#111827',
        supportEmail: dto.supportEmail ?? null,
      });
    }

    return this.getMySettings(accountId);
  }

  // ── Admin: get all whitelabel settings ────────────────────────────────────
  async findAll() {
    return this.db.select().from(whitelabelSettings);
  }
}
