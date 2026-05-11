import { startTransition, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { evaluateScenario } from "../features/threatLab/scoring";
import { threatLabScenarios } from "../features/threatLab/scenarios";
import type { Severity, SimulationResult, SimulationSurface, SimulationTarget, ThreatScenario } from "../features/threatLab/types";

type Phase = "select" | "simulate" | "results";

const severityStyles: Record<Severity, string> = {
  low: "border-emerald-400/25 bg-emerald-500/10 text-emerald-200",
  medium: "border-amber-400/25 bg-amber-500/10 text-amber-100",
  high: "border-rose-400/25 bg-rose-500/10 text-rose-100",
};

const scoreTones = {
  high: {
    dot: "bg-rose-400",
    text: "text-rose-200",
    border: "border-rose-900/80",
    bg: "bg-rose-950/40",
  },
  medium: {
    dot: "bg-amber-400",
    text: "text-amber-200",
    border: "border-amber-900/80",
    bg: "bg-amber-950/30",
  },
  low: {
    dot: "bg-teal-400",
    text: "text-teal-200",
    border: "border-teal-900/80",
    bg: "bg-teal-950/30",
  },
};

export default function ThreatLab() {
  const [selected, setSelected] = useState<ThreatScenario>(threatLabScenarios[0]);
  const [phase, setPhase] = useState<Phase>("select");
  const [flaggedIds, setFlaggedIds] = useState<string[]>([]);
  const [showAnalyst, setShowAnalyst] = useState(true);
  const [showMitigation, setShowMitigation] = useState(false);
  const [lastFlaggedId, setLastFlaggedId] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const flagged = useMemo(() => new Set(flaggedIds), [flaggedIds]);
  const suspicious = selected.targets.filter((t) => t.suspicious);
  const found = suspicious.filter((t) => flagged.has(t.id)).length;
  const latestInsight =
    selected.targets.find((t) => t.id === lastFlaggedId)?.description ??
    "Click suspicious elements in the live simulation to build your review.";
  const metrics = [
    ["Threat score", `${selected.threatScore}%`, "Scenario severity in the ThreatLens engine."],
    ["Focus", selected.focus, "Primary attacker behavior you need to catch."],
    ["Coverage", `${found}/${suspicious.length}`, "Suspicious indicators flagged so far."],
  ] as const;
  const toneForScore = (score: number) => (score >= 90 ? scoreTones.high : score >= 80 ? scoreTones.medium : scoreTones.low);

  const reset = (scenario: ThreatScenario, nextPhase: Phase = "select") =>
    startTransition(() => {
      setSelected(scenario);
      setPhase(nextPhase);
      setFlaggedIds([]);
      setShowMitigation(false);
      setLastFlaggedId(null);
      setResult(null);
    });

  const toggle = (id: string) => {
    setLastFlaggedId(id);
    setFlaggedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  return (
    <div className="mx-auto max-w-[1500px] space-y-5">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[24px] border border-slate-800 bg-[#0b131d] px-6 py-5 shadow-card sm:px-7 sm:py-6"
      >
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Threat Lab</p>
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">
              Interactive analyst simulation
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Run phishing, fake login, SMS scam, crypto wallet, and invoice-malware drills in an interactive simulator
              instead of static reference cards.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[440px]">
            {metrics.map(([label, value, hint]) => (
              <div key={label} className="min-w-0 rounded-2xl border border-slate-800 bg-[#0f1824] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</p>
                <p className="mt-2 break-words font-display text-xl font-semibold text-slate-100">{value}</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card className="space-y-3 rounded-[24px] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Navigation</p>
                <h3 className="font-display text-lg font-semibold">Simulation queue</h3>
              </div>
              <div className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-400">
                {threatLabScenarios.length} modules
              </div>
            </div>
            {threatLabScenarios.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                onClick={() => reset(scenario)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition duration-200 ${
                  selected.id === scenario.id
                    ? "border-slate-600 bg-slate-900"
                    : "border-slate-800 bg-[#0e1621] hover:border-slate-700 hover:bg-[#111a26]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${toneForScore(scenario.threatScore).dot}`} />
                      <p className={`text-[11px] uppercase tracking-[0.16em] ${toneForScore(scenario.threatScore).text}`}>{scenario.typeLabel}</p>
                    </div>
                    <h4 className="mt-2 break-words font-display text-base font-semibold text-slate-100">{scenario.title}</h4>
                    <p className="mt-2 text-sm leading-5 text-slate-500">{scenario.focus}</p>
                  </div>
                  <div className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${toneForScore(scenario.threatScore).border} ${toneForScore(scenario.threatScore).bg} ${toneForScore(scenario.threatScore).text}`}>
                    {scenario.threatScore}
                  </div>
                </div>
              </button>
            ))}
          </Card>

          <Card className="space-y-4 rounded-[24px] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Workflow</p>
                <h3 className="font-display text-lg font-semibold">Operator loop</h3>
              </div>
              <Button variant="ghost" className="!px-3 !py-2 text-xs" onClick={() => setShowAnalyst((v) => !v)}>
                {showAnalyst ? "Hide analyst" : "Show analyst"}
              </Button>
            </div>
            {[["Select scenario", "Pick the attack narrative you want to train on."], ["Run simulation", "Inspect the live surface and flag suspicious indicators."], ["ThreatLens debrief", "Review score, misses, and mitigations."]].map(
              ([label, hint], index) => {
                const current = (["select", "simulate", "results"] as Phase[])[index];
                const active = phase === current;
                const done = (["select", "simulate", "results"] as Phase[]).indexOf(phase) > index;
                return (
                  <div
                    key={label}
                    className={`flex items-center gap-3 rounded-2xl border p-3 ${
                      active ? "border-slate-700 bg-slate-900" : "border-slate-800 bg-slate-950"
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold ${
                        active ? "bg-teal-700 text-slate-50" : done ? "bg-emerald-950 text-emerald-200" : "bg-[#131c28] text-slate-400"
                      }`}
                    >
                      {done ? "OK" : index + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="break-words text-sm font-medium text-slate-100">{label}</p>
                      <p className="text-xs text-slate-500">{hint}</p>
                    </div>
                  </div>
                );
              }
            )}
          </Card>
        </div>

        <Card className="min-w-0 overflow-hidden rounded-[24px] p-0">
          <div className="flex flex-col gap-4 border-b border-slate-800 px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{selected.typeLabel}</p>
              <h3 className="mt-1 break-words font-display text-2xl font-semibold text-slate-100 sm:text-[2rem]">{selected.title}</h3>
              <p className="mt-2 max-w-3xl break-words text-sm leading-6 text-slate-400">{selected.brief}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" onClick={() => reset(selected, "simulate")}>
                Restart simulation
              </Button>
              {phase !== "simulate" ? (
                <Button onClick={() => setPhase("simulate")}>Launch simulation</Button>
              ) : (
                <Button
                  onClick={() => {
                    setResult(evaluateScenario(selected, flaggedIds));
                    setShowMitigation(false);
                    setPhase("results");
                  }}
                  disabled={flaggedIds.length === 0}
                >
                  Evaluate my decisions
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-5 px-5 py-5 2xl:grid-cols-[minmax(0,1fr)_330px]">
            <div className="min-w-0">
              <AnimatePresence mode="wait">
                {phase === "select" && (
                  <motion.div key="select" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} className="grid gap-4 xl:grid-cols-[1.18fr_0.82fr]">
                    <div className="rounded-[22px] border border-slate-800 bg-[#0c141f] p-5">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Briefing</p>
                          <h4 className="mt-1 font-display text-xl font-semibold">Scenario narrative</h4>
                        </div>
                        <Button onClick={() => setPhase("simulate")}>Open live simulation</Button>
                      </div>
                      <p className="mt-4 break-words text-sm leading-6 text-slate-300">{selected.summary}</p>
                      <div className="mt-5 space-y-3">
                        <InfoRow label="Difficulty" value={selected.difficulty} />
                        <InfoRow label="Objective" value={selected.objective} />
                        <InfoRow label="Outcome goal" value={selected.outcome} />
                      </div>
                    </div>
                    <div className="rounded-[22px] border border-slate-800 bg-[#0c141f] p-5">
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Detection objectives</p>
                      <div className="mt-4 space-y-3">
                        {suspicious.map((t) => (
                          <div key={t.id} className="rounded-2xl border border-slate-800 bg-[#101924] p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-medium text-slate-100">{t.label}</p>
                              <span className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide ${severityStyles[t.severity]}`}>{t.severity}</span>
                            </div>
                            <p className="mt-2 text-sm leading-6 text-slate-400">{t.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
                {phase === "simulate" && (
                  <motion.div key="simulate" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-slate-800 bg-[#0c141f] px-4 py-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{selected.surface.atmosphere}</p>
                        <p className="mt-1 text-sm text-slate-400">{selected.surface.guidance}</p>
                      </div>
                      <div className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-400">
                        {found} of {suspicious.length} suspicious indicators flagged
                      </div>
                    </div>
                    <Surface surface={selected.surface} flagged={flagged} toggle={toggle} />
                  </motion.div>
                )}
                {phase === "results" && result && (
                  <motion.div key="results" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} className="space-y-4">
                    <div className="grid gap-4 xl:grid-cols-[0.86fr_1.14fr]">
                      <div className="rounded-[22px] border border-slate-800 bg-[#0c141f] p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Awareness score</p>
                        <div className="mt-4 flex items-end gap-4">
                          <div className="font-display text-6xl font-bold text-slate-50">{result.awarenessScore}</div>
                          <div className="pb-2 text-sm text-slate-400">/100 operator readiness</div>
                        </div>
                        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-800">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${result.awarenessScore}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full rounded-full bg-teal-500" />
                        </div>
                        <div className="mt-5 flex flex-wrap gap-3">
                          <CompactStat label="Found" value={result.foundIndicators.length} />
                          <CompactStat label="Missed" value={result.missedIndicators.length} />
                          <CompactStat label="Accuracy" value={`${result.accuracy}%`} />
                        </div>
                        <div className="mt-5 flex flex-wrap gap-3">
                          <Button onClick={() => reset(selected, "simulate")}>Replay scenario</Button>
                          <Button variant="ghost" onClick={() => setShowMitigation((v) => !v)}>{showMitigation ? "Hide mitigation" : "Review mitigation"}</Button>
                        </div>
                      </div>
                      <div className="rounded-[22px] border border-slate-800 bg-[#0c141f] p-5">
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Attack walkthrough</p>
                        <h4 className="mt-1 font-display text-xl font-semibold">Threat path summary</h4>
                        <p className="mt-3 text-sm leading-6 text-slate-300">{selected.aiExplanation}</p>
                        <List title="Indicators you found" empty="No suspicious indicators were flagged." items={result.foundIndicators} tone="success" />
                        <List title="Indicators missed" empty="You found every suspicious indicator in this scenario." items={result.missedIndicators} tone="warning" />
                        <List title="False positives" empty="No benign elements were incorrectly flagged." items={result.falsePositives} tone="neutral" />
                      </div>
                    </div>
                    <AnimatePresence initial={false}>
                      {showMitigation && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden rounded-[22px] border border-slate-800 bg-[#0d1722]">
                          <div className="grid gap-4 p-5 lg:grid-cols-[0.95fr_1.05fr]">
                            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Recommended response</p>
                              <p className="mt-3 text-sm leading-6 text-slate-200">{selected.outcome}</p>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4">
                              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Mitigation checklist</p>
                              <div className="mt-3 space-y-3">
                                {selected.mitigation.map((item) => (
                                  <div key={item} className="rounded-2xl border border-slate-800 bg-[#101924] px-3 py-3 text-sm leading-6 text-slate-200">{item}</div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            {showAnalyst && (
              <div className="space-y-4">
                <div className="rounded-[22px] border border-slate-800 bg-[#0c141f] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Analyst intelligence</p>
                      <h4 className="mt-1 font-display text-xl font-semibold">ThreatLens companion</h4>
                    </div>
                    <div className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-400">{phase === "results" ? "Debriefing" : "Live"}</div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-300">{selected.analystIntro}</p>
                  <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Latest insight</p>
                    <p className="mt-2 text-sm leading-6 text-slate-200">{latestInsight}</p>
                  </div>
                </div>
                <div className="rounded-[22px] border border-slate-800 bg-[#0c141f] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="font-display text-lg font-semibold">Indicator tracker</h4>
                    <span className="text-xs text-slate-500">{flagged.size} flagged</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {selected.targets.map((t) => (
                      <div key={t.id} className={`rounded-2xl border p-3 ${flagged.has(t.id) ? "border-teal-800 bg-teal-950/20" : "border-slate-800 bg-slate-950"}`}>
                        <div className="flex items-center justify-between gap-3">
                          <p className="min-w-0 break-words text-sm font-medium text-slate-100">{t.label}</p>
                          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide ${severityStyles[t.severity]}`}>{t.severity}</span>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-500">{flagged.has(t.id) ? "Flagged for analyst review." : "Not yet reviewed."}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {phase === "results" && result && (
                  <div className="rounded-[22px] border border-slate-800 bg-[#0c141f] p-5">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">AI explanation</p>
                    <p className="mt-3 text-sm leading-6 text-slate-200">{selected.aiExplanation}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function CompactStat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex min-w-[150px] flex-1 items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3">
      <span className="shrink-0 text-[11px] uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <span className="shrink-0 text-right font-display text-2xl font-semibold leading-none text-slate-100">{value}</span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 sm:flex-row sm:items-start">
      <span className="shrink-0 text-xs font-medium uppercase tracking-[0.18em] text-slate-500 sm:w-32">{label}</span>
      <span className="min-w-0 text-sm leading-6 text-slate-200">{value}</span>
    </div>
  );
}

function Mark({
  id,
  flagged,
  toggle,
  children,
  className = "",
}: {
  id: string;
  flagged: Set<string>;
  toggle: (id: string) => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={() => toggle(id)}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.995 }}
      className={`rounded-2xl border text-left transition ${
        flagged.has(id)
          ? "border-teal-700 bg-teal-950/30 shadow-[0_8px_24px_rgba(0,0,0,0.28)]"
          : "border-slate-800 bg-slate-950 hover:bg-[#121b27]"
      } ${className}`}
    >
      {children}
    </motion.button>
  );
}

function List({
  title,
  empty,
  items,
  tone,
}: {
  title: string;
  empty: string;
  items: SimulationTarget[];
  tone: "success" | "warning" | "neutral";
}) {
  const toneClass =
    tone === "success"
      ? "border-emerald-900 bg-emerald-950/30"
      : tone === "warning"
        ? "border-amber-900 bg-amber-950/25"
        : "border-slate-800 bg-[#0d1722]";

  return (
    <div className={`mt-4 rounded-2xl border p-4 ${toneClass}`}>
      <p className="text-sm font-semibold text-slate-100">{title}</p>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">{empty}</p>
      ) : (
        <div className="mt-3 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-slate-100">{item.label}</p>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide ${severityStyles[item.severity]}`}>{item.severity}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.description}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Surface({
  surface,
  flagged,
  toggle,
}: {
  surface: SimulationSurface;
  flagged: Set<string>;
  toggle: (id: string) => void;
}) {
  if (surface.type === "email") {
    return (
      <div className="overflow-hidden rounded-[24px] border border-slate-800 bg-[#0b121a] shadow-card">
        <div className="border-b border-slate-800 bg-[#0e1620] px-4 py-3 sm:px-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Inbox</p>
              <p className="text-sm text-slate-400">Flag the sender, reply path, links, or attachments that look hostile.</p>
            </div>
            <Mark id="email-timestamp" flagged={flagged} toggle={toggle} className="px-3 py-2 text-xs text-slate-400">
              {surface.timestamp}
            </Mark>
          </div>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <Mark id="email-sender" flagged={flagged} toggle={toggle} className="w-full p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">From</p>
            <p className="mt-1 break-all text-sm font-medium text-slate-100">{surface.sender}</p>
          </Mark>
          <Mark id="email-reply-to" flagged={flagged} toggle={toggle} className="w-full p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Reply-to</p>
            <p className="mt-1 break-all text-sm font-medium text-slate-100">{surface.replyTo}</p>
          </Mark>
          <div className="rounded-[20px] border border-slate-800 bg-slate-950 p-4 sm:p-5">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Subject</p>
            <p className="mt-2 break-words font-display text-2xl font-semibold text-slate-50">{surface.subject}</p>
            <p className="mt-3 break-words text-sm leading-6 text-slate-400">{surface.preview}</p>
            <Mark id="email-urgency" flagged={flagged} toggle={toggle} className="mt-4 w-full p-4">
              {surface.body.map((line) => (
                <p key={line} className="break-words text-sm leading-6 text-slate-200">
                  {line}
                </p>
              ))}
            </Mark>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Mark id="email-cta" flagged={flagged} toggle={toggle} className="flex-1 px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-slate-100">{surface.ctaLabel}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-teal-300">open</span>
                </div>
              </Mark>
              {surface.attachment && (
                <Mark id="email-attachment" flagged={flagged} toggle={toggle} className="flex-1 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Attachment</p>
                    <p className="mt-1 break-all text-sm font-medium text-slate-100">{surface.attachment}</p>
                  </div>
                </Mark>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (surface.type === "login") {
    return (
      <div className="overflow-hidden rounded-[24px] border border-slate-800 bg-slate-950 shadow-card">
        <div className="border-b border-slate-800 bg-[#0e1620] px-4 py-3">
          <Mark id="login-url" flagged={flagged} toggle={toggle} className="w-full px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] uppercase tracking-wide text-emerald-200">https</span>
              <span className="break-all text-sm text-slate-200">{surface.url}</span>
            </div>
          </Mark>
        </div>
        <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Mark id="login-brand" flagged={flagged} toggle={toggle} className="flex items-center justify-center rounded-[28px] bg-gradient-to-br from-slate-900 to-slate-950 p-6">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Secure banking portal</p>
              <h4 className="mt-3 font-display text-3xl font-semibold text-slate-50">{surface.brand}</h4>
            </div>
          </Mark>
          <div className="space-y-4 rounded-[22px] border border-slate-800 bg-[#0e1620] p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Security notice</p>
              <h4 className="mt-2 font-display text-2xl font-semibold text-slate-50">{surface.title}</h4>
            </div>
            <Mark id="login-subtitle" flagged={flagged} toggle={toggle} className="w-full p-4">
              <p className="break-words text-sm leading-6 text-slate-200">{surface.subtitle}</p>
            </Mark>
            <Mark id="login-alerts" flagged={flagged} toggle={toggle} className="w-full p-4">
              {surface.alerts.map((alert) => (
                <p key={alert} className="break-words text-sm text-slate-300">
                  {alert}
                </p>
              ))}
            </Mark>
            <Mark id="login-fields" flagged={flagged} toggle={toggle} className="w-full p-4">
              <div className="grid gap-3">
                {surface.fields.map((field) => (
                  <div key={field} className="rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-300">
                    {field}
                  </div>
                ))}
              </div>
            </Mark>
            <Mark id="login-cta" flagged={flagged} toggle={toggle} className="w-full px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-slate-100">{surface.ctaLabel}</span>
                <span className="text-xs uppercase tracking-[0.2em] text-teal-300">submit</span>
              </div>
            </Mark>
            <p className="text-xs text-slate-500">{surface.footer}</p>
          </div>
        </div>
      </div>
    );
  }

  if (surface.type === "sms") {
    return (
      <div className="mx-auto max-w-md overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950 shadow-card">
        <div className="border-b border-slate-800 bg-[#0e1620] px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-100">{surface.contact}</p>
              <Mark id="sms-number" flagged={flagged} toggle={toggle} className="mt-2 px-3 py-2 text-xs text-slate-400">
                {surface.number}
              </Mark>
            </div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-500">SMS</div>
          </div>
        </div>
        <div className="space-y-3 bg-[#0b121a] p-4">
          {surface.messages.map((message) => {
            const id =
              message.id === "sms-2"
                ? "sms-link"
                : message.id === "sms-4"
                  ? "sms-urgency"
                  : message.id === "sms-5"
                    ? "sms-otp"
                    : message.id === "sms-3"
                      ? "sms-user-reply"
                      : "";
            const bubble = (
              <div className={`max-w-[85%] rounded-[22px] px-4 py-3 text-sm leading-6 ${message.from === "them" ? "bg-[#111a26] text-slate-200" : "ml-auto bg-teal-950/50 text-teal-50"}`}>
                <p className="break-words">{message.text}</p>
              </div>
            );
            return <div key={message.id} className={message.from === "you" ? "flex justify-end" : "flex"}>{id ? <Mark id={id} flagged={flagged} toggle={toggle} className="max-w-[85%] p-0">{bubble}</Mark> : bubble}</div>;
          })}
        </div>
        <div className="border-t border-slate-800 px-4 py-4">
          <Mark id="sms-action" flagged={flagged} toggle={toggle} className="w-full px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-100">{surface.quickAction}</span>
              <span className="text-xs uppercase tracking-[0.2em] text-teal-300">launch</span>
            </div>
          </Mark>
        </div>
      </div>
    );
  }

  if (surface.type === "wallet") {
    return (
      <div className="overflow-hidden rounded-[24px] border border-slate-800 bg-[#0b121a] shadow-card">
        <div className="border-b border-slate-800 px-5 py-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{surface.appName}</p>
          <p className="mt-1 text-sm text-slate-400">Review the wallet request before approving any reconnect or signature prompt.</p>
        </div>
        <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-4 rounded-[22px] border border-slate-800 bg-slate-950 p-5">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Connected wallet</p>
              <p className="mt-2 break-all text-sm font-medium text-slate-100">{surface.walletId}</p>
            </div>
            <Mark id="wallet-network" flagged={flagged} toggle={toggle} className="w-full p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Network</p>
              <p className="mt-2 text-sm text-slate-200">{surface.network}</p>
            </Mark>
            <Mark id="wallet-amount" flagged={flagged} toggle={toggle} className="w-full p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Requested approval</p>
              <p className="mt-2 text-lg font-semibold text-slate-50">{surface.amount}</p>
            </Mark>
            <Mark id="wallet-destination" flagged={flagged} toggle={toggle} className="w-full p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Destination</p>
              <p className="mt-2 break-all text-sm text-slate-200">{surface.destination}</p>
            </Mark>
          </div>
          <div className="space-y-4 rounded-[22px] border border-slate-800 bg-[#0e1620] p-5">
            {surface.messages.map((message) => (
              <Mark
                key={message}
                id={message.includes("02:17") ? "wallet-countdown" : message.includes("12-word") ? "wallet-seed" : "wallet-cta"}
                flagged={flagged}
                toggle={toggle}
                className="w-full p-4"
              >
                <p className="break-words text-sm leading-6 text-slate-200">{message}</p>
              </Mark>
            ))}
            <Mark id="wallet-cta" flagged={flagged} toggle={toggle} className="w-full px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-100">{surface.ctaLabel}</span>
                <span className="text-xs uppercase tracking-[0.2em] text-teal-300">approve</span>
              </div>
            </Mark>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-800 bg-[#0b121a] shadow-card">
      <div className="border-b border-slate-800 bg-[#0e1620] px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Accounts payable queue</p>
            <p className="text-sm text-slate-400">Inspect the invoice sender, instructions, and attachment.</p>
          </div>
          <Mark id="invoice-id" flagged={flagged} toggle={toggle} className="px-3 py-2 text-xs text-slate-400">
            {surface.invoiceId}
          </Mark>
        </div>
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        <Mark id="invoice-sender" flagged={flagged} toggle={toggle} className="w-full p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">From</p>
          <p className="mt-1 break-all text-sm font-medium text-slate-100">{surface.sender}</p>
        </Mark>
        <div className="rounded-[22px] border border-slate-800 bg-slate-950 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Subject</p>
          <p className="mt-2 break-words font-display text-2xl font-semibold text-slate-50">{surface.subject}</p>
          <p className="mt-2 text-sm text-slate-400">{surface.company}</p>
          <div className="mt-4 space-y-3">
            {surface.body.map((line) => {
              const id = line.includes("banking details") ? "invoice-bank-update" : line.includes("enable content") ? "invoice-macro" : "";
              return id ? (
                <Mark key={line} id={id} flagged={flagged} toggle={toggle} className="w-full p-4">
                  <p className="break-words text-sm leading-6 text-slate-200">{line}</p>
                </Mark>
              ) : (
                <p key={line} className="break-words rounded-2xl border border-slate-800 bg-[#111a26] px-4 py-3 text-sm leading-6 text-slate-200">
                  {line}
                </p>
              );
            })}
          </div>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Mark id="invoice-attachment" flagged={flagged} toggle={toggle} className="flex-1 px-4 py-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Attachment</p>
                <p className="mt-1 break-all text-sm font-medium text-slate-100">{surface.attachment}</p>
              </div>
            </Mark>
            <Mark id="invoice-cta" flagged={flagged} toggle={toggle} className="flex-1 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-slate-100">{surface.ctaLabel}</span>
                <span className="text-xs uppercase tracking-[0.2em] text-teal-300">open</span>
              </div>
            </Mark>
          </div>
        </div>
      </div>
    </div>
  );
}
