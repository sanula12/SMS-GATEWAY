CREATE TABLE `accounts` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`role` enum('super_admin','reseller','customer') NOT NULL DEFAULT 'customer',
	`status` enum('active','suspended','pending') NOT NULL DEFAULT 'pending',
	`parent_id` varchar(36),
	`registration_source` enum('direct','reseller_invite','reseller_created') DEFAULT 'direct',
	`credit_balance` decimal(10,4) NOT NULL DEFAULT '0',
	`timezone` varchar(100) DEFAULT 'UTC',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `accounts_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `api_keys` (
	`id` varchar(36) NOT NULL,
	`account_id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`key_hash` varchar(255) NOT NULL,
	`key_prefix` varchar(10) NOT NULL,
	`permissions` json,
	`last_used_at` timestamp,
	`expires_at` timestamp,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `api_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `api_keys_key_hash_unique` UNIQUE(`key_hash`)
);
--> statement-breakpoint
CREATE TABLE `campaigns` (
	`id` varchar(36) NOT NULL,
	`account_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`sender_id` varchar(20),
	`status` enum('draft','scheduled','processing','completed','failed','cancelled') DEFAULT 'draft',
	`type` enum('instant','scheduled','excel_import') DEFAULT 'instant',
	`scheduled_at` timestamp,
	`total_count` int DEFAULT 0,
	`sent_count` int DEFAULT 0,
	`delivered_count` int DEFAULT 0,
	`failed_count` int DEFAULT 0,
	`source_file_url` varchar(500),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `campaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contact_groups` (
	`id` varchar(36) NOT NULL,
	`account_id` varchar(36) NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`count` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `contact_groups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` varchar(36) NOT NULL,
	`account_id` varchar(36) NOT NULL,
	`first_name` varchar(100),
	`last_name` varchar(100),
	`phone` varchar(20) NOT NULL,
	`email` varchar(255),
	`variables` json,
	`group_id` varchar(36),
	`is_opted_out` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `credit_transactions` (
	`id` varchar(36) NOT NULL,
	`account_id` varchar(36) NOT NULL,
	`type` enum('topup','deduction','refund','transfer') NOT NULL,
	`amount` decimal(10,4) NOT NULL,
	`balance_before` decimal(10,4) NOT NULL,
	`balance_after` decimal(10,4) NOT NULL,
	`description` varchar(255),
	`reference_id` varchar(36),
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `credit_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` varchar(36) NOT NULL,
	`account_id` varchar(36) NOT NULL,
	`campaign_id` varchar(36),
	`to` varchar(20) NOT NULL,
	`from` varchar(20),
	`body` text NOT NULL,
	`status` enum('pending','queued','sent','delivered','failed','rejected') DEFAULT 'pending',
	`provider` varchar(50),
	`provider_message_id` varchar(255),
	`provider_response` json,
	`segment_count` int DEFAULT 1,
	`credit_cost` decimal(10,4) DEFAULT '0',
	`scheduled_at` timestamp,
	`sent_at` timestamp,
	`delivered_at` timestamp,
	`bull_job_id` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scheduled_jobs` (
	`id` varchar(36) NOT NULL,
	`account_id` varchar(36) NOT NULL,
	`message_id` varchar(36),
	`campaign_id` varchar(36),
	`bull_job_id` varchar(255) NOT NULL,
	`queue_name` varchar(100) NOT NULL,
	`scheduled_at` timestamp NOT NULL,
	`status` enum('waiting','active','completed','failed','cancelled') DEFAULT 'waiting',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `scheduled_jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sender_ids` (
	`id` varchar(36) NOT NULL,
	`account_id` varchar(36) NOT NULL,
	`sender_id` varchar(20) NOT NULL,
	`status` enum('pending','approved','rejected') DEFAULT 'pending',
	`country` varchar(10),
	`is_default` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `sender_ids_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `webhook_endpoints` (
	`id` varchar(36) NOT NULL,
	`account_id` varchar(36) NOT NULL,
	`url` varchar(500) NOT NULL,
	`events` json,
	`secret` varchar(255),
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `webhook_endpoints_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `parent_idx` ON `accounts` (`parent_id`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `accounts` (`email`);--> statement-breakpoint
CREATE INDEX `account_idx` ON `api_keys` (`account_id`);--> statement-breakpoint
CREATE INDEX `account_idx` ON `campaigns` (`account_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `campaigns` (`status`);--> statement-breakpoint
CREATE INDEX `account_idx` ON `contacts` (`account_id`);--> statement-breakpoint
CREATE INDEX `phone_idx` ON `contacts` (`phone`);--> statement-breakpoint
CREATE INDEX `account_idx` ON `credit_transactions` (`account_id`);--> statement-breakpoint
CREATE INDEX `account_idx` ON `messages` (`account_id`);--> statement-breakpoint
CREATE INDEX `campaign_idx` ON `messages` (`campaign_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `messages` (`status`);--> statement-breakpoint
CREATE INDEX `to_idx` ON `messages` (`to`);--> statement-breakpoint
CREATE INDEX `account_idx` ON `scheduled_jobs` (`account_id`);--> statement-breakpoint
CREATE INDEX `account_idx` ON `sender_ids` (`account_id`);