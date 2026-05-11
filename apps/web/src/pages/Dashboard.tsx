import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AnimatePresence, motion } from "framer-motion";
import { api } from "../lib/api";
import { Card } from "../components/ui/Card";
import { RiskBadge } from "../components/ui/RiskBadge";
import { Skeleton } from "../components/ui/Skeleton";

type ThreatAlert = {
  id: string;
  title: string;
  description: string;
  severity: string;
  category: string;
  publishedAt: string;
};

type DashboardPayload = {
  alerts: ThreatAlert[];
  riskScore: {
    overallScore: number;
    exposureIndex: number;
    threatIndex: number;
    breakdown: Record<string, unknown>;
  } | null;
  recentScans: {
    id: string;
    scanType: string;
    createdAt: string;
    result: { scamProbability: number; trustRiskLevel: string } | null;
  }[];
  activity: { id: string; action: string; createdAt: string }[];
  charts: {
    scansByType: { name: string; value: number }[];
    riskDistribution: { name: string; value: number }[];
    threatTrend: { date: string; avgThreat: number }[];
  };
};

const PIE_COLORS = ["#22d3ee", "#a78bfa", "#fb7185", "#bef264", "#e879f9", "#94a3b8"];

export default function Dashboard() {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<DashboardPayload["recentScans"][number] | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void loadDashboard(cancelled);
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadDashboard(cancelled = false) {
    try {
      const res = await api.get<DashboardPayload>("/api/dashboard");
      if (!cancelled) setData(res.data);
    } catch (e) {
      if (!cancelled) toast.error(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      if (!cancelled) setLoading(false);
    }
  }

  async function confirmDeleteScan() {
    if (!deleteTarget || !data || deletingId) return;

    const target = deleteTarget;
    const previous = data;

    setDeletingId(target.id);
    setDeleteTarget(null);
    setData({
      ...data,
      recentScans: data.recentScans.filter((scan) => scan.id !== target.id),
    });

    try {
      await api.delete(`/api/scans/${target.id}`);
      toast.success("Threat workflow deleted");
      void loadDashboard();
    } catch (e) {
      setData(previous);
      toast.error(e instanceof Error ? e.message : "Failed to delete workflow");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading || !data) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <Skeleton className="h-10 w-44" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
        <p className="text-center text-xs text-slate-500">Synchronizing telemetry…</p>
      </div>
    );
  }

  const rs = data.riskScore;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">Overview</p>
          <h2 className="font-display text-3xl font-semibold">
            Live <span className="text-gradient">risk posture</span>
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">
            Aggregated from hybrid scans, interactive simulation lab outputs, and platform activity. This is a product-style
            SOC shell — not a generic chat surface.
          </p>
        </div>
        <Link
          to="/scanner"
          className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-500/15"
        >
          Run new threat scan
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Security posture",
            value: rs ? `${Math.round(rs.overallScore)}` : "—",
            hint: "Higher is better (derived)",
            accent: "from-cyan-400 to-emerald-400",
          },
          {
            label: "Threat pressure index",
            value: rs ? `${Math.round(rs.threatIndex)}` : "—",
            hint: "From recent scan severities",
            accent: "from-violet-400 to-fuchsia-400",
          },
          {
            label: "Exposure index",
            value: rs ? `${Math.round(rs.exposureIndex)}` : "—",
            hint: "Simulated surface visibility",
            accent: "from-rose-400 to-amber-300",
          },
        ].map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card glow={i === 0}>
              <p className="text-xs uppercase tracking-wide text-slate-400">{m.label}</p>
              <div className={`mt-3 bg-gradient-to-r ${m.accent} bg-clip-text text-4xl font-display font-bold text-transparent`}>
                {m.value}
              </div>
              <p className="mt-2 text-xs text-slate-500">{m.hint}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Threat trend</h3>
            <span className="text-xs text-slate-500">14d avg probability</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.charts.threatTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12 }}
                />
                <Line type="monotone" dataKey="avgThreat" stroke="#22d3ee" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Risk distribution</h3>
            <span className="text-xs text-slate-500">Recent window</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.charts.riskDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {data.charts.riskDistribution.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Scans by channel</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.scansByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12 }}
                />
                <Bar dataKey="value" fill="#a78bfa" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 font-display text-lg font-semibold">Activity timeline</h3>
          <div className="max-h-64 space-y-3 overflow-y-auto pr-1 text-sm">
            {data.activity.length === 0 && <p className="text-slate-500">No events yet.</p>}
            {data.activity.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-2 border-b border-white/5 pb-2">
                <div>
                  <div className="font-medium text-slate-200">{a.action.replaceAll("_", " ")}</div>
                  <div className="text-xs text-slate-500">
                    {new Date(a.createdAt).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", month: "short", day: "numeric" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {data.alerts?.length > 0 && (
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-lg font-semibold">Intel snapshots</h3>
            <Link to="/feed" className="text-xs text-cyan-300 hover:underline">
              Open full feed
            </Link>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {data.alerts.slice(0, 4).map((a) => (
              <div key={a.id} className="rounded-xl border border-white/10 bg-night-950/50 p-4">
                <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                  <span>{a.category}</span>
                  <span>{a.severity}</span>
                </div>
                <p className="mt-2 font-medium text-slate-100">{a.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-slate-400">{a.description}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold">Recent threat workflows</h3>
          <Link to="/scanner" className="text-xs text-cyan-300 hover:underline">
            Open scanner
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-500">
                <th className="pb-2">Type</th>
                <th className="pb-2">Probability</th>
                <th className="pb-2">Risk</th>
                <th className="pb-2">When</th>
                <th className="pb-2"></th>
              </tr>
            </thead>
            <tbody>
              {data.recentScans.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-slate-500">
                    No scans yet — start with a URL or phishing email body.
                  </td>
                </tr>
              )}
              {data.recentScans.map((s) => (
                <tr key={s.id} className="border-t border-white/5">
                  <td className="py-3 font-medium text-slate-200">{s.scanType}</td>
                  <td className="py-3">{s.result ? `${Math.round(s.result.scamProbability)}%` : "—"}</td>
                  <td className="py-3">{s.result ? <RiskBadge level={s.result.trustRiskLevel} /> : "—"}</td>
                  <td className="py-3 text-slate-400">{new Date(s.createdAt).toLocaleString()}</td>
                  <td className="py-3 text-right">
                    <Link className="text-cyan-300 hover:underline" to={`/scans/${s.id}`}>
                      Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
