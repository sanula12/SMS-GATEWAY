import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { DRIZZLE } from '../../database/drizzle.module';
import * as schema from '../../database/schema';
import { eq, and, desc, asc, or } from 'drizzle-orm';
import { randomUUID, randomBytes } from 'crypto';
import { CreateTicketDto, ReplyTicketDto, UpdateTicketStatusDto } from './dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TicketsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: any,
    private readonly notificationsService: NotificationsService,
  ) {}

  async createTicket(accountId: string, dto: CreateTicketDto) {
    const ticketId = randomUUID();
    const ticketNumber = 'TCK-' + randomBytes(3).toString('hex').toUpperCase();
    
    await this.db.insert(schema.supportTickets).values({
      id: ticketId,
      accountId,
      ticketNumber,
      subject: dto.subject,
      priority: dto.priority || 'medium',
      status: 'open',
    });

    await this.db.insert(schema.supportTicketMessages).values({
      id: randomUUID(),
      ticketId,
      accountId,
      message: dto.message,
      attachmentUrl: dto.attachmentUrl,
    });

    // Send notifications based on account hierarchy
    this.sendTicketCreationNotification(accountId, ticketNumber, dto.subject).catch(e =>
      console.error('Failed to send ticket creation notification', e),
    );

    return { id: ticketId, ticketNumber, message: 'Ticket created successfully' };
  }

  private async sendTicketCreationNotification(accountId: string, ticketNumber: string, subject: string) {
    const [creator] = await this.db.select({
      id: schema.accounts.id,
      name: schema.accounts.name,
      role: schema.accounts.role,
      parentId: schema.accounts.parentId,
    }).from(schema.accounts).where(eq(schema.accounts.id, accountId)).limit(1);

    if (!creator) return;

    if (creator.parentId) {
      const [parent] = await this.db.select({ id: schema.accounts.id, role: schema.accounts.role })
        .from(schema.accounts)
        .where(eq(schema.accounts.id, creator.parentId))
        .limit(1);

      if (parent && parent.role === 'reseller') {
        // Customer belongs to a reseller -> Notify Reseller
        await this.notificationsService.createNotification(
          parent.id,
          `New Support Ticket: ${ticketNumber}`,
          `${creator.name} opened ticket: "${subject}"`,
          'ticket',
        );
        return;
      }
    }

    // Direct customer or reseller -> Notify Super Admins
    await this.notificationsService.notifySuperAdmins(
      `New Support Ticket: ${ticketNumber}`,
      `${creator.name} (${creator.role}) opened ticket: "${subject}"`,
      'ticket',
    );
  }

  async getTickets(user: any) {
    const query = this.db.select({
      id: schema.supportTickets.id,
      ticketNumber: schema.supportTickets.ticketNumber,
      subject: schema.supportTickets.subject,
      status: schema.supportTickets.status,
      priority: schema.supportTickets.priority,
      createdAt: schema.supportTickets.createdAt,
      updatedAt: schema.supportTickets.updatedAt,
      accountId: schema.supportTickets.accountId,
      accountName: schema.accounts.name,
    })
    .from(schema.supportTickets)
    .leftJoin(schema.accounts, eq(schema.supportTickets.accountId, schema.accounts.id))
    .orderBy(desc(schema.supportTickets.updatedAt));

    if (user && user.role === 'reseller') {
      query.where(
        or(
          eq(schema.supportTickets.accountId, user.id),
          eq(schema.accounts.parentId, user.id)
        )
      );
    } else if (user && user.role === 'customer') {
      query.where(eq(schema.supportTickets.accountId, user.id));
    }

    return await query;
  }

  async getTicket(ticketId: string, user: any) {
    const tickets = await this.db.select({
      ticket: schema.supportTickets,
      parentId: schema.accounts.parentId,
    })
      .from(schema.supportTickets)
      .leftJoin(schema.accounts, eq(schema.supportTickets.accountId, schema.accounts.id))
      .where(eq(schema.supportTickets.id, ticketId))
      .limit(1);

    const record = tickets[0];
    if (!record) throw new NotFoundException('Ticket not found');

    const ticket = record.ticket;
    const parentId = record.parentId;

    let hasAccess = false;
    if (user.role === 'super_admin') hasAccess = true;
    else if (ticket.accountId === user.id) hasAccess = true;
    else if (user.role === 'reseller' && parentId === user.id) hasAccess = true;

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this ticket');
    }

    const messages = await this.db.select({
      id: schema.supportTicketMessages.id,
      message: schema.supportTicketMessages.message,
      attachmentUrl: schema.supportTicketMessages.attachmentUrl,
      createdAt: schema.supportTicketMessages.createdAt,
      accountId: schema.supportTicketMessages.accountId,
      accountName: schema.accounts.name,
      role: schema.accounts.role,
    })
    .from(schema.supportTicketMessages)
    .leftJoin(schema.accounts, eq(schema.supportTicketMessages.accountId, schema.accounts.id))
    .where(eq(schema.supportTicketMessages.ticketId, ticketId))
    .orderBy(asc(schema.supportTicketMessages.createdAt));

    return { ticket, messages };
  }

  async replyToTicket(ticketId: string, user: any, dto: ReplyTicketDto) {
    const tickets = await this.db.select({
      ticket: schema.supportTickets,
      parentId: schema.accounts.parentId,
    })
      .from(schema.supportTickets)
      .leftJoin(schema.accounts, eq(schema.supportTickets.accountId, schema.accounts.id))
      .where(eq(schema.supportTickets.id, ticketId))
      .limit(1);

    const record = tickets[0];
    if (!record) throw new NotFoundException('Ticket not found');
    
    const ticket = record.ticket;
    const parentId = record.parentId;

    let hasAccess = false;
    let isActingAsAdmin = false;

    if (user.role === 'super_admin') {
      hasAccess = true;
      isActingAsAdmin = true;
    } else if (user.role === 'reseller' && parentId === user.id) {
      hasAccess = true;
      isActingAsAdmin = true;
    } else if (ticket.accountId === user.id) {
      hasAccess = true;
    }

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this ticket');
    }

    await this.db.insert(schema.supportTicketMessages).values({
      id: randomUUID(),
      ticketId,
      accountId: user.id,
      message: dto.message,
      attachmentUrl: dto.attachmentUrl,
      isInternal: isActingAsAdmin,
    });

    await this.db.update(schema.supportTickets)
      .set({ 
        updatedAt: new Date(),
        status: isActingAsAdmin ? 'pending' : 'open' 
      })
      .where(eq(schema.supportTickets.id, ticketId));

    // Send reply notification
    if (isActingAsAdmin) {
      if (ticket.accountId !== user.id) {
        this.notificationsService.createNotification(
          ticket.accountId,
          `Support Reply: ${ticket.ticketNumber}`,
          `Support has replied to your ticket "${ticket.subject}".`,
          'ticket',
        ).catch(e => console.error('Failed to notify customer on reply', e));
      }
    } else {
      if (parentId) {
        this.notificationsService.createNotification(
          parentId,
          `Ticket Reply: ${ticket.ticketNumber}`,
          `${user.name || 'Customer'} replied to ticket "${ticket.subject}".`,
          'ticket',
        ).catch(e => console.error('Failed to notify reseller on reply', e));
      } else {
        this.notificationsService.notifySuperAdmins(
          `Ticket Reply: ${ticket.ticketNumber}`,
          `${user.name || 'Customer'} replied to ticket "${ticket.subject}".`,
          'ticket',
        ).catch(e => console.error('Failed to notify admins on reply', e));
      }
    }

    return { success: true };
  }

  async updateStatus(ticketId: string, user: any, dto: UpdateTicketStatusDto) {
    const tickets = await this.db.select({
      ticket: schema.supportTickets,
      parentId: schema.accounts.parentId,
    })
      .from(schema.supportTickets)
      .leftJoin(schema.accounts, eq(schema.supportTickets.accountId, schema.accounts.id))
      .where(eq(schema.supportTickets.id, ticketId))
      .limit(1);

    const record = tickets[0];
    if (!record) throw new NotFoundException('Ticket not found');

    const ticket = record.ticket;
    const parentId = record.parentId;

    let hasAccess = false;
    if (user.role === 'super_admin') hasAccess = true;
    else if (user.role === 'reseller' && parentId === user.id) hasAccess = true;

    if (!hasAccess) {
      throw new ForbiddenException('You do not have permission to update this ticket status');
    }

    await this.db.update(schema.supportTickets)
      .set({ status: dto.status, updatedAt: new Date() })
      .where(eq(schema.supportTickets.id, ticketId));

    return { success: true };
  }
}
