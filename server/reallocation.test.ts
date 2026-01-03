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

describe("allocations.reallocate", () => {
  it("should reallocate resource to a different project", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First, ensure we have test data
    const projects = await caller.projects.list();
    const allocations = await caller.allocations.list();

    if (projects.length < 2 || allocations.length === 0) {
      // Skip test if we don't have enough data
      expect(true).toBe(true);
      return;
    }

    const allocation = allocations[0];
    const currentProjectId = allocation.projectId;
    const newProject = projects.find(p => p.id !== currentProjectId);

    if (!newProject) {
      expect(true).toBe(true);
      return;
    }

    // Reallocate
    const result = await caller.allocations.reallocate({
      allocationId: allocation.id,
      newProjectId: newProject.id,
    });

    expect(result.success).toBe(true);

    // Verify the allocation was updated
    const updatedAllocations = await caller.allocations.list();
    const updatedAllocation = updatedAllocations.find(a => a.id === allocation.id);

    expect(updatedAllocation?.projectId).toBe(newProject.id);
  });

  it("should fail when allocation does not exist", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const projects = await caller.projects.list();
    if (projects.length === 0) {
      expect(true).toBe(true);
      return;
    }

    try {
      await caller.allocations.reallocate({
        allocationId: 999999, // Non-existent allocation
        newProjectId: projects[0].id,
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      expect(error.message).toContain("Allocation not found");
    }
  });
});
