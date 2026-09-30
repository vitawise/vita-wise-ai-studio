CREATE TABLE `credit_ledger` (
	`id` varchar(36) NOT NULL,
	`pharmacy_id` varchar(36) NOT NULL,
	`delta` int NOT NULL,
	`reason` varchar(40) NOT NULL,
	`ref_type` varchar(40),
	`ref_id` varchar(36),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `credit_ledger_id` PRIMARY KEY(`id`),
	CONSTRAINT `credit_ledger_ref_uq` UNIQUE(`ref_type`,`ref_id`,`reason`)
);
--> statement-breakpoint
CREATE TABLE `jobs` (
	`id` varchar(36) NOT NULL,
	`pharmacy_id` varchar(36) NOT NULL,
	`type` varchar(64) NOT NULL,
	`payload` json NOT NULL,
	`status` enum('queued','running','done','failed') NOT NULL DEFAULT 'queued',
	`attempts` int NOT NULL DEFAULT 0,
	`credits_reserved` int NOT NULL DEFAULT 0,
	`last_error` text,
	`result` json,
	`progress` json,
	`lock_token` varchar(36),
	`locked_at` datetime(3),
	`run_after` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `jobs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `plans` (
	`id` varchar(32) NOT NULL,
	`name_ar` varchar(60) NOT NULL,
	`name_en` varchar(60) NOT NULL,
	`price_sar` int NOT NULL,
	`monthly_credits` int NOT NULL,
	`features` json NOT NULL,
	`is_public` boolean NOT NULL DEFAULT true,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `plans_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`pharmacy_id` varchar(36) NOT NULL,
	`plan_id` varchar(32) NOT NULL,
	`status` enum('trialing','active','past_due','canceled') NOT NULL,
	`current_period_end` datetime(3) NOT NULL,
	`moyasar_token_enc` text,
	`created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
	CONSTRAINT `subscriptions_pharmacy_id` PRIMARY KEY(`pharmacy_id`)
);
--> statement-breakpoint
ALTER TABLE `credit_ledger` ADD CONSTRAINT `credit_ledger_pharmacy_id_pharmacies_id_fk` FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `jobs` ADD CONSTRAINT `jobs_pharmacy_id_pharmacies_id_fk` FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_pharmacy_id_pharmacies_id_fk` FOREIGN KEY (`pharmacy_id`) REFERENCES `pharmacies`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_plan_id_plans_id_fk` FOREIGN KEY (`plan_id`) REFERENCES `plans`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `credit_ledger_pharmacy_idx` ON `credit_ledger` (`pharmacy_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `jobs_status_created_idx` ON `jobs` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `jobs_pharmacy_idx` ON `jobs` (`pharmacy_id`,`created_at`);--> statement-breakpoint
ALTER TABLE `pharmacies` DROP COLUMN `plan_id`;