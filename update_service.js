const fs = require('fs');
let code = fs.readFileSync('apps/api/src/modules/tickets/tickets.service.ts', 'utf8');

// replace getTickets
code = code.replace(/async getTickets\(accountId\?: string\) \{[\s\S]*?return await query;\n  \}/, `async getTickets(user: any) {
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
      // Reseller sees their own tickets + their customers' tickets
      const or = require('drizzle-orm').or;
      query.where(
        or(
          eq(schema.supportTickets.accountId, user.id),
          eq(schema.accounts.parentId, user.id)
        )
      );
    } else if (user && user.role === 'customer') {
      // Customer sees only their own tickets
      query.where(eq(schema.supportTickets.accountId, user.id));
    }
    // super_admin sees all

    return await query;
  }`);

// getTicket
code = code.replace(/async getTicket[\s\S]*?ticket, messages \};\n  \}/, `async getTicket(ticketId: string, user: any) {
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
  }`);

// replyToTicket
code = code.replace(/async replyToTicket[\s\S]*?return \{ success: true \};\n  \}/, `async replyToTicket(ticketId: string, user: any, dto: ReplyTicketDto) {
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
      isActingAsAdmin = true; // Reseller acts as admin for their customer
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

    return { success: true };
  }`);

// updateStatus
code = code.replace(/async updateStatus[\s\S]*?return \{ success: true \};\n  \}/, `async updateStatus(ticketId: string, user: any, dto: UpdateTicketStatusDto) {
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
  }`);

fs.writeFileSync('apps/api/src/modules/tickets/tickets.service.ts', code);
