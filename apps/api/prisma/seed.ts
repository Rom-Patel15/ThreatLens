import { PrismaClient, ScanType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { runRuleEngine } from "../src/services/ruleEngine.js";
import { recomputeUserRiskScore } from "../src/services/riskScoreService.js";

const prisma = new PrismaClient();

const DEMO_PASSWORD = "DemoPass123!";

async function main() {
  await prisma.otpAuditLog.deleteMany();
  await prisma.user.deleteMany();
  await prisma.threatAlert.deleteMany();

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const demoUsers = [
    { email: "demo@threatlens.dev", name: "Demo Operator" },
    { email: "soc@threatlens.dev", name: "SOC Lead" },
    { email: "analyst@threatlens.dev", name: "Threat Analyst" },
  ];

  const users = [];
  for (const u of demoUsers) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        name: u.name,
        passwordHash,
        emailVerified: true,
      },
    });
    users.push(user);
  }

  const [demo, soc, analyst] = users;

  await prisma.otpAuditLog.createMany({
    data: [
      {
        email: demo.email,
        userId: demo.id,
        event: "OTP_SENT",
        metadata: { note: "seed: simulated signup verification" },
      },
      {
        email: demo.email,
        userId: demo.id,
        event: "VERIFY_SUCCESS",
        metadata: { note: "seed: successful verification" },
      },
      {
        email: soc.email,
        userId: soc.id,
        event: "OTP_RESENT",
        metadata: { note: "seed: operator requested resend" },
      },
    ],
  });

  const scanSeeds: { userId: string; scanType: ScanType; raw: string }[] = [
    {
      userId: demo.id,
      scanType: "URL",
      raw: "http://paypal-secure-login.tk/signin/confirm?session=expired&redirect=https://evil.example/phish",
    },
    {
      userId: demo.id,
      scanType: "URL",
      raw: "https://bit.ly/3xPayPal-verify-now",
    },
    {
      userId: demo.id,
      scanType: "EMAIL",
      raw: `From: security@paypa1-updates.com\nReply-To: help@gmail.com\nSubject: URGENT verify your account\n\nYour account will be suspended within 24 hours. Click immediately to verify your identity with a photo of your ID and confirm card cvv.`,
    },
    {
      userId: soc.id,
      scanType: "MESSAGE",
      raw: "CONGRATULATIONS selected! You have won a free iphone. Send a $5 gift card fee to unlock delivery. Act now expires today.",
    },
    {
      userId: soc.id,
      scanType: "TEXT",
      raw: "Double your crypto guaranteed returns — connect your metamask and share your seed phrase for verification.",
    },
    {
      userId: analyst.id,
      scanType: "WEBSITE_DESC",
      raw: "Clone of Microsoft login with urgent wire transfer request and remote desktop download to remove virus detected.",
    },
    {
      userId: analyst.id,
      scanType: "URL",
      raw: "https://www.wikipedia.org/wiki/Cybersecurity",
    },
  ];

  for (const s of scanSeeds) {
    const rules = runRuleEngine(s.raw, s.scanType);
    await prisma.threatScan.create({
      data: {
        userId: s.userId,
        scanType: s.scanType,
        rawInput: s.raw,
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
            aiExplanation: `Seed analyst narrative: ${rules.trustRiskLevel} tier with ${Math.round(rules.confidenceScore)}% confidence. Primary classes: ${rules.attackClassifications.join(", ")}.`,
            aiManipulationSummary:
              "Seeded SOC summary: highlights urgency, impersonation, or credential harvesting consistent with deterministic signals.",
            aiSeverityExplanation: `Seeded severity: ${rules.trustRiskLevel} reflects automated scoring bands tuned for hybrid analysis demos.`,
          },
        },
      },
    });
  }


  const alerts = [
    {
      title: "QR-code phishing pivots to payroll portals",
      description:
        "Actors are sending shortened links that resolve to cloned HR login pages. Verify sender domain and use hardware FIDO2 for payroll changes.",
      severity: "HIGH",
      category: "Phishing",
      source: "ThreatLens Intel",
      attackExplanation:
        "Attackers abuse trusted QR placements to swap destination URLs after initial print, steering victims to cloned SSO portals.",
      iocs: ["qr://redirect-chains", "payroll-sso-clone", "suspicious-shortener"],
      preventionTips: [
        "Train staff to never scan unknown QR in physical mail.",
        "Publish internal-only payroll change portals with MFA enforced.",
      ],
      affectedIndustries: ["Financial services", "Healthcare HR", "Education"],
      analystSummary:
        "High-confidence BEC-adjacent phishing pivot: urgency plus payroll context. Treat as enterprise-wide awareness topic.",
      relatedPatterns: ["BEC", "Payroll fraud", "MFA fatigue"],
      timeline: [
        { label: "First cluster observed", at: "2026-05-01T00:00:00.000Z" },
        { label: "Spike in EMEA", at: "2026-05-04T12:00:00.000Z" },
        { label: "Defenders publish YARA", at: "2026-05-07T09:30:00.000Z" },
      ],
    },
    {
      title: "Smishing surge: package delivery lures",
      description:
        "SMS templates impersonate major carriers with urgency language and toll-free callback numbers leading to vishing workflows.",
      severity: "MEDIUM",
      category: "Smishing",
      source: "Community telemetry",
      attackExplanation:
        "Templates rotate carrier branding daily; callbacks harvest one-time codes and payment details.",
      iocs: ["sms:template:carrier-urgent", "callback:+1800-fake-track"],
      preventionTips: ["Advise users to open carrier apps directly", "Block premium-rate reply paths"],
      affectedIndustries: ["Retail", "Logistics"],
      analystSummary: "Volume spike correlates with holiday shipping windows; low technical complexity but high conversion.",
      relatedPatterns: ["Callback vishing", "Package scams"],
      timeline: [{ label: "Campaign start", at: "2026-04-20T08:00:00.000Z" }],
    },
    {
      title: "SEO poisoning for cracked software",
      description:
        "Compromised blogs rank for popular tool names and push drive-by downloads signed with stolen certificates.",
      severity: "HIGH",
      category: "Malware",
      source: "Search telemetry",
      attackExplanation:
        "Poisoned pages mimic vendor download portals and weaponize SEO to appear above legitimate results.",
      iocs: ["domain:cracked-soft-*.xyz", "cert:stolen-thumbprint"],
      preventionTips: ["Allowlist software sources", "Enable ASR rules for unsigned macros"],
      affectedIndustries: ["Technology", "Creative agencies"],
      analystSummary: "Classic supply-chain adjacent risk: users bypass IT to install tooling.",
      relatedPatterns: ["SEO poisoning", "Fake installers"],
      timeline: [{ label: "Peak impressions", at: "2026-05-02T15:00:00.000Z" }],
    },
    {
      title: "CEO fraud with deepfake audio",
      description:
        "Finance teams report urgent wire requests validated by synthetic voice calls mimicking executives.",
      severity: "CRITICAL",
      category: "BEC",
      source: "Financial sector ISAC",
      attackExplanation:
        "Synthetic media lowers suspicion; combined with urgency it bypasses traditional email-only controls.",
      iocs: ["voice:deepfake-indicator", "wire:template:urgent"],
      preventionTips: ["Out-of-band executive verification", "Dual control on wires"],
      affectedIndustries: ["Finance", "Legal"],
      analystSummary: "Critical human-factor risk; pair technical signals with finance policy controls.",
      relatedPatterns: ["BEC", "Deepfake"],
      timeline: [
        { label: "First report", at: "2026-04-28T10:00:00.000Z" },
        { label: "ISAC advisory", at: "2026-05-01T18:00:00.000Z" },
      ],
    },
    {
      title: "Credential stuffing against SaaS SSO",
      description:
        "Distributed attempts against SAML endpoints using recycled breach lists; enable IP reputation and step-up MFA.",
      severity: "MEDIUM",
      category: "Account Takeover",
      source: "SaaS defenders forum",
      attackExplanation:
        "Automated login attempts leverage password reuse from unrelated breaches to hit SAML IdPs.",
      iocs: ["http:401-spike", "ip:residential-botnet"],
      preventionTips: ["Enable breached-password protection", "Risk-based step-up MFA"],
      affectedIndustries: ["SaaS", "Technology"],
      analystSummary: "Steady-state ATO noise; manageable with modern IdP policies.",
      relatedPatterns: ["Credential stuffing", "Password spraying"],
      timeline: [{ label: "Ongoing", at: "2026-05-10T00:00:00.000Z" }],
    },
  ];

  for (const a of alerts) {
    await prisma.threatAlert.create({ data: a });
  }

  for (const u of users) {
    await prisma.activityLog.createMany({
      data: [
        { userId: u.id, action: "SEED_DEMO_LOGIN", metadata: { note: "Synthetic activity for interviews" } },
        { userId: u.id, action: "THREAT_SCAN", metadata: { note: "Historical scans loaded via seed" } },
      ],
    });
  }

  for (const u of users) {
    await recomputeUserRiskScore(prisma, u.id);
  }

  console.info("Seed complete. Demo users (password %s):", DEMO_PASSWORD);
  console.info(demoUsers.map((x) => x.email).join(", "));
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
