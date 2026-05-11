import type { ScanType } from "@prisma/client";

/**
 * Hybrid rule engine — deterministic scoring before AI narrative.
 * Tuned for resume-grade realism: obvious phishing should land HIGH/MALICIOUS with high confidence.
 */

export const ATTACK_TAXONOMY = [
  "PHISHING",
  "IMPERSONATION",
  "CREDENTIAL_THEFT",
  "SCAM",
  "MALWARE_DELIVERY",
  "SOCIAL_ENGINEERING",
] as const;
export type AttackClassification = (typeof ATTACK_TAXONOMY)[number];

const PHISHING_KEYWORDS = [
  "verify your account",
  "confirm your identity",
  "unusual activity",
  "suspended",
  "locked account",
  "reset password",
  "click here to restore",
  "validate your payment",
  "security alert",
  "login to avoid closure",
  "update your billing",
  "wire transfer",
  "gift card",
  "send bitcoin",
  "crypto wallet",
  "seed phrase",
  "irs refund",
  "social security",
  "tax refund",
  "invoice attached",
  "document requires signature",
  "verify bank account",
  "confirm payment method",
  "update account information",
  "wallet recovery",
  "recover account",
  "account compromised",
  "verify credentials",
  "confirm identity",
  "authenticate now",
  "private key",
  "recovery phrase",
  "banking details",
  "routing number",
  "account number",
];

const URGENCY_FEAR = [
  "urgent",
  "immediately",
  "within 24 hours",
  "act now",
  "expires today",
  "last chance",
  "time sensitive",
  "do not delay",
  "right now",
  "asap",
  "legal action",
  "arrest warrant",
  "account will be deleted",
];

const SCAM_GIVEAWAY = [
  "you have won",
  "congratulations",
  "claim your prize",
  "claim your",
  "free iphone",
  "double your crypto",
  "guaranteed returns",
  "no risk investment",
  "send fee to unlock",
  "crypto giveaway",
  "claim free eth",
  "claim free bitcoin",
  "bitcoin giveaway",
  "ethereum airdrop",
  "free nft",
  "limited time offer",
  "exclusive offer",
];

const CRYPTO_SCAM = [
  "metamask",
  "wallet connect",
  "seed phrase",
  "private key",
  "airdrop claim",
  "liquidity pool",
  "mining contract",
  "wallet seed",
  "mnemonic phrase",
  "recovery seed",
  "secret backup phrase",
  "crypto wallet compromised",
  "verify wallet",
  "recover wallet",
];

const FAKE_VERIFICATION = [
  "verify your identity with a photo",
  "upload id front and back",
  "confirm card cvv",
  "provide otp code",
  "read this code back to us",
];

const BANKING_IMPERSONATION = [
  /bank.*verification/i,
  /verify.*bank.*(account|credentials)/i,
  /paypal.*confirm/i,
  /apple.*payment/i,
  /google.*account.*locked/i,
  /microsoft.*account.*suspended/i,
];

const WALLET_THREATS = [
  /seed.*(phrase|word)/i,
  /recovery.*(phrase|code|key)/i,
  /wallet.*(seed|recovery|private)/i,
  /mnemonic/i,
  /secret.*(backup|recovery)/i,
  /private.*(key|seed)/i,
  /wallet.*(compromised|hacked|breach)/i,
];

const MALWARE_ATTACHMENTS = [
  /\.zip/i,
  /invoice.*\.zip/i,
  /document.*\.zip/i,
  /payment.*\.zip/i,
  /receipt.*\.zip/i,
  /executable/i,
  /\.exe/i,
  /\.scr/i,
  /\.bat/i,
];

const FINANCIAL_BAIT = [
  "pay",
  "payment",
  "send money",
  "send payment",
  "transfer funds",
  "wire",
  "purchase",
  "buy",
  "fee",
  "cost",
  "price",
];

const PREMIUM_SERVICE_OFFERS = [
  "free premium",
  "free access",
  "free streaming",
  "premium account",
  "paid service",
  "unlock premium",
  "get premium",
  "premium membership",
  "full access",
  "exclusive access",
  "unlimited access",
  "free trial",
];

