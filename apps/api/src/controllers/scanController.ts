import type { Request, Response } from "express";
import type { ScanType } from "@prisma/client";
import { AppError } from "../middleware/errorHandler.js";
import { prisma } from "../lib/prisma.js";
import { runRuleEngine } from "../services/ruleEngine.js";
import { generateAnalystExplanation } from "../services/aiExplain.js";
import { logActivity } from "../services/activityLog.js";
import { recomputeUserRiskScore } from "../services/riskScoreService.js";

export async function createScan(req: Request, res: Response) {
  const userId = req.user!.userId;
  const { scanType, rawInput } = req.body as { scanType: ScanType; rawInput: string };

  if (!rawInput?.trim()) throw new AppError("rawInput is required", 400);

  const rules = runRuleEngine(rawInput.trim(), scanType);
  const ai = await generateAnalystExplanation(scanType, rawInput.trim(), rules);

  const scan = await prisma.threatScan.create({
    data: {
      userId,
      scanType,
      rawInput: rawInput.trim(),
      status: "COMPLETED",
      result: {
        create: {
          scamProbability: rules.scamProbability,
          trustRiskLevel: rules.trustRiskLevel,
          confidenceScore: rules.confidenceScore,
          attackClassifications: rules.attackClassifications as object,
          ruleSignals: rules.signals as object,
          phishingIndicators: rules.phishingIndicators,
          manipulationIndicators: rules.manipulationIndicators,
          keywordAnalysis: rules.keywordAnalysis as object,
          recommendedActions: rules.recommendedActions,
          aiExplanation: ai.explanation,
          aiManipulationSummary: ai.manipulationSummary,
          aiSeverityExplanation: ai.severityExplanation,
        },
      },
    },
    include: { result: true },
  });

  await logActivity(userId, "THREAT_SCAN", { scanId: scan.id, scanType });
  await recomputeUserRiskScore(prisma, userId);

  return res.status(201).json({ scan });
}

export async function listScans(req: Request, res: Response) {
  const userId = req.user!.userId;
  const take = Math.min(100, Math.max(1, Number(req.query.limit) || 30));
  const scans = await prisma.threatScan.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      result: {
        select: {
          scamProbability: true,
          trustRiskLevel: true,
          phishingIndicators: true,
        },
      },
    },
  });
  return res.json({ scans });
}

export async function getScan(req: Request, res: Response) {
  const userId = req.user!.userId;
  const { id } = req.params;
  const scan = await prisma.threatScan.findFirst({
    where: { id, userId },
    include: { result: true },
  });
  if (!scan) throw new AppError("Scan not found", 404);
  return res.json({ scan });
}

export async function deleteScan(req: Request, res: Response) {
  const userId = req.user!.userId;
  const { id } = req.params;

  const scan = await prisma.threatScan.findFirst({
    where: { id, userId },
    select: { id: true, scanType: true },
  });

  if (!scan) throw new AppError("Scan not found", 404);

  await prisma.threatScan.delete({
    where: { id: scan.id },
  });

  await logActivity(userId, "THREAT_SCAN_DELETED", { scanId: scan.id, scanType: scan.scanType });
  await recomputeUserRiskScore(prisma, userId);

  return res.status(204).send();
}
