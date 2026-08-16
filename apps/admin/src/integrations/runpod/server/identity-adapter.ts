import "server-only";
import { auth } from "@clerk/nextjs/server";
import type { RunpodPolicyContext } from "./policy";

export async function resolveRunpodPolicyContext(): Promise<RunpodPolicyContext> {
  const { userId } = await auth();
  if (!userId) {
    throw Object.assign(new Error("Unauthenticated"), { status: 401 });
  }
  return { actorId: userId, role: "owner" };
}
