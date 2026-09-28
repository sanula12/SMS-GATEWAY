import {
  Injectable, Inject, NotFoundException,
  ConflictException, ForbiddenException,
} from '@nestjs/common';
import { eq, and, desc, isNotNull } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { DRIZZLE } from '../../database/drizzle.module';
import { senderIds, accounts } from '../../database/schema';
import { CreateSenderIdDto, UpdateSenderIdStatusDto, ResellerReviewDto } from './dto';

@Injectable()
export class SenderIdsService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  // ── Get all sender IDs ────────────────────────────────────────────────────
  async findAll(accountId: string, callerRole: string) {
    if (callerRole === 'super_admin') {
      return this.db.select().from(senderIds).orderBy(desc(senderIds.createdAt));
    }
    return this.db
      .select()
      .from(senderIds)
      .where(eq(senderIds.accountId, accountId))
      .orderBy(desc(senderIds.createdAt));
  }

  // ── Reseller: get their customers' pending sender ID requests ─────────────
  async findCustomerRequests(resellerId: string) {
    // Get all customer accountIds that belong to this reseller
    const customers = await this.db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.parentId, resellerId), eq(accounts.role, 'customer')));

    if (customers.length === 0) return [];

    const customerIds = customers.map((c: any) => c.id);

    const results = await this.db
      .select({
        sender: senderIds,
        accountName: accounts.name,
        accountEmail: accounts.email,
      })
      .from(senderIds)
      .leftJoin(accounts, eq(senderIds.accountId, accounts.id))
      .where(
        and(
          ...customerIds.map((id: string) => eq(senderIds.accountId, id))
        )
      )
      .orderBy(desc(senderIds.createdAt));

    return results;
  }

  // ── Request a new sender ID ───────────────────────────────────────────────
  async create(dto: CreateSenderIdDto, accountId: string) {
    const existing = await this.db
      .select()
      .from(senderIds)
      .where(and(eq(senderIds.accountId, accountId), eq(senderIds.senderId, dto.senderId)))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('This sender ID has already been requested');
    }

    // Determine routing: check if this account has a reseller parent
    const [account] = await this.db
      .select({ parentId: accounts.parentId, role: accounts.role })
      .from(accounts)
      .where(eq(accounts.id, accountId))
      .limit(1);

    // If customer has a reseller parent → needs reseller review first
    // Otherwise → goes straight to admin (resellerStatus = 'approved' to skip that step)
    const needsResellerReview = account?.role === 'customer' && account?.parentId;
    const initialResellerStatus = needsResellerReview ? 'pending' : 'approved';

    const id = uuidv4();
    await this.db.insert(senderIds).values({
      id,
      accountId,
      senderId:         dto.senderId,
      country:          dto.country ?? 'LK',
      status:           'pending',
      isDefault:        false,
      nicUrl:           dto.nicUrl ?? null,
      brUrl:            dto.brUrl ?? null,
      requestLetterUrl: dto.requestLetterUrl ?? null,
      resellerStatus:   initialResellerStatus,
    });

    const result = await this.db.select().from(senderIds).where(eq(senderIds.id, id)).limit(1);
    return result[0];
  }

  // ── Reseller review: approve/reject their customer's request ─────────────
  async resellerReview(id: string, dto: ResellerReviewDto, resellerId: string) {
    const [record] = await this.db.select().from(senderIds).where(eq(senderIds.id, id)).limit(1);
    if (!record) throw new NotFoundException('Sender ID not found');

    // Verify this belongs to one of the reseller's customers
    const [ownerAccount] = await this.db
      .select({ parentId: accounts.parentId })
      .from(accounts)
      .where(eq(accounts.id, record.accountId))
      .limit(1);

    if (ownerAccount?.parentId !== resellerId) {
      throw new ForbiddenException('This sender ID does not belong to your customers');
    }

    await this.db
      .update(senderIds)
      .set({ resellerStatus: dto.resellerStatus, reviewedBy: resellerId })
      .where(eq(senderIds.id, id));

    return { message: `Reseller ${dto.resellerStatus === 'approved' ? 'forwarded to admin' : 'rejected'} the request` };
  }

  // ── Admin: approve or reject (final decision) ─────────────────────────────
  async updateStatus(id: string, dto: UpdateSenderIdStatusDto, callerRole: string) {
    if (callerRole !== 'super_admin') {
      throw new ForbiddenException('Only admins can approve or reject sender IDs');
    }

    const result = await this.db.select().from(senderIds).where(eq(senderIds.id, id)).limit(1);
    if (result.length === 0) throw new NotFoundException('Sender ID not found');

    await this.db.update(senderIds).set({ status: dto.status }).where(eq(senderIds.id, id));
    return { message: `Sender ID ${dto.status} successfully` };
  }

  // ── Set as default ────────────────────────────────────────────────────────
  async setDefault(id: string, accountId: string) {
    const result = await this.db
      .select()
      .from(senderIds)
      .where(and(eq(senderIds.id, id), eq(senderIds.accountId, accountId)))
      .limit(1);

    if (result.length === 0) throw new NotFoundException('Sender ID not found');
    if (result[0].status !== 'approved') {
      throw new ForbiddenException('Only approved sender IDs can be set as default');
    }

    await this.db.update(senderIds).set({ isDefault: false }).where(eq(senderIds.accountId, accountId));
    await this.db.update(senderIds).set({ isDefault: true }).where(eq(senderIds.id, id));
    return { message: 'Default sender ID updated successfully' };
  }

  // ── Delete sender ID ──────────────────────────────────────────────────────
  async remove(id: string, accountId: string) {
    const result = await this.db
      .select()
      .from(senderIds)
      .where(and(eq(senderIds.id, id), eq(senderIds.accountId, accountId)))
      .limit(1);

    if (result.length === 0) throw new NotFoundException('Sender ID not found');
    await this.db.delete(senderIds).where(eq(senderIds.id, id));
    return { message: 'Sender ID deleted successfully' };
  }
}