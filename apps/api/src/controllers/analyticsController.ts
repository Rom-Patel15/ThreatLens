import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function getRiskScore(req: Request, res: Response) {
  const userId = req.user!.userId;
  const riskScore = await prisma.riskScore.findUnique({ where: { userId } });
  return res.json({ riskScore: riskScore ?? null });
}
