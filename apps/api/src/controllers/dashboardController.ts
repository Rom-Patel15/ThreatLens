import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export async function getDashboard(req: Request, res: Response) {
  const userId = req.user!.userId;

  const [riskScore, recentScans, activity, alerts] = await Promise.all([
    prisma.riskScore.findUnique({ where: { userId } }),
    prisma.threatScan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: {
        result: {
          select: {
            scamProbability: true,
            trustRiskLevel: true,
            phishingIndicators: true,
          },
        },
      },
    }),
    prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.threatAlert.findMany({
      orderBy: { publishedAt: "desc" },
      take: 8,
    }),
  ]);

  const allScans = await prisma.threatScan.findMany({
    where: { userId },
    include: { result: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const byType: Record<string, number> = {};
  const byRisk: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0, MALICIOUS: 0 };
  const trendMap = new Map<string, { sum: number; n: number }>();

  for (const s of allScans) {
    byType[s.scanType] = (byType[s.scanType] ?? 0) + 1;
    const lvl = s.result?.trustRiskLevel;
    if (lvl && lvl in byRisk) byRisk[lvl] += 1;
    const day = s.createdAt.toISOString().slice(0, 10);
    const prob = s.result?.scamProbability ?? 0;
    const cur = trendMap.get(day) ?? { sum: 0, n: 0 };
    cur.sum += prob;
    cur.n += 1;
    trendMap.set(day, cur);
  }

  let trend = [...trendMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-14)
    .map(([date, v]) => ({ date, avgThreat: v.n ? Math.round(v.sum / v.n) : 0 }));

  if (!trend.length) {
    const today = new Date();
    trend = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      return { date: d.toISOString().slice(0, 10), avgThreat: 0 };
    });
  }

  let riskDistribution = Object.entries(byRisk).map(([name, value]) => ({ name, value }));
  if (!riskDistribution.some((r) => r.value > 0)) {
    riskDistribution = [{ name: "NO_SCANS", value: 1 }];
  }

  return res.json({
    riskScore: riskScore ?? null,
    recentScans,
    activity,
    alerts,
    charts: {
      scansByType:
        Object.keys(byType).length > 0
          ? Object.entries(byType).map(([name, value]) => ({ name, value }))
          : [{ name: "NONE", value: 0 }],
      riskDistribution,
      threatTrend: trend,
    },
  });
}
