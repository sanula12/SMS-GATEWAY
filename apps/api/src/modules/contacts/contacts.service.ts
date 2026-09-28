import {
  Injectable, Inject, NotFoundException,
  ConflictException, BadRequestException
} from '@nestjs/common';
import { eq, and, desc, like, sql } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';
import { DRIZZLE } from '../../database/drizzle.module';
import { contacts, contactGroups } from '../../database/schema';
import { CreateContactDto, UpdateContactDto, CreateGroupDto } from './dto';
import { normalizePhoneNumber } from '../../common/utils/phone.util';

@Injectable()
export class ContactsService {
  constructor(@Inject(DRIZZLE) private db: any) {}

  // ── Normalize phone ───────────────────────────────────────────────────────
  private normalizePhone(phone: string): string {
    const normalized = normalizePhoneNumber(phone);
    if (!normalized) {
      throw new BadRequestException(`Invalid phone number: ${phone}`);
    }
    return normalized;
  }

  // ── Get all contacts ──────────────────────────────────────────────────────
  async findAll(accountId: string, groupId?: string) {
    if (groupId) {
      return this.db
        .select()
        .from(contacts)
        .where(and(
          eq(contacts.accountId, accountId),
          eq(contacts.groupId, groupId),
        ))
        .orderBy(desc(contacts.createdAt));
    }

    return this.db
      .select()
      .from(contacts)
      .where(eq(contacts.accountId, accountId))
      .orderBy(desc(contacts.createdAt));
  }

  // ── Get single contact ────────────────────────────────────────────────────
  async findOne(id: string, accountId: string) {
    const result = await this.db
      .select()
      .from(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.accountId, accountId)))
      .limit(1);

    if (result.length === 0) throw new NotFoundException('Contact not found');
    return result[0];
  }

  // ── Create contact ────────────────────────────────────────────────────────
  async create(dto: CreateContactDto, accountId: string) {
    const phone = this.normalizePhone(dto.phone);

    // Check duplicate phone in this account
    const existing = await this.db
      .select()
      .from(contacts)
      .where(and(eq(contacts.accountId, accountId), eq(contacts.phone, phone)))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException('Contact with this phone number already exists');
    }

    const id = uuidv4();
    await this.db.insert(contacts).values({
      id,
      accountId,
      phone,
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      groupId: dto.groupId,
      variables: dto.variables ?? {},
    });

    // Update group count if assigned
    if (dto.groupId) {
      await this.incrementGroupCount(dto.groupId, 1);
    }

    return this.findOne(id, accountId);
  }

  // ── Update contact ────────────────────────────────────────────────────────
  async update(id: string, dto: UpdateContactDto, accountId: string) {
    const contact = await this.findOne(id, accountId);

    // Handle group change
    if (dto.groupId !== undefined && dto.groupId !== contact.groupId) {
      if (contact.groupId) await this.incrementGroupCount(contact.groupId, -1);
      if (dto.groupId) await this.incrementGroupCount(dto.groupId, 1);
    }

    await this.db
      .update(contacts)
      .set({ ...dto, updatedAt: new Date() })
      .where(and(eq(contacts.id, id), eq(contacts.accountId, accountId)));

    return this.findOne(id, accountId);
  }

  // ── Delete contact ────────────────────────────────────────────────────────
  async remove(id: string, accountId: string) {
    const contact = await this.findOne(id, accountId);

    if (contact.groupId) {
      await this.incrementGroupCount(contact.groupId, -1);
    }

    await this.db
      .delete(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.accountId, accountId)));

    return { message: 'Contact deleted successfully' };
  }

  // ── Bulk import contacts ──────────────────────────────────────────────────
  async bulkImport(
    rows: Array<{ phone: string; firstName?: string; lastName?: string; email?: string; custom1?: string; custom2?: string; variables?: any }>,
    accountId: string,
    groupId?: string,
  ) {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of rows) {
      try {
        const phone = this.normalizePhone(row.phone);

        const existing = await this.db
          .select()
          .from(contacts)
          .where(and(eq(contacts.accountId, accountId), eq(contacts.phone, phone)))
          .limit(1);

        if (existing.length > 0) {
          // Update existing contact instead of skipping
          await this.db.update(contacts).set({
            firstName: row.firstName || existing[0].firstName,
            lastName: row.lastName || existing[0].lastName,
            email: row.email || existing[0].email,
            custom1: row.custom1 || existing[0].custom1,
            custom2: row.custom2 || existing[0].custom2,
            groupId: groupId ?? existing[0].groupId,
            variables: row.variables ?? existing[0].variables,
            updatedAt: new Date(),
          }).where(eq(contacts.id, existing[0].id));
          
          imported++;
          continue;
        }

        await this.db.insert(contacts).values({
          id: uuidv4(),
          accountId,
          phone,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email || null,
          custom1: row.custom1 || null,
          custom2: row.custom2 || null,
          groupId: groupId ?? null,
          variables: row.variables ?? {},
        });

        imported++;
      } catch (e: any) {
        errors.push(`${row.phone}: ${e.message}`);
        skipped++;
      }
    }

    // Update group count
    if (groupId && imported > 0) {
      await this.incrementGroupCount(groupId, imported);
    }

    return { imported, skipped, errors };
  }

  // ── Groups ────────────────────────────────────────────────────────────────
  async getGroups(accountId: string) {
    return this.db
      .select()
      .from(contactGroups)
      .where(eq(contactGroups.accountId, accountId))
      .orderBy(desc(contactGroups.createdAt));
  }

  async createGroup(dto: CreateGroupDto, accountId: string) {
    const id = uuidv4();
    await this.db.insert(contactGroups).values({
      id,
      accountId,
      name: dto.name,
      description: dto.description,
      count: 0,
    });

    const result = await this.db
      .select()
      .from(contactGroups)
      .where(eq(contactGroups.id, id))
      .limit(1);

    return result[0];
  }

  async deleteGroup(id: string, accountId: string) {
    const result = await this.db
      .select()
      .from(contactGroups)
      .where(and(eq(contactGroups.id, id), eq(contactGroups.accountId, accountId)))
      .limit(1);

    if (result.length === 0) throw new NotFoundException('Group not found');

    // Unassign contacts from this group
    await this.db
      .update(contacts)
      .set({ groupId: null })
      .where(and(eq(contacts.accountId, accountId), eq(contacts.groupId, id)));

    await this.db
      .delete(contactGroups)
      .where(and(eq(contactGroups.id, id), eq(contactGroups.accountId, accountId)));

    return { message: 'Group deleted successfully' };
  }

  // ── Helper: update group count ────────────────────────────────────────────
  private async incrementGroupCount(groupId: string, by: number) {
    await this.db
      .update(contactGroups)
      .set({ count: sql`count + ${by}` })
      .where(eq(contactGroups.id, groupId));
  }
}