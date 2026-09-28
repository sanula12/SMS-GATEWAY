import {
  mysqlTable,
  varchar,
  int,
  bigint,
  text,
  timestamp,
  mysqlEnum,
  boolean,
  json,
  decimal,
  index,
} from 'drizzle-orm/mysql-core';

// ─── Accounts ───────────────────────────────────────────────────────────────
export const accounts = mysqlTable('accounts', {
  id:               varchar('id', { length: 36 }).primaryKey(),
  name:             varchar('name', { length: 255 }).notNull(),
  email:            varchar('email', { length: 255 }).notNull().unique(),
  password:         varchar('password', { length: 255 }).notNull(),
  role:             mysqlEnum('role', ['super_admin', 'reseller', 'customer']).notNull().default('customer'),
  status:           mysqlEnum('status', ['active', 'suspended', 'pending']).notNull().default('pending'),
  parentId:         varchar('parent_id', { length: 36 }),
  registrationSource: mysqlEnum('registration_source', ['direct', 'reseller_invite', 'reseller_created']).default('direct'),
  creditBalance:    decimal('credit_balance', { precision: 10, scale: 4 }).notNull().default('0'),
  phone:            varchar('phone', { length: 20 }),
  lowBalanceThreshold: decimal('low_balance_threshold', { precision: 10, scale: 4 }).default('100'),
  lowBalanceNotified: boolean('low_balance_notified').default(false),
  timezone:         varchar('timezone', { length: 100 }).default('UTC'),
  createdAt:        timestamp('created_at').defaultNow(),
  updatedAt:        timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  parentIdx: index('parent_idx').on(table.parentId),
  emailIdx:  index('email_idx').on(table.email),
}));

// ─── API Keys ────────────────────────────────────────────────────────────────
export const apiKeys = mysqlTable('api_keys', {
  id:          varchar('id', { length: 36 }).primaryKey(),
  accountId:   varchar('account_id', { length: 36 }).notNull(),
  name:        varchar('name', { length: 100 }).notNull(),
  keyHash:     varchar('key_hash', { length: 255 }).notNull().unique(),
  keyPrefix:   varchar('key_prefix', { length: 20 }).notNull(),
  permissions: json('permissions'),
  lastUsedAt:  timestamp('last_used_at'),
  expiresAt:   timestamp('expires_at'),
  isActive:    boolean('is_active').default(true),
  createdAt:   timestamp('created_at').defaultNow(),
}, (table) => ({
  accountIdx: index('account_idx').on(table.accountId),
}));

// ─── Sender IDs ──────────────────────────────────────────────────────────────
export const senderIds = mysqlTable('sender_ids', {
  id:               varchar('id', { length: 36 }).primaryKey(),
  accountId:        varchar('account_id', { length: 36 }).notNull(),
  senderId:         varchar('sender_id', { length: 20 }).notNull(),
  status:           mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending'),
  country:          varchar('country', { length: 10 }).default('LK'),
  isDefault:        boolean('is_default').default(false),
  // Supporting documents (Bunny CDN URLs)
  nicUrl:           varchar('nic_url', { length: 1000 }),
  brUrl:            varchar('br_url', { length: 1000 }),
  requestLetterUrl: varchar('request_letter_url', { length: 1000 }),
  // Reseller review step (for reseller's customers)
  resellerStatus:   mysqlEnum('reseller_status', ['pending', 'approved', 'rejected']).default('pending'),
  reviewedBy:       varchar('reviewed_by', { length: 36 }),
  createdAt:        timestamp('created_at').defaultNow(),
}, (table) => ({
  accountIdx: index('account_idx').on(table.accountId),
}));

// ─── Contacts ────────────────────────────────────────────────────────────────
export const contacts = mysqlTable('contacts', {
  id:          varchar('id', { length: 36 }).primaryKey(),
  accountId:   varchar('account_id', { length: 36 }).notNull(),
  firstName:   varchar('first_name', { length: 100 }),
  lastName:    varchar('last_name', { length: 100 }),
  phone:       varchar('phone', { length: 20 }).notNull(),
  email:       varchar('email', { length: 255 }),
  custom1:     varchar('custom_1', { length: 255 }),
  custom2:     varchar('custom_2', { length: 255 }),
  variables:   json('variables'),
  groupId:     varchar('group_id', { length: 36 }),
  isOptedOut:  boolean('is_opted_out').default(false),
  eventDate:   varchar('event_date', { length: 20 }),
  createdAt:   timestamp('created_at').defaultNow(),
  updatedAt:   timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  accountIdx: index('account_idx').on(table.accountId),
  phoneIdx:   index('phone_idx').on(table.phone),
}));

// ─── Contact Groups ───────────────────────────────────────────────────────────
export const contactGroups = mysqlTable('contact_groups', {
  id:          varchar('id', { length: 36 }).primaryKey(),
  accountId:   varchar('account_id', { length: 36 }).notNull(),
  name:        varchar('name', { length: 100 }).notNull(),
  description: text('description'),
  count:       int('count').default(0),
  createdAt:   timestamp('created_at').defaultNow(),
});