const SOCIAL_LOGIN_ABUSE = [
  /login\s*(with\s*)?(google|facebook|apple|microsoft)/i,
  /sign\s*in\s*(with\s*)?(google|facebook|apple|microsoft)/i,
  /authenticate\s*(via\s*)?(google|facebook|apple)/i,
  /use\s*(your\s*)?(google|facebook|apple)\s*account/i,
  /google.*credentials/i,
  /facebook.*login/i,
  /apple.*id/i,
];

const SURVEY_VERIFICATION_FUNNEL = [
  "complete survey",
  "survey required",
  "verification required",
  "verify before",
  "verify to continue",
  "survey to continue",
  "answer questions",
  "fill survey",
  "complete verification",
  "confirm before",
  "proceed after",
];

const ACCESS_UNLOCK_CONDITIONAL = [
  "unlock premium",
  "unlock access",
  "unlock content",
  "access after",
  "claim access",
  "claim premium",
  "get access",
  "unlock now",
  "activate account",
];

const STREAMING_SERVICE_IMPERSONATION = [
  /netflix/i,
  /hulu/i,
  /disney\+/i,
  /spotify/i,
  /youtube.*(premium|red)/i,
  /amazon.*(prime|video)/i,
  /streaming.*service/i,
  /video.*subscription/i,
];

const CREDENTIAL_HARVEST = [
  /sign\s*in\s*to\s*(your\s*)?(account|paypal|apple|google|microsoft|amazon)/i,
  /verify\s*(your\s*)?(bank|paypal|wallet|credentials)/i,
  /update\s*(your\s*)?payment\s*method/i,
  /confirm\s*(your\s*)?(credentials|password)/i,
  /enter\s*(your\s*)?(ssn|social security number)/i,
];

const SUSPICIOUS_TLDS = new Set([
  "tk",
  "ml",
  "ga",
  "cf",
  "gq",
  "xyz",
  "top",
  "work",
  "click",
  "zip",
  "review",
  "buzz",
  "cfd",
  "loan",
  "support",
]);

const URL_SHORTENERS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "ow.ly",
  "buff.ly",
  "is.gd",
  "cutt.ly",
  "rebrand.ly",
  "short.link",
  "tiny.cc",
]);

const IP_HOST = /^(\d{1,3}\.){3}\d{1,3}$/;

export type KeywordHit = { word: string; count: number };

export type TrustRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | "MALICIOUS";

export type RuleEngineResult = {
  scamProbability: number;
  trustRiskLevel: TrustRiskLevel;
  confidenceScore: number;
  attackClassifications: AttackClassification[];
  phishingIndicators: string[];
  manipulationIndicators: string[];
  keywordAnalysis: {
    suspiciousHits: KeywordHit[];
    urgencyHits: KeywordHit[];
    scamHits: KeywordHit[];
    cryptoHits: KeywordHit[];
    blacklistHits: string[];
  };
  recommendedActions: string[];
  signals: Record<string, unknown>;
};

function countOccurrences(text: string, phrase: string): number {
  let count = 0;
  let idx = 0;
  const lower = text.toLowerCase();
  const needle = phrase.toLowerCase();
  while ((idx = lower.indexOf(needle, idx)) !== -1) {
    count++;
    idx += needle.length;
  }
  return count;
}

