CREATE TABLE `alerts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`type` enum('budget_exceeded','deadline_approaching','resource_overload') NOT NULL,
	`message` text NOT NULL,
	`severity` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `alerts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `allocations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`resourceId` int NOT NULL,
	`daysPerMonth` int NOT NULL,
	`hoursPerMonth` int NOT NULL,
	`monthlyCost` decimal(10,2) NOT NULL,
	`totalDays` int,
	`totalHours` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `allocations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` varchar(64) NOT NULL,
	`name` text NOT NULL,
	`client` text NOT NULL,
	`projectValue` decimal(12,2) NOT NULL,
	`margin` decimal(12,2) NOT NULL,
	`budgetResidual` decimal(12,2) NOT NULL,
	`monthsRemaining` int NOT NULL,
	`maxMonthlySpend` decimal(12,2) NOT NULL,
	`progress` decimal(5,4) NOT NULL DEFAULT '0',
	`startDate` timestamp,
	`endDate` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`),
	CONSTRAINT `projects_projectId_unique` UNIQUE(`projectId`)
);
--> statement-breakpoint
CREATE TABLE `resources` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` text NOT NULL,
	`dailyCost` decimal(10,2) NOT NULL,
	`email` varchar(320),
	`role` text,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `resources_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `timeEntries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`resourceId` int NOT NULL,
	`date` timestamp NOT NULL,
	`hours` decimal(5,2) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `timeEntries_id` PRIMARY KEY(`id`)
);
