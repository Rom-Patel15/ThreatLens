import type { ScanType } from "@prisma/client";
import { env } from "../config/env.js";
import type { RuleEngineResult } from "./ruleEngine.js";

export type AnalystExplanation = {
  explanation: string;
  manipulationSummary: string;
  severityExplanation: string;
};

function fallbackAnalyst(
  rules: RuleEngineResult,
  scanType: ScanType,
  redactedSnippet: string
): AnalystExplanation {
  const topPhish = rules.phishingIndicators.slice(0, 4).join("; ") || "Limited phishing cues";
  const topManip = rules.manipulationIndicators.slice(0, 3).join("; ") || "Limited pressure cues";
  const classes = rules.attackClassifications.join(", ") || "General suspicious content";
  return {
    explanation: `Deterministic assessment (${scanType}): threat score ${rules.scamProbability}/100, confidence ${Math.round(rules.confidenceScore)}%, tier ${rules.trustRiskLevel}. Classifications: ${classes}. Signals: ${topPhish}. Snippet: "${redactedSnippet}".`,
    manipulationSummary: `Influence tactics observed: ${topManip}. Follow the prioritized containment steps below; escalate to SOC if enterprise credentials may be impacted.`,
    severityExplanation: `${rules.trustRiskLevel} maps to automated scoring bands. Confidence reflects how many independent signal families agreed (${Math.round(rules.confidenceScore)}%).`,
  };
}

function redactSnippet(input: string, max = 400): string {
  const trimmed = input.replace(/\s+/g, " ").trim();
  return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max)}…`;
}

function buildPayload(scanType: ScanType, rawInput: string, rules: RuleEngineResult) {
  return {
    scanType,
    redactedContent: redactSnippet(rawInput, 1200),
    ruleSummary: {
      scamProbability: rules.scamProbability,
      trustRiskLevel: rules.trustRiskLevel,
      confidenceScore: rules.confidenceScore,
      attackClassifications: rules.attackClassifications,
      phishingIndicators: rules.phishingIndicators,
      manipulationIndicators: rules.manipulationIndicators,
      keywordAnalysis: rules.keywordAnalysis,
      recommendedActions: rules.recommendedActions,
      signals: rules.signals,
    },
  };
}

async function explainWithOpenAI(
  scanType: ScanType,
  rawInput: string,
  rules: RuleEngineResult
): Promise<AnalystExplanation> {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("no_openai");

  const system = `You are a senior SOC analyst assistant for ThreatLens.
Output strict JSON with keys:
- explanation (string, 4-7 sentences): WHY this content is risky, referencing concrete signals.
- manipulationSummary (string, 2-5 sentences): psychological / social engineering tactics IF supported by evidence.
- severityExplanation (string, 2-4 sentences): interpret trust tier and confidence for an executive reader.
Never behave as a generic chatbot. Do not invent URLs or IOCs not implied by the data.`;

  const userPayload = buildPayload(scanType, rawInput, rules);

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: env.OPENAI_MODEL,
      temperature: 0.25,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: JSON.stringify(userPayload) },
      ],
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`openai_http_${res.status}: ${t}`);
  }
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("openai_empty");
  const parsed = JSON.parse(content) as AnalystExplanation;
  if (!parsed.explanation || !parsed.manipulationSummary || !parsed.severityExplanation) {
    throw new Error("openai_bad_shape");
  }
  return parsed;
}

async function explainWithGemini(
  scanType: ScanType,
  rawInput: string,
  rules: RuleEngineResult
): Promise<AnalystExplanation> {
  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("no_gemini");

  const prompt = `Return ONLY JSON with keys explanation, manipulationSummary, severityExplanation (all strings).
You are a SOC analyst assistant. Be factual.
Payload: ${JSON.stringify(buildPayload(scanType, rawInput, rules))}`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.25, responseMimeType: "application/json" },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`gemini_http_${res.status}: ${t}`);
  }
  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("gemini_empty");
  const parsed = JSON.parse(text) as AnalystExplanation;
  if (!parsed.explanation || !parsed.manipulationSummary || !parsed.severityExplanation) {
    throw new Error("gemini_bad_shape");
  }
  return parsed;
}

export async function generateAnalystExplanation(
  scanType: ScanType,
  rawInput: string,
  rules: RuleEngineResult
): Promise<AnalystExplanation> {
  const snippet = redactSnippet(rawInput, 400);

  try {
    if (env.OPENAI_API_KEY) {
      return await explainWithOpenAI(scanType, rawInput, rules);
    }
  } catch (e) {
    console.warn("OpenAI analyst explanation failed, trying Gemini/fallback:", e);
  }

  try {
    if (env.GEMINI_API_KEY) {
      return await explainWithGemini(scanType, rawInput, rules);
    }
  } catch (e) {
    console.warn("Gemini analyst explanation failed, using fallback:", e);
  }

  return fallbackAnalyst(rules, scanType, snippet);
}
