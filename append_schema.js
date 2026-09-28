const fs = require('fs');
let code = fs.readFileSync('apps/api/src/database/schema/index.ts', 'utf8');

code += `

// ─── Support Tickets ────────────────────────────────────────────────────────
export const supportTickets = mysqlTable('support_tickets', {
  id:          varchar('id', { length: 36 }).primaryKey(),
  accountId:   varchar('account_id', { length: 36 }).notNull(),
  ticketNumber: varchar('ticket_number', { length: 20 }).notNull(),
  subject:     varchar('subject', { length: 255 }).notNull(),
  status:      mysqlEnum('status', ['open', 'pending', 'resolved', 'closed']).default('open').notNull(),
  priority:    mysqlEnum('priority', ['low', 'medium', 'high']).default('medium').notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  accountIdx: index('ticket_account_idx').on(table.accountId),
}));

export const supportTicketMessages = mysqlTable('support_ticket_messages', {
  id:          varchar('id', { length: 36 }).primaryKey(),
  ticketId:    varchar('ticket_id', { length: 36 }).notNull(),
  accountId:   varchar('account_id', { length: 36 }).notNull(),
  message:     text('message').notNull(),
  attachmentUrl: varchar('attachment_url', { length: 500 }),
  isInternal:  boolean('is_internal').default(false).notNull(),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  ticketIdx: index('message_ticket_idx').on(table.ticketId),
}));
`;
fs.writeFileSync('apps/api/src/database/schema/index.ts', code);
