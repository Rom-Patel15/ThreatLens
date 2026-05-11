import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../lib/api";
import { Card } from "../components/ui/Card";
import { Skeleton } from "../components/ui/Skeleton";

type AlertListItem = {
  id: string;
  title: string;
  description: string;
  severity: string;
  category: string;
  source: string | null;
  publishedAt: string;
};

type AlertDetail = AlertListItem & {
  attackExplanation: string | null;
  iocs: unknown;
  preventionTips: unknown;
  affectedIndustries: unknown;
  analystSummary: string | null;
  relatedPatterns: unknown;
  timeline: unknown;
};

const severityStyle: Record<string, string> = {
  CRITICAL: "border-rose-500/40 bg-rose-500/10 text-rose-100",
  HIGH: "border-orange-500/40 bg-orange-500/10 text-orange-100",
  MEDIUM: "border-amber-500/40 bg-amber-500/10 text-amber-100",
  LOW: "border-emerald-500/30 bg-emerald-500/5 text-emerald-100",
};

function asStringArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function asTimeline(v: unknown): { label: string; at: string }[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => {
      if (x && typeof x === "object" && "label" in x && "at" in x) {
        const o = x as { label: unknown; at: unknown };
        if (typeof o.label === "string" && typeof o.at === "string") return { label: o.label, at: o.at };
      }
      return null;
    })
    .filter(Boolean) as { label: string; at: string }[];
}

export default function Feed() {
  const [alerts, setAlerts] = useState<AlertListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<AlertDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{ alerts: AlertListItem[] }>("/api/feed");
        if (!cancelled) setAlerts(res.data.alerts);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load feed");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function openDetail(id: string) {
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await api.get<{ alert: AlertDetail }>(`/api/feed/${id}`);
      setDetail(res.data.alert);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load bulletin");
    } finally {
      setDetailLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">Intelligence</p>
        <h2 className="font-display text-3xl font-semibold">Threat intelligence feed</h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-400">
          Click any card to open a full intelligence bulletin with IOC-style indicators, prevention guidance, and
          analyst narrative — seeded for interview-ready demos.
        </p>
      </div>

      {loading && (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {alerts.map((a, idx) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
          >
            <button
              type="button"
              onClick={() => void openDetail(a.id)}
              className="block w-full text-left transition hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
            >
              <Card className="h-full cursor-pointer">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                      severityStyle[a.severity] ?? severityStyle.MEDIUM
                    }`}
                  >
                    {a.severity}
                  </span>
                  <span className="text-xs text-slate-500">{a.category}</span>
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold text-slate-50">{a.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-400">{a.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>{a.source ?? "ThreatLens"}</span>
                  <span>{new Date(a.publishedAt).toLocaleDateString()}</span>
                </div>
              </Card>
            </button>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {(detail || detailLoading) && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              aria-label="Close bulletin"
              onClick={() => {
                setDetail(null);
                setDetailLoading(false);
              }}
            />
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              className="relative z-10 m-0 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-white/10 bg-night-900/95 p-6 shadow-glow sm:rounded-3xl"
              role="dialog"
              aria-modal="true"
            >
              {detailLoading && (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-64" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-40 w-full" />
                </div>
              )}
              {!detailLoading && detail && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">{detail.category}</p>
                      <h3 className="font-display text-2xl font-semibold text-white">{detail.title}</h3>
                      <p className="mt-2 text-sm text-slate-400">{detail.description}</p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase ${
                        severityStyle[detail.severity] ?? severityStyle.MEDIUM
                      }`}
                    >
                      {detail.severity}
                    </span>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-night-950/60 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Attack explanation</p>
                      <p className="mt-2 text-sm text-slate-200">{detail.attackExplanation ?? "—"}</p>
                    </div>
                    <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
                      <p className="text-xs uppercase tracking-wide text-cyan-200/80">Analyst summary</p>
                      <p className="mt-2 text-sm text-cyan-50/90">{detail.analystSummary ?? "—"}</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-night-950/50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Indicators (demo taxonomy)</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {asStringArray(detail.iocs).map((ioc) => (
                        <span key={ioc} className="rounded-full border border-white/10 bg-white/5 px-2 py-1 font-mono text-xs text-slate-200">
                          {ioc}
                        </span>
                      ))}
                      {!asStringArray(detail.iocs).length && <span className="text-sm text-slate-500">—</span>}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-night-950/50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Prevention tips</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                        {asStringArray(detail.preventionTips).map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                        {!asStringArray(detail.preventionTips).length && <li className="text-slate-500">—</li>}
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-night-950/50 p-4">
                      <p className="text-xs uppercase tracking-wide text-slate-500">Affected industries</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">
                        {asStringArray(detail.affectedIndustries).map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                        {!asStringArray(detail.affectedIndustries).length && <li className="text-slate-500">—</li>}
                      </ul>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-night-950/50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Related patterns</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {asStringArray(detail.relatedPatterns).map((p) => (
                        <span key={p} className="rounded-lg border border-violet-500/30 bg-violet-500/10 px-2 py-1 text-xs text-violet-100">
                          {p}
                        </span>
                      ))}
                      {!asStringArray(detail.relatedPatterns).length && <span className="text-sm text-slate-500">—</span>}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-night-950/50 p-4">
                    <p className="text-xs uppercase tracking-wide text-slate-500">Timeline</p>
                    <ol className="mt-3 space-y-2 text-sm text-slate-300">
                      {asTimeline(detail.timeline).map((t) => (
                        <li key={t.at + t.label} className="flex justify-between gap-3 border-b border-white/5 py-2">
                          <span>{t.label}</span>
                          <span className="shrink-0 text-xs text-slate-500">{new Date(t.at).toLocaleString()}</span>
                        </li>
                      ))}
                      {!asTimeline(detail.timeline).length && <li className="text-slate-500">—</li>}
                    </ol>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
                      onClick={() => {
                        setDetail(null);
                        setDetailLoading(false);
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
