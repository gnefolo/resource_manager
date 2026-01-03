import { integer, sqliteTable, text, real } from "drizzle-orm/sqlite-core";

/**
 * Core user table backing auth flow.
 */
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: text("email", { length: 320 }),
  loginMethod: text("loginMethod", { length: 64 }),
  password: text("password"), // Hashed password for local auth
  avatarUrl: text("avatarUrl"),
  jobTitle: text("jobTitle"),
  role: text("role", { enum: ["user", "admin"] }).default("user").notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  lastSignedIn: integer("lastSignedIn", { mode: "timestamp" }).notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Commesse (Projects) table
 */
export const projects = sqliteTable("projects", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: text("projectId", { length: 64 }).notNull().unique(), // e.g., C20240055
  name: text("name").notNull(),
  client: text("client").notNull(),
  projectValue: text("projectValue").notNull(), // Valore del progetto (stored as text to match decimal behavior)
  margin: text("margin").notNull(), // Margine previsto
  budgetResidual: text("budgetResidual").notNull(), // Budget residuo disponibile
  monthsRemaining: integer("monthsRemaining").notNull(), // Mesi residui di attività
  maxMonthlySpend: text("maxMonthlySpend").notNull(), // Spesa mensile massima sostenibile
  progress: text("progress").notNull().default("0"), // % avanzamento tecnico (0-1)
  startDate: integer("startDate", { mode: "timestamp" }),
  endDate: integer("endDate", { mode: "timestamp" }),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * Risorse (Team Members) table
 */
export const resources = sqliteTable("resources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  dailyCost: text("dailyCost").notNull(), // Costo puro risorsa per giorno
  email: text("email", { length: 320 }),
  role: text("role"), // Ruolo nel team (es. "Senior Analyst", "Project Manager")
  isActive: integer("isActive", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type Resource = typeof resources.$inferSelect;
export type InsertResource = typeof resources.$inferInsert;

/**
 * Allocazioni risorse su commesse (Resource Allocations)
 */
export const allocations = sqliteTable("allocations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("projectId").notNull().references(() => projects.id), // FK to projects
  resourceId: integer("resourceId").notNull().references(() => resources.id), // FK to resources
  daysPerMonth: integer("daysPerMonth").notNull(), // Giorni al mese allocati
  hoursPerMonth: integer("hoursPerMonth").notNull(), // Ore al mese allocate
  monthlyCost: text("monthlyCost").notNull(), // Costo mensile
  totalDays: integer("totalDays"), // Giorni totali pianificati
  totalHours: integer("totalHours"), // Ore totali pianificate
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type Allocation = typeof allocations.$inferSelect;
export type InsertAllocation = typeof allocations.$inferInsert;

/**
 * Daily allocations table for calendar view
 * Stores specific day assignments for resources on projects
 */
export const dailyAllocations = sqliteTable("daily_allocations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  allocationId: integer("allocation_id").notNull().references(() => allocations.id, { onDelete: "cascade" }),
  date: integer("date", { mode: "timestamp" }).notNull(),
  hours: integer("hours").notNull().default(8),
  notes: text("notes"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export type DailyAllocation = typeof dailyAllocations.$inferSelect;
export type InsertDailyAllocation = typeof dailyAllocations.$inferInsert;

/**
 * Tracking ore effettive (Time Tracking)
 */
export const timeEntries = sqliteTable("timeEntries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("projectId").notNull().references(() => projects.id), // FK to projects
  resourceId: integer("resourceId").notNull().references(() => resources.id), // FK to resources
  date: integer("date", { mode: "timestamp" }).notNull(), // Data della registrazione
  hours: text("hours").notNull(), // Ore lavorate
  description: text("description"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export type TimeEntry = typeof timeEntries.$inferSelect;
export type InsertTimeEntry = typeof timeEntries.$inferInsert;

/**
 * Alert e notifiche (Alerts)
 */
export const alerts = sqliteTable("alerts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  projectId: integer("projectId").notNull().references(() => projects.id), // FK to projects
  type: text("type", { enum: ["budget_exceeded", "deadline_approaching", "resource_overload"] }).notNull(),
  message: text("message").notNull(),
  severity: text("severity", { enum: ["low", "medium", "high"] }).notNull().default("medium"),
  isRead: integer("isRead", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;