function symbolRatio(s: string): number {
  if (!s.length) return 0;
  const symbols = s.replace(/[a-z0-9./\s\-_%=&:?#@]/gi, "").length;
  return symbols / s.length;
}

function shannonEntropy(s: string): number {
  const freq = new Map<string, number>();
  for (const ch of s) freq.set(ch, (freq.get(ch) ?? 0) + 1);
  let h = 0;
  const len = s.length;
  for (const c of freq.values()) {
    const p = c / len;
    h -= p * Math.log2(p);
  }
  return h;
}

function hasMixedScriptHomoglyphRisk(host: string): boolean {
  const hasLatin = /[a-z]/i.test(host);
  const hasCyrillic = /[\u0400-\u04FF]/.test(host);
  const hasGreek = /[\u0370-\u03FF]/.test(host);
  return hasLatin && (hasCyrillic || hasGreek);
}

function extractUrl(raw: string): URL | null {
  try {
    return new URL(raw.trim().startsWith("http") ? raw.trim() : `https://${raw.trim()}`);
  } catch {
    return null;
  }
}

function excessiveCaps(text: string): boolean {
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length < 24) return false;
  const upper = letters.replace(/[^A-Z]/g, "").length;
  return upper / letters.length > 0.55;
}

function classifyFromSignals(tags: Set<string>): AttackClassification[] {
  const out: AttackClassification[] = [];
  const add = (x: AttackClassification) => {
    if (!out.includes(x)) out.push(x);
  };
  if (tags.has("phish_lang") || tags.has("url_brand_impersonation") || tags.has("shortener")) add("PHISHING");
  if (tags.has("brand_impersonation") || tags.has("url_brand_impersonation") || tags.has("streaming_impersonation")) add("IMPERSONATION");
  if (tags.has("credential_pattern") || tags.has("fake_verification") || tags.has("wallet_threat") || tags.has("banking_threat") || tags.has("social_login_abuse")) add("CREDENTIAL_THEFT");
  if (tags.has("giveaway") || tags.has("crypto_scam") || tags.has("blacklist") || tags.has("premium_service")) add("SCAM");
  if (tags.has("malware_ref") || tags.has("attachment_threat")) add("MALWARE_DELIVERY");
  if (tags.has("urgency") || tags.has("fear") || tags.has("caps_pressure") || tags.has("survey_funnel")) add("SOCIAL_ENGINEERING");
  return out;
}

export function runRuleEngine(rawInput: string, scanType: ScanType): RuleEngineResult {
  const input = rawInput.trim();
  const lower = input.toLowerCase();

  const phishingIndicators: string[] = [];
  const manipulationIndicators: string[] = [];
  const recommendedActions: string[] = [];
  const signals: Record<string, unknown> = { scanType };
  const tags = new Set<string>();

  let score = 12;
  let signalFamilies = 0;

  // Very high severity: seed phrase / wallet recovery
  let walletThreatDetected = false;
  for (const re of WALLET_THREATS) {
    if (re.test(input)) {
      walletThreatDetected = true;
      phishingIndicators.push("Wallet seed phrase or recovery key harvesting attempt");
      tags.add("wallet_threat");
      score += 28;
      signalFamilies++;
      break;
    }
  }

  // Very high severity: banking impersonation
  let bankingThreatDetected = false;
  for (const re of BANKING_IMPERSONATION) {
    if (re.test(input)) {
      bankingThreatDetected = true;
      phishingIndicators.push("Banking or financial institution impersonation");
      tags.add("banking_threat");
      score += 26;
      signalFamilies++;
      break;
    }
  }

  // High severity: malware attachments
  let attachmentThreatDetected = false;
  for (const re of MALWARE_ATTACHMENTS) {
    if (re.test(input)) {
      attachmentThreatDetected = true;
      phishingIndicators.push("Suspicious or potentially malicious attachment references (ZIP, executable)");
      tags.add("attachment_threat");
      score += 24;
      signalFamilies++;
      break;
    }
  }

  const suspiciousHits: KeywordHit[] = [];
  for (const w of PHISHING_KEYWORDS) {
    const c = countOccurrences(lower, w);
    if (c > 0) {
      suspiciousHits.push({ word: w, count: c });
      score += Math.min(18, 6 + c * 4);
    }
  }
  if (suspiciousHits.length) {
    phishingIndicators.push("High-risk phishing/fraud lexicon detected");
    tags.add("phish_lang");
    signalFamilies++;
  }

  const urgencyHits: KeywordHit[] = [];
  for (const w of URGENCY_FEAR) {
    const c = countOccurrences(lower, w);
    if (c > 0) urgencyHits.push({ word: w, count: c });
  }
  if (urgencyHits.length) {
    manipulationIndicators.push("Urgency or fear-based pressure language");
    tags.add("urgency");
    score += Math.min(20, 6 + urgencyHits.length * 4);
    signalFamilies++;
  }

  const scamHits: KeywordHit[] = [];
  for (const w of SCAM_GIVEAWAY) {
    const c = countOccurrences(lower, w);
    if (c > 0) scamHits.push({ word: w, count: c });
  }
  if (scamHits.length) {
    phishingIndicators.push("Giveaway / lottery-style scam indicators");
    tags.add("giveaway");
    score += Math.min(22, 10 + scamHits.length * 4);
    signalFamilies++;
  }

  const cryptoHits: KeywordHit[] = [];
  for (const w of CRYPTO_SCAM) {
    const c = countOccurrences(lower, w);
    if (c > 0) cryptoHits.push({ word: w, count: c });
  }
  if (cryptoHits.length) {
    phishingIndicators.push("Crypto wallet or seed-phrase harvesting language");
    tags.add("crypto_scam");
    score += Math.min(25, 10 + cryptoHits.length * 4);
    signalFamilies++;
  }

  const financialHits: KeywordHit[] = [];
  for (const w of FINANCIAL_BAIT) {
    const c = countOccurrences(lower, w);
    if (c > 0) financialHits.push({ word: w, count: c });
  }
  if (financialHits.length) {
    manipulationIndicators.push("Financial incentive or payment demand language");
    tags.add("financial_bait");
    score += Math.min(16, 5 + financialHits.length * 3);
    signalFamilies++;
  }

  // Narrative social engineering signals
  let premiumServiceDetected = false;
  for (const w of PREMIUM_SERVICE_OFFERS) {
    const c = countOccurrences(lower, w);
    if (c > 0) {
      premiumServiceDetected = true;
      manipulationIndicators.push("Free or premium service offer language");
      tags.add("premium_service");
      score += Math.min(16, 6 + c * 4);
      signalFamilies++;
      break;
    }
  }

  let socialLoginDetected = false;
  for (const re of SOCIAL_LOGIN_ABUSE) {
    if (re.test(input)) {
      socialLoginDetected = true;
      phishingIndicators.push("Social login credential harvesting (Google/Facebook/Apple)");
      tags.add("social_login_abuse");
      score += 18;
      signalFamilies++;
      break;
    }
  }

  let surveyFunnelDetected = false;
  for (const w of SURVEY_VERIFICATION_FUNNEL) {
    const c = countOccurrences(lower, w);
    if (c > 0) {
      surveyFunnelDetected = true;
      manipulationIndicators.push("Survey or verification funnel scam language");
      tags.add("survey_funnel");
      score += Math.min(18, 6 + c * 5);
      signalFamilies++;
      break;
    }
  }

  let accessUnlockDetected = false;
  for (const w of ACCESS_UNLOCK_CONDITIONAL) {
    const c = countOccurrences(lower, w);
    if (c > 0) {
      accessUnlockDetected = true;
      manipulationIndicators.push("Conditional access or 'unlock content' funnel language");
      tags.add("access_unlock");
      score += Math.min(14, 5 + c * 4);
      signalFamilies++;
      break;
    }
  }

  let streamingImpersonationDetected = false;
  for (const re of STREAMING_SERVICE_IMPERSONATION) {
    if (re.test(input)) {
      streamingImpersonationDetected = true;
      phishingIndicators.push("Streaming service impersonation or fake premium access claim");
      tags.add("streaming_impersonation");
      score += 18;
      signalFamilies++;
      break;
    }
  }

  const blacklistHits: string[] = [];
  for (const phrase of [...SCAM_GIVEAWAY, "western union", "moneygram", "green dot"]) {
    if (lower.includes(phrase)) blacklistHits.push(phrase);
  }
  if (blacklistHits.length) {
    tags.add("blacklist");
    score += 12;
  }

  for (const phrase of FAKE_VERIFICATION) {
    if (lower.includes(phrase)) {
      phishingIndicators.push("Fake verification / data harvesting request");
      tags.add("fake_verification");
      score += 24;
      signalFamilies++;
      break;
    }
  }

  for (const re of CREDENTIAL_HARVEST) {
    if (re.test(input)) {
      phishingIndicators.push("Credential harvesting phrasing pattern");
      tags.add("credential_pattern");
      score += 24;
      signalFamilies++;
      break;
    }
  }

  if (excessiveCaps(input)) {
    manipulationIndicators.push("Abnormal capitalization (pressure / shout tactic)");
    tags.add("caps_pressure");
    score += 8;
  }

  if (/virus detected|malware found|download (this )?cleaner|remote desktop/i.test(lower)) {
    phishingIndicators.push("Tech-support / malware delivery narrative");
    tags.add("malware_ref");
    score += 18;
    signalFamilies++;
  }

  const embeddedUrls = input.match(/https?:\/\/[^\s"'<>]+/gi) ?? [];
  if (embeddedUrls.length && scanType !== "URL") {
    signals.embeddedUrls = embeddedUrls.length;
    score += Math.min(24, 8 + embeddedUrls.length * 5);
    phishingIndicators.push("Embedded URL(s) inside narrative content");
    signalFamilies++;
    for (const u of embeddedUrls.slice(0, 3)) {
      const parsed = extractUrl(u);
      const host = parsed?.hostname.toLowerCase() ?? "";
      if (host && URL_SHORTENERS.has(host.replace(/^www\./, ""))) {
        phishingIndicators.push("Link shortener hides final destination");
        tags.add("shortener");
        score += 14;
      }
    }
  }

  if (scanType === "URL") {
    const url = extractUrl(input);
    if (!url) {
      score += 10;
      phishingIndicators.push("Malformed or non-standard URL structure");
    } else {
      const host = url.hostname.toLowerCase().replace(/^www\./, "");
      const path = `${url.pathname}${url.search}`;
      signals.hostname = host;
      signals.pathEntropy = shannonEntropy(path.slice(0, 120));

      if (url.protocol === "http:") {
        phishingIndicators.push("Cleartext HTTP (no TLS) — easy to intercept or spoof");
        score += 18;
        signalFamilies++;
      }

      const tld = host.split(".").pop() ?? "";
      if (SUSPICIOUS_TLDS.has(tld)) {
        phishingIndicators.push(`High-risk / commonly abused TLD: .${tld}`);
        score += 18;
        signalFamilies++;
      }

      if (IP_HOST.test(host)) {
        phishingIndicators.push("Host is a raw IP address (common in phishing infrastructure)");
        score += 22;
        signalFamilies++;
      }

      const shortHost = host.replace(/^www\./, "");
      if (URL_SHORTENERS.has(shortHost)) {
        phishingIndicators.push("URL shortener — destination is opaque until resolution");
        tags.add("shortener");
        score += 16;
        signalFamilies++;
      }

      const hostEntropy = shannonEntropy(host);
      signals.hostEntropy = hostEntropy;
      if (host.length > 48 || hostEntropy > 3.8) {
        phishingIndicators.push("High hostname entropy or excessive length (possible DGA / typosquat)");
        score += 14;
        signalFamilies++;
      }

      if (symbolRatio(host + path) > 0.14) {
        phishingIndicators.push("Unusually high symbol density in URL");
        score += 12;
      }

      if (hasMixedScriptHomoglyphRisk(host)) {
        phishingIndicators.push("Mixed-script hostname (possible homoglyph / IDN spoof)");
        score += 26;
        signalFamilies++;
      }

      const brands = ["paypal", "microsoft", "apple", "amazon", "google", "netflix", "chase", "wellsfargo", "bankofamerica", "coinbase", "binance"];
      for (const b of brands) {
        if (host.includes(b)) {
          const legit =
            host === `${b}.com` ||
            host.endsWith(`.${b}.com`) ||
            host === `www.${b}.com` ||
            (b === "google" && host.endsWith(".googleusercontent.com"));
          if (!legit) {
            phishingIndicators.push(`Likely brand impersonation in hostname (${b})`);
            tags.add("url_brand_impersonation");
            tags.add("brand_impersonation");
            score += 28;
            signalFamilies++;
            break;
          }
        }
      }

      const redirectParams = (path.match(/redirect|return_url|next=|continue|dest=/gi) ?? []).length;
      if (redirectParams >= 2 || /redirect=/i.test(path) && path.length > 120) {
        phishingIndicators.push("Open redirect / chained redirect parameters in URL");
        score += 12;
        signalFamilies++;
      }
    }
  }

  if (scanType === "EMAIL") {
    const reply = lower.match(/reply-to:\s*([^\s]+)/);
    const from = lower.match(/from:\s*([^\s]+)/);
    if (reply && from && reply[1] !== from[1]) {
      phishingIndicators.push("Reply-To differs from From (common phishing technique)");
      score += 14;
      signalFamilies++;
    }
    if (/spf=fail|dkim=fail|dmarc=fail/i.test(input)) {
      phishingIndicators.push("Authentication failure hints in headers (if authentic)");
      score += 10;
    }
  }

  // Signal family synergy bonuses
  if (signalFamilies >= 3) {
    score += 15;
    phishingIndicators.push("Multiple independent threat signal families detected (elevated confidence)");
  } else if (signalFamilies === 2) {
    score += 8;
  }

  // Bonus for urgency + credential combination
  if (tags.has("urgency") && (tags.has("credential_pattern") || tags.has("fake_verification") || tags.has("wallet_threat"))) {
    score += 12;
    manipulationIndicators.push("Combined urgency + credential harvesting (classic phishing tactic)");
  }

  // Bonus for giveaway + financial bait (payment-for-prize scam)
  if (tags.has("giveaway") && tags.has("financial_bait")) {
    score += 10;
    manipulationIndicators.push("Giveaway promise + payment requirement (classic advance-fee scam pattern)");
  }

  // NARRATIVE SOCIAL ENGINEERING COMBOS
  
  // Bonus for premium service + credential harvesting
  if (tags.has("premium_service") && (tags.has("credential_pattern") || tags.has("social_login_abuse"))) {
    score += 12;
    manipulationIndicators.push("Fake premium/free service + credential harvesting (classic funnel scam)");
  }

  // Bonus for social login + survey funnel
  if (tags.has("social_login_abuse") && tags.has("survey_funnel")) {
    score += 14;
    manipulationIndicators.push("Social login + survey funnel (classic credential + data harvesting combo)");
  }

  // Bonus for streaming impersonation + credential collection
  if (tags.has("streaming_impersonation") && (tags.has("credential_pattern") || tags.has("social_login_abuse"))) {
    score += 12;
    phishingIndicators.push("Streaming service fake + credential harvest (premium access scam)");
  }

  // Bonus for premium service + access unlock
  if (tags.has("premium_service") && tags.has("access_unlock")) {
    score += 10;
    manipulationIndicators.push("Free premium promise + access unlock funnel (multi-stage scam)");
  }

  // Bonus for premium service + social login
  if (tags.has("premium_service") && tags.has("social_login_abuse")) {
    score += 10;
    manipulationIndicators.push("Free service impersonation + social login harvesting");
  }

  // Bonus for URL + text + attachment indicators
  if (tags.has("url_brand_impersonation") && tags.has("credential_pattern") && tags.has("attachment_threat")) {
    score += 10;
  }

  score = Math.min(99, Math.round(score));

  let trustRiskLevel: TrustRiskLevel;
  if (score >= 75) trustRiskLevel = "MALICIOUS";
  else if (score >= 50) trustRiskLevel = "HIGH";
  else if (score >= 25) trustRiskLevel = "MEDIUM";
  else trustRiskLevel = "LOW";

  const attackClassifications = classifyFromSignals(tags);

  // Improved confidence scoring
  let confidenceBase = 42;
  confidenceBase += signalFamilies * 13;
  confidenceBase += Math.min(28, Math.round((score - 12) / 3));
  
  // Boost confidence for high-severity threats
  if (walletThreatDetected || bankingThreatDetected || attachmentThreatDetected) {
    confidenceBase += 12;
  }
  
  // Boost for multiple signal families on dangerous content
  if (trustRiskLevel === "MALICIOUS" || trustRiskLevel === "HIGH") {
    confidenceBase += 8;
  }
  
  const confidenceScore = Math.min(98, confidenceBase);

  if (trustRiskLevel === "MALICIOUS") {
    recommendedActions.push("URGENT: This is a confirmed malicious threat. Block immediately.");
    recommendedActions.push("Do not submit credentials, MFA codes, or install any offered software");
    recommendedActions.push("Preserve all artifacts (URL, headers, content) for incident reporting");
    recommendedActions.push("Report to IT security or appropriate authorities");
  } else if (trustRiskLevel === "HIGH") {
    recommendedActions.push("Treat as a direct threat until independently verified via official channels");
    recommendedActions.push("Do not click links or download attachments");
    recommendedActions.push("Do not provide any personal or financial information");
  } else if (trustRiskLevel === "MEDIUM") {
    recommendedActions.push("Open only in an isolated analysis environment; avoid personal devices");
    recommendedActions.push("Verify sender using independent communication channel before responding");
  } else {
    recommendedActions.push("Maintain standard phishing-aware browsing habits");
  }

  recommendedActions.push("When in doubt, initiate contact with the service via their official app or typed URL");

  return {
    scamProbability: score,
    trustRiskLevel,
    confidenceScore,
    attackClassifications,
    phishingIndicators: [...new Set(phishingIndicators)],
    manipulationIndicators: [...new Set(manipulationIndicators)],
    keywordAnalysis: {
      suspiciousHits,
      urgencyHits,
      scamHits,
      cryptoHits,
      blacklistHits: [...new Set(blacklistHits)],
    },
    recommendedActions: [...new Set(recommendedActions)].slice(0, 12),
    signals: {
      ...signals,
      signalFamilies,
      tags: [...tags],
    },
  };
}
