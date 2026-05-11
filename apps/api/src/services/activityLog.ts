import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export async function logActivity(
  userId: string,
  action: string,
  metadata?: Prisma.InputJsonValue
) {
  await prisma.activityLog.create({
    data: { userId, action, metadata },
  });
}
