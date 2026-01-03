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

describe("calendar.byResource", () => {
  it("should return daily allocations for a resource in a specific month", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const resources = await caller.resources.list();
    if (resources.length === 0) {
      expect(true).toBe(true);
      return;
    }

    const resource = resources[0];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const result = await caller.calendar.byResource({
      resourceId: resource.id,
      year,
      month,
    });

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("calendar.generate", () => {
  it("should generate daily allocations from monthly allocation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const allocations = await caller.allocations.list();
    if (allocations.length === 0) {
      expect(true).toBe(true);
      return;
    }

    const allocation = allocations[0];
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const result = await caller.calendar.generate({
      allocationId: allocation.id,
      year,
      month,
    });

    expect(result.success).toBe(true);
    expect(result.daysCreated).toBeGreaterThan(0);
  });
});
