export type SimulationSurfaceType = "email" | "login" | "sms" | "wallet" | "invoice";

export type Severity = "low" | "medium" | "high";

export type SimulationTarget = {
  id: string;
  label: string;
  description: string;
  suspicious: boolean;
  severity: Severity;
  points: number;
};

type BaseSurface = {
  type: SimulationSurfaceType;
  atmosphere: string;
  guidance: string;
};

export type EmailSurface = BaseSurface & {
  type: "email";
  sender: string;
  replyTo: string;
  subject: string;
  preview: string;
  timestamp: string;
  body: string[];
  ctaLabel: string;
  attachment?: string;
};

export type LoginSurface = BaseSurface & {
  type: "login";
  brand: string;
  url: string;
  title: string;
  subtitle: string;
  alerts: string[];
  fields: string[];
  ctaLabel: string;
  footer: string;
};

export type SmsSurface = BaseSurface & {
  type: "sms";
  contact: string;
  number: string;
  messages: { id: string; from: "them" | "you"; text: string }[];
  quickAction: string;
};

export type WalletSurface = BaseSurface & {
  type: "wallet";
  appName: string;
  walletId: string;
  network: string;
  amount: string;
  destination: string;
  messages: string[];
  ctaLabel: string;
};

export type InvoiceSurface = BaseSurface & {
  type: "invoice";
  sender: string;
  subject: string;
  company: string;
  invoiceId: string;
  body: string[];
  attachment: string;
  ctaLabel: string;
};

export type SimulationSurface =
  | EmailSurface
  | LoginSurface
  | SmsSurface
  | WalletSurface
  | InvoiceSurface;

export type ThreatScenario = {
  id: string;
  title: string;
  typeLabel: string;
  summary: string;
  brief: string;
  difficulty: string;
  threatScore: number;
  focus: string;
  objective: string;
  analystIntro: string;
  aiExplanation: string;
  outcome: string;
  mitigation: string[];
  surface: SimulationSurface;
  targets: SimulationTarget[];
};

export type SimulationResult = {
  awarenessScore: number;
  accuracy: number;
  foundIndicators: SimulationTarget[];
  missedIndicators: SimulationTarget[];
  falsePositives: SimulationTarget[];
};
