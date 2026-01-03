import { and, desc, eq, sql, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import {
  InsertUser,
  User,
  users,
  projects,
  resources,
  allocations,
  timeEntries,
  alerts,
  dailyAllocations,
  InsertProject,
  InsertResource,
  InsertAllocation,
  InsertTimeEntry,
  InsertAlert,
  InsertDailyAllocation
} from "../drizzle/schema";
import { ENV } from './_core/env';
import path from "path";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db) {
    const dbPath = process.env.DATABASE_URL || "file:" + path.join(process.cwd(), "sqlite.db");
    const authToken = process.env.DATABASE_AUTH_TOKEN;
    const client = createClient({
      url: dbPath,
      authToken: authToken
    });
    _db = drizzle(client);
  }
  return _db;
}

// ============ USER QUERIES ============

type InsertUserInput = Omit<InsertUser, "id" | "createdAt" | "updatedAt">;

export async function upsertUser(user: InsertUserInput): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
      // Add other required fields with defaults or from input
      role: 'user',
      name: user.name || null,
      email: user.email || null,
      loginMethod: user.loginMethod || null,
    };

    // Override with provided values if they exist
    if (user.role) values.role = user.role;
    if (user.name !== undefined) values.name = user.name;
    if (user.email !== undefined) values.email = user.email;
    if (user.loginMethod !== undefined) values.loginMethod = user.loginMethod;
    if (user.lastSignedIn) values.lastSignedIn = user.lastSignedIn;

    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (user.password !== undefined) {
      values.password = user.password;
      updateSet.password = user.password;
    }
    if (user.avatarUrl !== undefined) {
      values.avatarUrl = user.avatarUrl;
      updateSet.avatarUrl = user.avatarUrl;
    }
    if (user.jobTitle !== undefined) {
      values.jobTitle = user.jobTitle;
      updateSet.jobTitle = user.jobTitle;
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    // Explicitly set timestamp defaults since SQLite doesn't do it automatically
    updateSet.updatedAt = new Date();

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onConflictDoUpdate({
      target: users.openId,
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ PROJECT QUERIES ============

export async function getAllProjects() {
  const db = await getDb();
  if (!db) return [];

  const allProjects = await db.select().from(projects).orderBy(desc(projects.createdAt));

  // Calculate actual costs for all projects
  // Efficiently fetch all time entries and resources to compute in memory
  const allEntries = await db
    .select({
      projectId: timeEntries.projectId,
      hours: timeEntries.hours,
      dailyCost: resources.dailyCost,
    })
    .from(timeEntries)
    .leftJoin(resources, eq(timeEntries.resourceId, resources.id));

  // Map project ID to actual cost
  const projectCosts = new Map<number, number>();

  for (const entry of allEntries) {
    if (entry.projectId && entry.dailyCost && entry.hours) {
      const hourlyRate = parseFloat(entry.dailyCost) / 8;
      const hours = parseFloat(entry.hours);
      if (!isNaN(hourlyRate) && !isNaN(hours)) {
        const current = projectCosts.get(entry.projectId) || 0;
        projectCosts.set(entry.projectId, current + (hourlyRate * hours));
      }
    }
  }

  // Enrich projects
  return allProjects.map(p => {
    const actualCost = projectCosts.get(p.id) || 0;
    const projectValue = parseFloat(p.projectValue || "0");
    const realMargin = projectValue - actualCost;

    return {
      ...p,
      actualCost,
      realMargin
    };
  });
}

export async function getProjectById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getProjectByProjectId(projectId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.projectId, projectId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

type InsertProjectInput = Omit<InsertProject, "id" | "createdAt" | "updatedAt">;

export async function createProject(project: InsertProjectInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const values = {
    ...project,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as InsertProject;

  const result = await db.insert(projects).values(values) as any;
  return Number(result.lastInsertRowid);
}

export async function updateProject(id: number, project: Partial<InsertProject>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const values = {
    ...project,
    updatedAt: new Date(),
  };

  await db.update(projects).set(values).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projects).where(eq(projects.id, id));
}

// ============ RESOURCE QUERIES ============

export async function getAllResources() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(resources).orderBy(resources.name);
}

export async function getResourceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(resources).where(eq(resources.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getResourceByName(name: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(resources).where(eq(resources.name, name)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

type InsertResourceInput = Omit<InsertResource, "id" | "createdAt" | "updatedAt">;

export async function createResource(resource: InsertResourceInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const values = {
    ...resource,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as InsertResource;

  const result = await db.insert(resources).values(values) as any;
  return Number(result.lastInsertRowid);
}

export async function updateResource(id: number, resource: Partial<InsertResource>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const values = {
    ...resource,
    updatedAt: new Date(),
  };

  await db.update(resources).set(values).where(eq(resources.id, id));
}

export async function deleteResource(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Manual Cascade Delete due to SQLite foreign key constraints
  // 1. Delete dependent Daily Allocations first (via Allocation IDs)
  const resourceAllocations = await db.select({ id: allocations.id }).from(allocations).where(eq(allocations.resourceId, id));
  if (resourceAllocations.length > 0) {
    const allocationIds = resourceAllocations.map(a => a.id);
    // Delete daily allocations for these allocations
    // Note: 'inArray' is efficient but requires care with large arrays. SQLite limit is high enough for this use case.
    await db.delete(dailyAllocations).where(sql`${dailyAllocations.allocationId} IN ${allocationIds}`);
  }

  // 2. Delete Allocations
  await db.delete(allocations).where(eq(allocations.resourceId, id));

  // 3. Delete Time Entries
  await db.delete(timeEntries).where(eq(timeEntries.resourceId, id));

  // 4. Finally delete the Resource
  await db.delete(resources).where(eq(resources.id, id));
}

// ============ ALLOCATION QUERIES ============

export async function getAllocations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(allocations);
}

export async function getAllocationsByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(allocations).where(eq(allocations.projectId, projectId));
}

export async function getAllocationsByResourceId(resourceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(allocations).where(eq(allocations.resourceId, resourceId));
}

type InsertAllocationInput = Omit<InsertAllocation, "id" | "createdAt" | "updatedAt">;

export async function createAllocation(allocation: InsertAllocationInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const values = {
    ...allocation,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as InsertAllocation;

  const result = await db.insert(allocations).values(values) as any;
  return Number(result.lastInsertRowid);
}

export async function updateAllocation(id: number, allocation: Partial<InsertAllocation>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const values = {
    ...allocation,
    updatedAt: new Date(),
  };

  await db.update(allocations).set(values).where(eq(allocations.id, id));
}

export async function deleteAllocation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(allocations).where(eq(allocations.id, id));
}

// ============ TIME ENTRY QUERIES ============

export async function getAllTimeEntries() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(timeEntries).orderBy(desc(timeEntries.date));
}

export async function getTimeEntriesByProjectId(projectId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(timeEntries).where(eq(timeEntries.projectId, projectId)).orderBy(desc(timeEntries.date));
}

export async function getTimeEntriesByResourceId(resourceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(timeEntries).where(eq(timeEntries.resourceId, resourceId)).orderBy(desc(timeEntries.date));
}

type InsertTimeEntryInput = Omit<InsertTimeEntry, "id" | "createdAt" | "updatedAt">;

export async function createTimeEntry(entry: InsertTimeEntryInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const values = {
    ...entry,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as InsertTimeEntry;

  const result = await db.insert(timeEntries).values(values) as any;
  return Number(result.lastInsertRowid);
}

export async function updateTimeEntry(id: number, entry: Partial<InsertTimeEntry>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const values = {
    ...entry,
    updatedAt: new Date(),
  };

  await db.update(timeEntries).set(values).where(eq(timeEntries.id, id));
}

export async function deleteTimeEntry(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(timeEntries).where(eq(timeEntries.id, id));
}

// ============ ALERT QUERIES ============

export async function getUnreadAlerts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(alerts).where(eq(alerts.isRead, false)).orderBy(desc(alerts.createdAt));
}

export async function getAllAlerts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(alerts).orderBy(desc(alerts.createdAt));
}

type InsertAlertInput = Omit<InsertAlert, "id" | "createdAt">;

export async function createAlert(alert: InsertAlertInput) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const values = {
    ...alert,
    createdAt: new Date(),
  } as InsertAlert;

  const result = await db.insert(alerts).values(values) as any;
  return Number(result.lastInsertRowid);
}

export async function markAlertAsRead(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(alerts).set({ isRead: true }).where(eq(alerts.id, id));
}

export async function deleteAlert(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(alerts).where(eq(alerts.id, id));
}

// ============ DAILY ALLOCATIONS ============

export async function getDailyAllocations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dailyAllocations);
}

export async function getDailyAllocationsByMonth(year: number, month: number) {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return db
    .select()
    .from(dailyAllocations)
    .where(
      and(
        gte(dailyAllocations.date, startDate),
        lte(dailyAllocations.date, endDate)
      )
    );
}

export async function getDailyAllocationsByResource(resourceId: number, year: number, month: number) {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return db
    .select({
      id: dailyAllocations.id,
      date: dailyAllocations.date,
      hours: dailyAllocations.hours,
      notes: dailyAllocations.notes,
      allocationId: dailyAllocations.allocationId,
      projectId: allocations.projectId,
      projectName: projects.name,
      projectColor: projects.projectId,
    })
    .from(dailyAllocations)
    .innerJoin(allocations, eq(dailyAllocations.allocationId, allocations.id))
    .innerJoin(projects, eq(allocations.projectId, projects.id))
    .where(
      and(
        eq(allocations.resourceId, resourceId),
        gte(dailyAllocations.date, startDate),
        lte(dailyAllocations.date, endDate)
      )
    );
}

// ============ TIME ENTRIES ============



export async function getTimeEntriesByResource(resourceId: number, year: number, month: number) {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  return db
    .select({
      id: timeEntries.id,
      projectId: timeEntries.projectId,
      resourceId: timeEntries.resourceId,
      date: timeEntries.date,
      hours: timeEntries.hours,
      description: timeEntries.description,
      projectName: projects.name,
    })
    .from(timeEntries)
    .leftJoin(projects, eq(timeEntries.projectId, projects.id))
    .where(
      and(
        eq(timeEntries.resourceId, resourceId),
        gte(timeEntries.date, startDate),
        lte(timeEntries.date, endDate)
      )
    );
}

export async function getProjectActualCost(projectId: number) {
  const db = await getDb();
  if (!db) return 0;

  const entries = await db
    .select({
      hours: timeEntries.hours,
      dailyCost: resources.dailyCost,
    })
    .from(timeEntries)
    .leftJoin(resources, eq(timeEntries.resourceId, resources.id))
    .where(eq(timeEntries.projectId, projectId));

  let totalCost = 0;
  for (const entry of entries) {
    if (entry.dailyCost && entry.hours) {
      const hourlyRate = parseFloat(entry.dailyCost) / 8;
      const hours = parseFloat(entry.hours);
      if (!isNaN(hourlyRate) && !isNaN(hours)) {
        totalCost += hourlyRate * hours;
      }
    }
  }
  return totalCost;
}


export async function createDailyAllocation(data: Omit<InsertDailyAllocation, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const values = {
    ...data,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as InsertDailyAllocation;

  const result = await db.insert(dailyAllocations).values(values) as any;
  return { id: Number(result.lastInsertRowid) };
}

export async function deleteDailyAllocation(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(dailyAllocations).where(eq(dailyAllocations.id, id));
}

export async function updateDailyAllocationDate(id: number, date: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(dailyAllocations)
    .set({ date, updatedAt: new Date() })
    .where(eq(dailyAllocations.id, id));
}

// Generate daily allocations from monthly allocation
export async function generateDailyAllocationsFromMonthly(
  allocationId: number,
  year: number,
  month: number,
  startDate?: Date,
  endDate?: Date
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const allocationsList = await getAllocations();
  const allocation = allocationsList.find(a => a.id === allocationId);

  if (!allocation) throw new Error("Allocation not found");

  const daysPerMonth = Number(allocation.daysPerMonth);
  const hoursPerDay = Math.floor(Number(allocation.hoursPerMonth) / daysPerMonth);

  // Determine period boundaries
  const periodStart = startDate ? new Date(startDate) : new Date(year, month - 1, 1);
  const periodEnd = endDate ? new Date(endDate) : new Date(year, month, 0);

  // Ensure period is within the requested month (safety clamp)
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0);

  const effectiveStart = periodStart < monthStart ? monthStart : periodStart;
  const effectiveEnd = periodEnd > monthEnd ? monthEnd : periodEnd;

  // Get existing allocations for this resource in the period to check for conflicts/saturation
  const existingDailyAllocations = await getDailyAllocationsByResource(
    allocation.resourceId,
    year,
    month
  );

  // Identify candidate days
  const candidateDays: { date: Date, hoursAllocated: number }[] = [];

  // Iterate through every day in the effective range
  for (let d = new Date(effectiveStart); d <= effectiveEnd; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    const currentDay = new Date(d);

    // Check existing hours for this day
    const allocationsOnDay = existingDailyAllocations.filter(da =>
      da.date.getDate() === currentDay.getDate() &&
      da.date.getMonth() === currentDay.getMonth()
    );

    const hoursAllocated = allocationsOnDay.reduce((sum, a) => sum + a.hours, 0);

    // Only consider days with capacity
    if (hoursAllocated < 8) {
      candidateDays.push({ date: currentDay, hoursAllocated });
    }
  }

  // Check if we have enough capacity
  // (This is a soft check, we will allocate as much as possible)

  // Smart Distribution: Uniformly distribute `daysPerMonth` across `candidateDays`
  // Create a list of indices to pick
  const daysNeeded = daysPerMonth;
  const pickedDates: Date[] = [];

  if (candidateDays.length === 0) {
    return { success: false, message: "No available working days in the selected period." };
  }

  // Sort candidates by hoursAllocated (prefer empty days)
  // But also want temporal distribution. 
  // Strategy: 
  // 1. Filter for completely empty days first.
  // 2. If enough, distribute uniformly among empty days.
  // 3. If not enough, fill empty days then partially filled days.

  // Simplified "Smart" Strategy:
  // Step size to jump through candidates
  const step = Math.max(1, candidateDays.length / daysNeeded);

  let allocatedCount = 0;

  // We use a set to track used indices from candidateDays preventing double dipping if logic loops
  const usedIndices = new Set<number>();

  // Pass 1: Try to pick uniformly
  for (let i = 0; i < daysNeeded; i++) {
    const targetIndex = Math.floor(i * step);

    // Find nearest available slot to targetIndex
    let bestIndex = -1;
    let minDistance = Infinity;

    for (let j = 0; j < candidateDays.length; j++) {
      if (usedIndices.has(j)) continue;

      const dist = Math.abs(j - targetIndex);
      if (dist < minDistance) {
        minDistance = dist;
        bestIndex = j;
      }
    }

    if (bestIndex !== -1) {
      usedIndices.add(bestIndex);
      pickedDates.push(candidateDays[bestIndex].date);
      allocatedCount++;
    } else {
      break; // No more slots
    }
  }

  // Create daily allocations
  for (const date of pickedDates) {
    // Double check we aren't creating a duplicate for SAME allocation (idempotency)
    // The query above fetches all resource allocations, need to check if THIS allocationId is already there?
    // Current requirement implies "generating", so we might be adding. 
    // To be safe, we typically clear existing usage for this allocation in this period before generating? 
    // User request implies "allocating", let's assume additive but careful.

    await createDailyAllocation({
      allocationId,
      date,
      hours: hoursPerDay,
    });
  }

  return { success: true, daysCreated: allocatedCount };
}
