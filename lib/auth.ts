import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function getCurrentUser() {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  return user;
}

export async function ensureUserProfile(userId: string, email: string) {
  const profile = await prisma.userProfile.upsert({
    where: { id: userId },
    update: {},
    create: {
      id: userId,
      email: email,
    },
  });

  return profile;
}

export async function getAuthenticatedUserWithProfile() {
  const user = await requireUser();

  const profile = await ensureUserProfile(
    user.id,
    user.email ?? ""
  );

  return { user, profile };
}
