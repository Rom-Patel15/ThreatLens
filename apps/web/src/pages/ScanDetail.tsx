import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { api } from "../lib/api";
import { Card } from "../components/ui/Card";
import { RiskBadge } from "../components/ui/RiskBadge";
import { Skeleton } from "../components/ui/Skeleton";
import { RiskGauge } from "../components/scan/RiskGauge";
import { ThreatMeter } from "../components/scan/ThreatMeter";

type ScanResult = {
  scamProbability: number;
  trustRiskLevel: string;
  confidenceScore: number;
  attackClassifications: string[];
  phishingIndicators: string[];
  manipulationIndicators: string[];
  keywordAnalysis: {
    suspiciousHits: { word: string; count: number }[];
    urgencyHits: { word: string; count: number }[];
    scamHits?: { word: string; count: number }[];
    cryptoHits?: { word: string; count: number }[];
    blacklistHits: string[];
  };
  recommendedActions: string[];
  aiExplanation: string | null;
  aiManipulationSummary: string | null;
  aiSeverityExplanation: string | null;
  ruleSignals: Record<string, unknown>;
};

type ScanDetail = {
  scan: {
    id: string;
    scanType: string;
    rawInput: string;
    createdAt: string;
    result: ScanResult | null;
  };
};

const CLASS_COLORS = ["#22d3ee", "#a78bfa", "#fb7185", "#bef264", "#38bdf8", "#f472b6"];