// ─── Campaigns ───────────────────────────────────────────────────────────────
export const campaigns = mysqlTable('campaigns', {
  id:           varchar('id', { length: 36 }).primaryKey(),
  accountId:    varchar('account_id', { length: 36 }).notNull(),
  name:         varchar('name', { length: 255 }).notNull(),
  message:      text('message').notNull(),
  senderId:     varchar('sender_id', { length: 20 }),
  status:       mysqlEnum('status', ['draft', 'scheduled', 'processing', 'completed', 'failed', 'cancelled', 'pending_approval', 'rejected']).default('draft'),
  type:         mysqlEnum('type', ['instant', 'scheduled', 'excel_import']).default('instant'),
  scheduledAt:  timestamp('scheduled_at'),
  totalCount:   int('total_count').default(0),
  sentCount:    int('sent_count').default(0),
  deliveredCount: int('delivered_count').default(0),
  failedCount:  int('failed_count').default(0),
  sourceFileUrl: varchar('source_file_url', { length: 500 }),
  createdAt:    timestamp('created_at').defaultNow(),
  updatedAt:    timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  accountIdx: index('account_idx').on(table.accountId),
  statusIdx:  index('status_idx').on(table.status),
}));

// ─── Messages ────────────────────────────────────────────────────────────────
export const messages = mysqlTable('messages', {
  id:               varchar('id', { length: 36 }).primaryKey(),
  accountId:        varchar('account_id', { length: 36 }).notNull(),
  campaignId:       varchar('campaign_id', { length: 36 }),
  to:               varchar('to', { length: 20 }).notNull(),
  from:             varchar('from', { length: 20 }),
  body:             text('body').notNull(),
  status:           mysqlEnum('status', ['pending', 'queued', 'sent', 'delivered', 'failed', 'rejected']).default('pending'),
  provider:         varchar('provider', { length: 50 }),
  providerMessageId: varchar('provider_message_id', { length: 255 }),
  providerResponse: json('provider_response'),
  segmentCount:     int('segment_count').default(1),
  creditCost:       decimal('credit_cost', { precision: 10, scale: 4 }).default('0'),
  scheduledAt:      timestamp('scheduled_at'),
  sentAt:           timestamp('sent_at'),
  deliveredAt:      timestamp('delivered_at'),
  bullJobId:        varchar('bull_job_id', { length: 255 }),
  createdAt:        timestamp('created_at').defaultNow(),
  updatedAt:        timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  accountIdx:  index('account_idx').on(table.accountId),
  campaignIdx: index('campaign_idx').on(table.campaignId),
  statusIdx:   index('status_idx').on(table.status),
  toIdx:       index('to_idx').on(table.to),
}));

// ─── Credit Transactions ──────────────────────────────────────────────────────
export const creditTransactions = mysqlTable('credit_transactions', {
  id:          varchar('id', { length: 36 }).primaryKey(),
  accountId:   varchar('account_id', { length: 36 }).notNull(),
  type:        mysqlEnum('type', ['topup', 'deduction', 'refund', 'transfer']).notNull(),
  amount:      decimal('amount', { precision: 10, scale: 4 }).notNull(),
  balanceBefore: decimal('balance_before', { precision: 10, scale: 4 }).notNull(),
  balanceAfter:  decimal('balance_after', { precision: 10, scale: 4 }).notNull(),
  description: varchar('description', { length: 255 }),
  referenceId: varchar('reference_id', { length: 36 }),
  createdAt:   timestamp('created_at').defaultNow(),
}, (table) => ({
  accountIdx: index('account_idx').on(table.accountId),
}));

