import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import { hashPassword, verifyPassword } from "./auth-local";
import { sdk } from "./_core/sdk";
import { nanoid } from "nanoid";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);

      // Attempt to clear with standard options
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });

      // Also attempt to clear with "old" conflicting options (SameSite=None) to ensure cleanup
      // This handles cases where a cookie was set with previous configuration
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, sameSite: "none", secure: true, maxAge: -1 });
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, sameSite: "lax", secure: false, maxAge: -1 });

      return { success: true } as const;
    }),

    register: publicProcedure
      .input(z.object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
      }))
      .mutation(async ({ input, ctx }) => {
        const existingUser = await db.getUserByEmail(input.email);
        if (existingUser) {
          throw new TRPCError({ code: "CONFLICT", message: "Email already in use" });
        }

        const hashedPassword = await hashPassword(input.password);
        const openId = nanoid();

        await db.upsertUser({
          openId,
          name: input.name,
          email: input.email,
          password: hashedPassword,
          loginMethod: "email",
          lastSignedIn: new Date(),
        });

        const sessionToken = await sdk.createSessionToken(openId, {
          name: input.name,
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true };
      }),

    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user || !user.password) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }

        const isValid = await verifyPassword(input.password, user.password);
        if (!isValid) {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid email or password" });
        }

        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name || "",
          expiresInMs: ONE_YEAR_MS,
        });

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        return { success: true };
      }),

    updateProfile: protectedProcedure
      .input(z.object({
        name: z.string().optional(),
        jobTitle: z.string().optional(),
        avatarUrl: z.string().optional(),
        currentPassword: z.string().optional(),
        newPassword: z.string().min(6).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = ctx.user;
        if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

        // If changing password, verify old one
        if (input.newPassword) {
          if (!input.currentPassword) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Current password required to set new password" });
          }
          // Only if user has a password set (social login users might not)
          if (user.password) {
            const isValid = await verifyPassword(input.currentPassword, user.password);
            if (!isValid) {
              throw new TRPCError({ code: "BAD_REQUEST", message: "Incorrect current password" });
            }
          }
        }

        const updates: any = {
          openId: user.openId,
        };

        if (input.name) updates.name = input.name;
        if (input.jobTitle) updates.jobTitle = input.jobTitle;
        if (input.avatarUrl) updates.avatarUrl = input.avatarUrl;
        if (input.newPassword) {
          updates.password = await hashPassword(input.newPassword);
        }

        await db.upsertUser(updates);

        return { success: true };
      }),
  }),

  // ============ PROJECT ROUTES ============
  projects: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllProjects();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const project = await db.getProjectById(input.id);
        if (!project) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
        }
        return project;
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.string(),
        name: z.string(),
        client: z.string(),
        projectValue: z.string(),
        margin: z.string(),
        budgetResidual: z.string(),
        monthsRemaining: z.number(),
        maxMonthlySpend: z.string(),
        progress: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createProject(input);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        projectId: z.string().optional(),
        name: z.string().optional(),
        client: z.string().optional(),
        projectValue: z.string().optional(),
        margin: z.string().optional(),
        budgetResidual: z.string().optional(),
        monthsRemaining: z.number().optional(),
        maxMonthlySpend: z.string().optional(),
        progress: z.string().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateProject(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteProject(input.id);
        return { success: true };
      }),

    // Import from Excel data
    importFromExcel: protectedProcedure
      .input(z.object({
        projects: z.array(z.object({
          projectId: z.string(),
          name: z.string(),
          client: z.string(),
          projectValue: z.number(),
          margin: z.number(),
          budgetResidual: z.number(),
          monthsRemaining: z.number(),
          maxMonthlySpend: z.number(),
          progress: z.number(),
          resources: z.array(z.object({
            name: z.string(),
            dailyCost: z.number(),
            daysPerMonth: z.number(),
            hoursPerMonth: z.number(),
            monthlyCost: z.number(),
          })),
        })),
      }))
      .mutation(async ({ input }) => {
        const results = { projectsCreated: 0, resourcesCreated: 0, allocationsCreated: 0 };

        for (const projectData of input.projects) {
          // Check if project already exists
          const existing = await db.getProjectByProjectId(projectData.projectId);
          let projectDbId: number;
          if (existing) {
            projectDbId = existing.id;
          } else {
            projectDbId = await db.createProject({
              projectId: projectData.projectId,
              name: projectData.name,
              client: projectData.client,
              projectValue: projectData.projectValue.toString(),
              margin: projectData.margin.toString(),
              budgetResidual: projectData.budgetResidual.toString(),
              monthsRemaining: projectData.monthsRemaining,
              maxMonthlySpend: projectData.maxMonthlySpend.toString(),
              progress: projectData.progress.toString(),
            });
            results.projectsCreated++;
          }

          // Create or get resources and allocations
          for (const resourceData of projectData.resources) {
            let resource = await db.getResourceByName(resourceData.name);
            let resourceId: number;

            if (!resource) {
              resourceId = await db.createResource({
                name: resourceData.name,
                dailyCost: resourceData.dailyCost.toString(),
                isActive: true,
              });
              results.resourcesCreated++;
            } else {
              resourceId = resource.id;
            }

            // Create allocation
            await db.createAllocation({
              projectId: projectDbId,
              resourceId,
              daysPerMonth: resourceData.daysPerMonth,
              hoursPerMonth: resourceData.hoursPerMonth,
              monthlyCost: resourceData.monthlyCost.toString(),
            });
            results.allocationsCreated++;
          }
        }

        return results;
      }),
  }),

  // ============ RESOURCE ROUTES ============
  resources: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllResources();
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const resource = await db.getResourceById(input.id);
        if (!resource) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Resource not found" });
        }
        return resource;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string(),
        dailyCost: z.string(),
        email: z.string().optional(),
        role: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createResource(input);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        dailyCost: z.string().optional(),
        email: z.string().optional(),
        role: z.string().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateResource(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteResource(input.id);
        return { success: true };
      }),
  }),

  // ============ ALLOCATION ROUTES ============
  allocations: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllocations();
    }),

    byProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAllocationsByProjectId(input.projectId);
      }),

    byResource: protectedProcedure
      .input(z.object({ resourceId: z.number() }))
      .query(async ({ input }) => {
        return await db.getAllocationsByResourceId(input.resourceId);
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        resourceId: z.number(),
        daysPerMonth: z.number(),
        hoursPerMonth: z.number(),
        monthlyCost: z.string(),
        totalDays: z.number().optional(),
        totalHours: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createAllocation(input);
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        projectId: z.number().optional(),
        resourceId: z.number().optional(),
        daysPerMonth: z.number().optional(),
        hoursPerMonth: z.number().optional(),
        monthlyCost: z.string().optional(),
        totalDays: z.number().optional(),
        totalHours: z.number().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateAllocation(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAllocation(input.id);
        return { success: true };
      }),

    // Reallocate resource from one project to another
    reallocate: protectedProcedure
      .input(z.object({
        allocationId: z.number(),
        newProjectId: z.number(),
      }))
      .mutation(async ({ input }) => {
        // Get current allocation
        const allocations = await db.getAllocations();
        const allocation = allocations.find(a => a.id === input.allocationId);

        if (!allocation) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Allocation not found" });
        }

        // Update allocation with new project
        await db.updateAllocation(input.allocationId, {
          projectId: input.newProjectId,
        });

        return { success: true };
      }),
  }),

  // ============ TIME ENTRY ROUTES ============
  timeEntries: router({
    list: protectedProcedure.query(async () => {
      return await db.getAllTimeEntries();
    }),
    byProject: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTimeEntriesByProjectId(input.projectId);
      }),

    byResource: protectedProcedure
      .input(z.object({ resourceId: z.number() }))
      .query(async ({ input }) => {
        return await db.getTimeEntriesByResourceId(input.resourceId);
      }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        resourceId: z.number(),
        date: z.date(),
        hours: z.number(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createTimeEntry({
          ...input,
          hours: input.hours.toString(),
        });
        return { id };
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        projectId: z.number().optional(),
        resourceId: z.number().optional(),
        date: z.date().optional(),
        hours: z.string().optional(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        await db.updateTimeEntry(id, data);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteTimeEntry(input.id);
        return { success: true };
      }),
  }),

  // ============ DAILY ALLOCATIONS / CALENDAR ROUTES ============
  calendar: router({
    byResource: protectedProcedure
      .input(z.object({
        resourceId: z.number(),
        year: z.number(),
        month: z.number(),
      }))
      .query(async ({ input }) => {
        const dailyAllocations = await db.getDailyAllocationsByResource(input.resourceId, input.year, input.month);
        const timeEntries = await db.getTimeEntriesByResource(input.resourceId, input.year, input.month);
        return { dailyAllocations, timeEntries };
      }),

    generate: protectedProcedure
      .input(z.object({
        allocationId: z.number(),
        year: z.number(),
        month: z.number(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }))
      .mutation(async ({ input }) => {
        return db.generateDailyAllocationsFromMonthly(
          input.allocationId,
          input.year,
          input.month,
          input.startDate,
          input.endDate
        );
      }),

    updateDate: protectedProcedure
      .input(z.object({
        id: z.number(),
        date: z.date(),
      }))
      .mutation(async ({ input }) => {
        await db.updateDailyAllocationDate(input.id, input.date);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({
        id: z.number(),
      }))
      .mutation(async ({ input }) => {
        await db.deleteDailyAllocation(input.id);
        return { success: true };
      }),
  }),

  // ============ ALERT ROUTES ============
  alerts: router({
    unread: protectedProcedure.query(async () => {
      return await db.getUnreadAlerts();
    }),

    all: protectedProcedure.query(async () => {
      return await db.getAllAlerts();
    }),

    create: protectedProcedure
      .input(z.object({
        projectId: z.number(),
        type: z.enum(["budget_exceeded", "deadline_approaching", "resource_overload"]),
        message: z.string(),
        severity: z.enum(["low", "medium", "high"]).optional(),
      }))
      .mutation(async ({ input }) => {
        const id = await db.createAlert(input);
        return { id };
      }),

    markAsRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.markAlertAsRead(input.id);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteAlert(input.id);
        return { success: true };
      }),
  }),

  // ============ DASHBOARD ROUTES ============
  dashboard: router({
    kpis: protectedProcedure.query(async () => {
      const projects = await db.getAllProjects();
      const resources = await db.getAllResources();
      const dailyAllocations = await db.getDailyAllocations();
      const timeEntries = await db.getAllTimeEntries();

      // Calculate aggregate KPIs
      const totalProjectValue = projects.reduce((sum, p) => sum + Number(p.projectValue), 0);
      const totalMargin = projects.reduce((sum, p) => sum + Number(p.margin), 0);
      // @ts-ignore
      const totalRealMargin = projects.reduce((sum, p) => sum + Number(p.realMargin || 0), 0);
      const totalBudgetResidual = projects.reduce((sum, p) => sum + Number(p.budgetResidual), 0);
      const avgProgress = projects.length > 0
        ? projects.reduce((sum, p) => sum + Number(p.progress), 0) / projects.length
        : 0;

      // Calculate Hours
      const totalAllocatedHours = dailyAllocations.reduce((sum, da) => sum + da.hours, 0);
      // @ts-ignore
      const totalActualHours = timeEntries.reduce((sum, te) => sum + Number(te.hours), 0);

      const completedProjects = projects.filter(p => Number(p.progress) >= 100);
      const activeProjects = projects.filter(p => Number(p.progress) > 0 && Number(p.progress) < 100);

      return {
        totalProjects: activeProjects.length,
        totalCompletedProjects: completedProjects.length,
        totalResources: resources.filter(r => r.isActive).length,
        totalProjectValue,
        totalMargin,
        totalRealMargin,
        totalBudgetResidual,
        avgProgress,
        totalAllocatedHours,
        totalActualHours,
        projects: projects.map(p => ({
          id: p.id,
          projectId: p.projectId,
          name: p.name,
          client: p.client,
          projectValue: Number(p.projectValue),
          margin: Number(p.margin),
          // @ts-ignore
          realMargin: Number(p.realMargin || 0),
          // @ts-ignore
          actualCost: Number(p.actualCost || 0),
          budgetResidual: Number(p.budgetResidual),
          monthsRemaining: p.monthsRemaining,
          maxMonthlySpend: Number(p.maxMonthlySpend),
          progress: Number(p.progress),
          marginPercentage: Number(p.projectValue) > 0
            ? (Number(p.margin) / Number(p.projectValue)) * 100
            : 0,
          realMarginPercentage: Number(p.projectValue) > 0
            // @ts-ignore
            ? (Number(p.realMargin || 0) / Number(p.projectValue)) * 100
            : 0,
        })),
      };
    }),

    resourceUtilization: protectedProcedure.query(async () => {
      const resources = await db.getAllResources();
      const allocations = await db.getAllocations();
      const timeEntries = await db.getAllTimeEntries();

      const utilization = await Promise.all(resources.map(async (resource) => {
        const resourceAllocations = allocations.filter(a => a.resourceId === resource.id);
        const resourceEntries = timeEntries.filter(te => te.resourceId === resource.id);

        const totalDaysPerMonth = resourceAllocations.reduce((sum, a) => sum + a.daysPerMonth, 0);
        const totalHoursPerMonth = resourceAllocations.reduce((sum, a) => sum + a.hoursPerMonth, 0);
        const totalMonthlyCost = resourceAllocations.reduce((sum, a) => sum + Number(a.monthlyCost), 0);
        const totalActualHours = resourceEntries.reduce((sum, te) => sum + Number(te.hours), 0);

        // Assuming 22 working days * 8 hours = 176 hours per month capacity
        const monthlyCapacityHours = 22 * 8;

        return {
          resourceId: resource.id,
          resourceName: resource.name,
          dailyCost: Number(resource.dailyCost),
          totalDaysPerMonth,
          totalHoursPerMonth,
          totalMonthlyCost,
          totalActualHours,
          projectCount: resourceAllocations.length,
          utilizationPercentage: (totalDaysPerMonth / 22) * 100, // Allocated Days / 22
          actualUtilizationPercentage: (totalActualHours / monthlyCapacityHours) * 100,
        };
      }));

      return utilization;
    }),
  }),
});

export type AppRouter = typeof appRouter;
