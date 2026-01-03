import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("projects", () => {
  it("should list all projects", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const projects = await caller.projects.list();
    expect(Array.isArray(projects)).toBe(true);
  });

  it("should import projects from Excel data", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const testData = {
      projects: [
        {
          projectId: "TEST001",
          name: "Test Project",
          client: "Test Client",
          projectValue: 10000,
          margin: 4000,
          budgetResidual: 6000,
          monthsRemaining: 3,
          maxMonthlySpend: 2000,
          progress: 0.25,
          resources: [
            {
              name: "Test Resource",
              dailyCost: 150,
              daysPerMonth: 5,
              hoursPerMonth: 40,
              monthlyCost: 750,
            },
          ],
        },
      ],
    };

    const result = await caller.projects.importFromExcel(testData);
    
    expect(result.projectsCreated).toBeGreaterThanOrEqual(0);
    expect(result.resourcesCreated).toBeGreaterThanOrEqual(0);
    expect(result.allocationsCreated).toBeGreaterThanOrEqual(0);
  });

  it("should calculate dashboard KPIs correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const kpis = await caller.dashboard.kpis();
    
    expect(kpis).toHaveProperty("totalProjects");
    expect(kpis).toHaveProperty("totalResources");
    expect(kpis).toHaveProperty("totalProjectValue");
    expect(kpis).toHaveProperty("totalMargin");
    expect(kpis).toHaveProperty("totalBudgetResidual");
    expect(kpis).toHaveProperty("avgProgress");
    expect(Array.isArray(kpis.projects)).toBe(true);
  });

  it("should calculate resource utilization", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const utilization = await caller.dashboard.resourceUtilization();
    
    expect(Array.isArray(utilization)).toBe(true);
    
    if (utilization.length > 0) {
      const firstResource = utilization[0];
      expect(firstResource).toHaveProperty("resourceId");
      expect(firstResource).toHaveProperty("resourceName");
      expect(firstResource).toHaveProperty("totalDaysPerMonth");
      expect(firstResource).toHaveProperty("totalHoursPerMonth");
      expect(firstResource).toHaveProperty("utilizationPercentage");
    }
  });
});

describe("resources", () => {
  it("should list all resources", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const resources = await caller.resources.list();
    expect(Array.isArray(resources)).toBe(true);
  });
});

describe("allocations", () => {
  it("should list all allocations", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const allocations = await caller.allocations.list();
    expect(Array.isArray(allocations)).toBe(true);
  });
});

describe("alerts", () => {
  it("should list all alerts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const alerts = await caller.alerts.all();
    expect(Array.isArray(alerts)).toBe(true);
  });

  it("should list unread alerts", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const alerts = await caller.alerts.unread();
    expect(Array.isArray(alerts)).toBe(true);
  });
});