export default function ScanDetail() {
  const { id } = useParams();
  const [data, setData] = useState<ScanDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get<ScanDetail>(`/api/scans/${id}`);
        if (!cancelled) setData(res.data);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Failed to load scan");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const timeline = useMemo(() => {
    if (!data?.scan?.createdAt) return [];
    const t0 = new Date(data.scan.createdAt).getTime();
    return [
      { label: "Evidence ingested", offset: -110_000 },
      { label: "Heuristic fusion", offset: -55_000 },
      { label: "AI analyst narrative", offset: -8_000 },
      { label: "Persisted to intelligence store", offset: 0 },
    ].map((x) => ({
      label: x.label,
      at: new Date(t0 + x.offset).toISOString(),
    }));
  }, [data?.scan?.createdAt]);

  const keywordBars = useMemo(() => {
    const r = data?.scan?.result;
    if (!r) return [];
    const hits = [
      ...(r.keywordAnalysis?.suspiciousHits ?? []).map((h) => ({ name: h.word.slice(0, 18), count: h.count })),
      ...(r.keywordAnalysis?.urgencyHits ?? []).map((h) => ({ name: `@urgency:${h.word.slice(0, 14)}`, count: h.count })),
    ];
    return hits.slice(0, 10);
  }, [data?.scan?.result]);

  if (loading || !data?.scan) {
    return (
      <div className="mx-auto max-w-5xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-40 lg:col-span-2" />
          <Skeleton className="h-40" />
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  const { scan } = data;
  const r = scan.result;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/scanner" className="text-xs text-cyan-300 hover:underline">
            ← Back to scanner
          </Link>
          <h2 className="mt-1 font-display text-3xl font-semibold tracking-tight">Intelligence report</h2>
          <p className="text-sm text-slate-400">
            {scan.scanType} · {new Date(scan.createdAt).toLocaleString()}
          </p>
        </div>
        {r && <RiskBadge level={r.trustRiskLevel} />}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card glow className="lg:col-span-2">
          <div className="grid gap-6 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">Hybrid assessment</p>
              <h3 className="mt-1 font-display text-xl font-semibold text-white">Threat probability & confidence</h3>
              <p className="mt-2 text-sm text-slate-400">
                Rules fire first; confidence reflects how many independent signal families aligned before any AI
                narrative.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(r?.attackClassifications ?? []).map((c, idx) => (
                  <span
                    key={c}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-100"
                    style={{ borderColor: `${CLASS_COLORS[idx % CLASS_COLORS.length]}55` }}
                  >
                    {c.replaceAll("_", " ")}
                  </span>
                ))}
                {!r?.attackClassifications?.length && (
                  <span className="text-xs text-slate-500">No strong multi-label classification</span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-center gap-4">
              <RiskGauge value={r?.scamProbability ?? 0} label="Threat score" />
              <div className="w-full max-w-sm space-y-2 rounded-xl border border-white/10 bg-night-950/40 p-4">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Model confidence</span>
                  <span className="font-mono text-slate-100">{Math.round(r?.confidenceScore ?? 0)}%</span>
                </div>
                <ThreatMeter value={r?.confidenceScore ?? 0} label="Fusion confidence" />
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-lg font-semibold text-slate-50">Analysis timeline</h3>
          <ol className="mt-4 space-y-3 text-sm">
            {timeline.map((ev) => (
              <li key={ev.label} className="flex gap-3">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.6)]" />
                <div>
                  <div className="font-medium text-slate-100">{ev.label}</div>
                  <div className="text-xs text-slate-500">{new Date(ev.at).toLocaleTimeString()}</div>
                </div>
              </li>
            ))}
          </ol>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="font-display text-lg font-semibold text-emerald-200/90">Phishing indicators</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {(r?.phishingIndicators ?? []).map((x) => (
              <li key={x} className="flex gap-2">
                <span className="text-cyan-400">▹</span>
                <span>{x}</span>
              </li>
            ))}
            {!r?.phishingIndicators?.length && <li className="text-slate-500">No strong phishing cues.</li>}
          </ul>
        </Card>
        <Card>
          <h3 className="font-display text-lg font-semibold text-amber-200/90">Manipulation indicators</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {(r?.manipulationIndicators ?? []).map((x) => (
              <li key={x} className="flex gap-2">
                <span className="text-amber-300">▹</span>
                <span>{x}</span>
              </li>
            ))}
            {!r?.manipulationIndicators?.length && <li className="text-slate-500">Limited pressure cues.</li>}
          </ul>
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-lg font-semibold">Lexical heatmap</h3>
          <span className="text-xs text-slate-500">Top weighted hits from the rule engine</span>
        </div>
        <div className="h-64">
          {keywordBars.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={keywordBars} layout="vertical" margin={{ left: 8, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={120} stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12 }}
                  cursor={{ fill: "rgba(34,211,238,0.06)" }}
                />
                <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                  {keywordBars.map((_, i) => (
                    <Cell key={i} fill={CLASS_COLORS[i % CLASS_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-500">No keyword hits to chart.</div>
          )}
        </div>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold">Keyword breakdown</h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4 text-sm">
          {(
            [
              ["Suspicious", r?.keywordAnalysis?.suspiciousHits],
              ["Urgency", r?.keywordAnalysis?.urgencyHits],
              ["Scam", r?.keywordAnalysis?.scamHits],
              ["Crypto", r?.keywordAnalysis?.cryptoHits],
            ] as const
          ).map(([label, hits]) => (
            <div key={label} className="rounded-xl border border-white/10 bg-night-950/40 p-3">
              <p className="text-xs uppercase text-slate-500">{label}</p>
              <ul className="mt-2 space-y-1 text-slate-300">
                {(hits ?? []).map((h) => (
                  <li key={h.word}>
                    {h.word} <span className="text-slate-500">×{h.count}</span>
                  </li>
                ))}
                {!hits?.length && <li className="text-slate-500">—</li>}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-cyan-400/20">
          <h3 className="font-display text-lg font-semibold text-cyan-200">AI analyst report</h3>
          <p className="mt-3 text-sm leading-relaxed text-slate-200">{r?.aiExplanation ?? "No AI narrative available."}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-night-950/50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Manipulation summary</p>
              <p className="mt-2 text-sm text-slate-300">{r?.aiManipulationSummary ?? "—"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-night-950/50 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500">Severity interpretation</p>
              <p className="mt-2 text-sm text-slate-300">{r?.aiSeverityExplanation ?? "—"}</p>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="font-display text-lg font-semibold">Containment playbook</h3>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-300">
            {(r?.recommendedActions ?? []).map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ol>
        </Card>
      </div>

      <Card>
        <h3 className="font-display text-lg font-semibold">Structured signals (JSON)</h3>
        <pre className="mt-3 max-h-64 overflow-auto rounded-xl bg-night-950/80 p-4 text-xs text-slate-400">
          {JSON.stringify(r?.ruleSignals ?? {}, null, 2)}
        </pre>
      </Card>

      <Card>
        <h3 className="font-display text-lg font-semibold">Raw evidence</h3>
        <pre className="mt-3 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-night-950/80 p-4 text-xs text-slate-400">
          {scan.rawInput}
        </pre>
      </Card>
    </div>
  );
}
