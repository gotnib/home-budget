import { prisma } from "@/lib/prisma";

export type HouseholdRole = "queen" | "worker" | "hive";

export interface HouseholdContext {
  ownerId: string;
  role: HouseholdRole;
}

export async function getHouseholdContext(userId: string): Promise<HouseholdContext> {
  try {
    const profile = await prisma.userProfile.findUnique({
      where: { id: userId },
      select: { householdId: true, householdRole: true },
    });

    if (profile?.householdId) {
      const household = await prisma.household.findUnique({
        where: { id: profile.householdId },
        select: { ownerId: true },
      });
      if (household) {
        return {
          ownerId: household.ownerId,
          role: (profile.householdRole as "worker" | "hive") ?? "hive",
        };
      }
    }
  } catch {
    // Column doesn't exist yet (migration pending) — fall through to solo mode
  }

  return { ownerId: userId, role: "queen" };
}

export function canWrite(role: HouseholdRole): boolean {
  return role === "queen" || role === "worker";
}
