import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middleware/errorHandler.js";

export async function listFeed(_req: Request, res: Response) {
  const alerts = await prisma.threatAlert.findMany({
    orderBy: { publishedAt: "desc" },
    take: 50,
    select: {
      id: true,
      title: true,
      description: true,
      severity: true,
      category: true,
      source: true,
      publishedAt: true,
    },
  });
  return res.json({ alerts });
}

export async function getFeedDetail(req: Request, res: Response) {
  const { id } = req.params;
  const alert = await prisma.threatAlert.findUnique({ where: { id } });
  if (!alert) throw new AppError("Alert not found", 404);
  return res.json({ alert });
}
