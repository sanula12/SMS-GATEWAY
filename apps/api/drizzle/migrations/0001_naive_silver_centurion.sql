ALTER TABLE `api_keys` MODIFY COLUMN `key_prefix` varchar(20) NOT NULL;--> statement-breakpoint
ALTER TABLE `contacts` ADD `custom_1` varchar(255);--> statement-breakpoint
ALTER TABLE `contacts` ADD `custom_2` varchar(255);