// ─── Webhook Endpoints ────────────────────────────────────────────────────────
export const webhookEndpoints = mysqlTable('webhook_endpoints', {
  id:        varchar('id', { length: 36 }).primaryKey(),
  accountId: varchar('account_id', { length: 36 }).notNull(),
  url:       varchar('url', { length: 500 }).notNull(),
  events:    json('events'),
  secret:    varchar('secret', { length: 255 }),
  isActive:  boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = mysqlTable('notifications', {
  id:          varchar('id', { length: 36 }).primaryKey(),
  accountId:   varchar('account_id', { length: 36 }).notNull(),
  title:       varchar('title', { length: 255 }).notNull(),
  message:     text('message').notNull(),
  type:        varchar('type', { length: 50 }).notNull(),
  isRead:      boolean('is_read').default(false),
  createdAt:   timestamp('created_at').defaultNow(),
}, (table) => ({
  accountIdx: index('account_idx').on(table.accountId),
}));

// ─── Scheduled Jobs ───────────────────────────────────────────────────────────
export const scheduledJobs = mysqlTable('scheduled_jobs', {
  id:          varchar('id', { length: 36 }).primaryKey(),
  accountId:   varchar('account_id', { length: 36 }).notNull(),
  messageId:   varchar('message_id', { length: 36 }),
  campaignId:  varchar('campaign_id', { length: 36 }),
  bullJobId:   varchar('bull_job_id', { length: 255 }).notNull(),
  queueName:   varchar('queue_name', { length: 100 }).notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  status:      mysqlEnum('status', ['waiting', 'active', 'completed', 'failed', 'cancelled']).default('waiting'),
  createdAt:   timestamp('created_at').defaultNow(),
}, (table) => ({
  accountIdx: index('account_idx').on(table.accountId),
}));

// ─── Packages (Prepaid Bundles) ───────────────────────────────────────────────
export const packages = mysqlTable('packages', {
  id:           varchar('id', { length: 36 }).primaryKey(),
  name:         varchar('name', { length: 255 }).notNull(),
  ownerId:      varchar('owner_id', { length: 36 }),
  type:         mysqlEnum('type', ['retail', 'wholesale']).notNull().default('retail'),
  price:        decimal('price', { precision: 10, scale: 2 }).notNull(),
  creditAmount: int('credit_amount').notNull(),
  features:     json('features'),
  isActive:     boolean('is_active').default(true),
  createdAt:    timestamp('created_at').defaultNow(),
  updatedAt:    timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  ownerIdx: index('owner_idx').on(table.ownerId),
  typeIdx:  index('type_idx').on(table.type),
}));

// ─── Payment Transactions ─────────────────────────────────────────────────────
export const paymentTransactions = mysqlTable('payment_transactions', {
  id:               varchar('id', { length: 36 }).primaryKey(),
  accountId:        varchar('account_id', { length: 36 }).notNull(),
  packageId:        varchar('package_id', { length: 36 }),
  amount:           decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod:    mysqlEnum('payment_method', ['onepay', 'bank_transfer', 'stripe', 'other']).notNull(),
  status:           mysqlEnum('status', ['pending', 'completed', 'failed', 'rejected', 'canceled']).default('pending'),
  slipUrl:          varchar('slip_url', { length: 500 }),
  gatewayReference: varchar('gateway_reference', { length: 255 }),
  notes:            text('notes'),
  createdAt:        timestamp('created_at').defaultNow(),
  updatedAt:        timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  accountIdx: index('account_idx').on(table.accountId),
  statusIdx:  index('status_idx').on(table.status),
}));

// ─── Whitelabel Settings ──────────────────────────────────────────────────────
export const whitelabelSettings = mysqlTable('whitelabel_settings', {
  id:           varchar('id', { length: 36 }).primaryKey(),
  accountId:    varchar('account_id', { length: 36 }).notNull().unique(),
  domain:       varchar('domain', { length: 255 }).unique(),
  companyName:  varchar('company_name', { length: 255 }).notNull(),
  logoUrl:      varchar('logo_url', { length: 500 }),
  primaryColor: varchar('primary_color', { length: 20 }),
  supportEmail: varchar('support_email', { length: 255 }),
  createdAt:    timestamp('created_at').defaultNow(),
  updatedAt:    timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  domainIdx: index('domain_idx').on(table.domain),
}));

// ─── System Settings ──────────────────────────────────────────────────────────
export const systemSettings = mysqlTable('system_settings', {
  id:        varchar('id', { length: 36 }).primaryKey(),
  accountId: varchar('account_id', { length: 36 }),
  category:  varchar('category', { length: 50 }).notNull(),
  key:       varchar('key', { length: 100 }).notNull(),
  value:     json('value'),
  updatedAt: timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  accountKeyIdx: index('account_key_idx').on(table.accountId, table.key),
}));

// ─── Recurring Campaigns ──────────────────────────────────────────────────────
export const recurringCampaigns = mysqlTable('recurring_campaigns', {
  id:              varchar('id', { length: 36 }).primaryKey(),
  accountId:       varchar('account_id', { length: 36 }).notNull(),
  name:            varchar('name', { length: 255 }).notNull(),
  groupId:         varchar('group_id', { length: 36 }).notNull(),
  messageTemplate: text('message_template').notNull(),
  senderId:        varchar('sender_id', { length: 20 }),
  status:          mysqlEnum('status', ['active', 'paused']).default('active'),
  frequency:       mysqlEnum('frequency', ['daily', 'weekly', 'monthly', 'yearly']).default('yearly'),
  sendTime:        varchar('send_time', { length: 10 }).notNull(),
  lastRunAt:       timestamp('last_run_at'),
  createdAt:       timestamp('created_at').defaultNow(),
  updatedAt:       timestamp('updated_at').defaultNow().onUpdateNow(),
}, (table) => ({
  accountIdx: index('account_idx').on(table.accountId),
}));


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
// "?"?"? Reseller Inquiries "?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?"?
export const resellerInquiries = mysqlTable('reseller_inquiries', {
  id:          varchar('id', { length: 36 }).primaryKey(),
  name:        varchar('name', { length: 255 }).notNull(),
  company:     varchar('company', { length: 255 }).notNull(),
  email:       varchar('email', { length: 255 }).notNull(),
  phone:       varchar('phone', { length: 50 }),
  message:     text('message').notNull(),
  status:      mysqlEnum('status', ['pending', 'reviewed', 'contacted', 'rejected']).notNull().default('pending'),
  createdAt:   timestamp('created_at').defaultNow().notNull(),
  updatedAt:   timestamp('updated_at').defaultNow().onUpdateNow().notNull(),
});
