import type { PrismaClient } from "@prisma/client";

/**
 * Derives an overall "security posture" score (higher is better) from recent scans.
 */

export async function recomputeUserRiskScore(db: PrismaClient, userId: string) {
  const scans = await db.threatScan.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 40,
    include: { result: true },
  });

  const withResults = scans.filter((s) => s.result);
  if (!withResults.length) {
    await db.riskScore.upsert({
      where: { userId },
      create: {
        userId,
        overallScore: 78,
        exposureIndex: 35,
        threatIndex: 25,
        breakdown: {
          note: "Insufficient scan history — default neutral posture",
          sampleSize: 0,
        },
      },
      update: {
        overallScore: 78,
        exposureIndex: 35,
        threatIndex: 25,
        breakdown: {
          note: "Insufficient scan history — default neutral posture",
          sampleSize: 0,
        },
      },
    });
    return;
  }

  const avgThreat = withResults.reduce((a, s) => a + (s.result?.scamProbability ?? 0), 0) / withResults.length;
  const malicious = withResults.filter((s) => s.result?.trustRiskLevel === "MALICIOUS").length;
  const critical = withResults.filter((s) => s.result?.trustRiskLevel === "CRITICAL").length;
  const high = withResults.filter(
    (s) =>
      (s.result?.scamProbability ?? 0) >= 64 &&
      !["MALICIOUS", "CRITICAL"].includes(s.result?.trustRiskLevel ?? "")
  ).length;

  const threatIndex = clamp(
    Math.round(avgThreat * 0.82 + malicious * 12 + critical * 7 + high * 2),
    5,
    95
  );

  const exposureIndex = clamp(
    Math.round(avgThreat * 0.75 + malicious * 6 + critical * 4 + high * 3 + 24),
    10,
    90
  );

  const overallScore = clamp(Math.round(100 - threatIndex * 0.55 - exposureIndex * 0.25 + 12), 18, 96);

  await db.riskScore.upsert({
    where: { userId },
    create: {
      userId,
      overallScore,
      exposureIndex,
      threatIndex,
      breakdown: {
        sampleSize: withResults.length,
        avgThreatProbability: Math.round(avgThreat),
        highRiskScans: high,
        criticalRiskScans: critical,
        maliciousScans: malicious,
      },
    },
    update: {
      overallScore,
      exposureIndex,
      threatIndex,
      breakdown: {
        sampleSize: withResults.length,
        avgThreatProbability: Math.round(avgThreat),
        highRiskScans: high,
        criticalRiskScans: critical,
        maliciousScans: malicious,
      },
    },
  });
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
