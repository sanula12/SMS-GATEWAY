CREATE TABLE `packages` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`owner_id` varchar(36),
	`type` enum('retail','wholesale') NOT NULL DEFAULT 'retail',
	`price` decimal(10,2) NOT NULL,
	`credit_amount` int NOT NULL,
	`features` json,
	`is_active` boolean DEFAULT true,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `packages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payment_transactions` (
	`id` varchar(36) NOT NULL,
	`account_id` varchar(36) NOT NULL,
	`package_id` varchar(36),
	`amount` decimal(10,2) NOT NULL,
	`payment_method` enum('onepay','bank_transfer','stripe','other') NOT NULL,
	`status` enum('pending','completed','failed','rejected') DEFAULT 'pending',
	`slip_url` varchar(500),
	`gateway_reference` varchar(255),
	`notes` text,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `payment_transactions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `whitelabel_settings` (
	`id` varchar(36) NOT NULL,
	`account_id` varchar(36) NOT NULL,
	`domain` varchar(255),
	`company_name` varchar(255) NOT NULL,
	`logo_url` varchar(500),
	`primary_color` varchar(20),
	`support_email` varchar(255),
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `whitelabel_settings_id` PRIMARY KEY(`id`),
	CONSTRAINT `whitelabel_settings_account_id_unique` UNIQUE(`account_id`),
	CONSTRAINT `whitelabel_settings_domain_unique` UNIQUE(`domain`)
);
--> statement-breakpoint
CREATE INDEX `owner_idx` ON `packages` (`owner_id`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `packages` (`type`);--> statement-breakpoint
CREATE INDEX `account_idx` ON `payment_transactions` (`account_id`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `payment_transactions` (`status`);--> statement-breakpoint
CREATE INDEX `domain_idx` ON `whitelabel_settings` (`domain`);