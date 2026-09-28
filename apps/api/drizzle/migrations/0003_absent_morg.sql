CREATE TABLE `notifications` (
	`id` varchar(36) NOT NULL,
	`account_id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` varchar(50) NOT NULL,
	`is_read` boolean DEFAULT false,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD `phone` varchar(20);--> statement-breakpoint
ALTER TABLE `accounts` ADD `low_balance_threshold` decimal(10,4) DEFAULT '100';--> statement-breakpoint
ALTER TABLE `accounts` ADD `low_balance_notified` boolean DEFAULT false;--> statement-breakpoint
CREATE INDEX `account_idx` ON `notifications` (`account_id`);