CREATE TABLE `daily_allocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`allocation_id` int NOT NULL,
	`date` timestamp NOT NULL,
	`hours` int NOT NULL DEFAULT 8,
	`notes` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `daily_allocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `daily_allocations` ADD CONSTRAINT `daily_allocations_allocation_id_allocations_id_fk` FOREIGN KEY (`allocation_id`) REFERENCES `allocations`(`id`) ON DELETE cascade ON UPDATE no action;