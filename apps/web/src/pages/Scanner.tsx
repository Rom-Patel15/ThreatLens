import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { api } from "../lib/api";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";

const scanTypes = [
  { value: "URL", label: "Suspicious URL", placeholder: "https://example.com/path?query=…" },
  { value: "EMAIL", label: "Phishing / email", placeholder: "Paste raw email headers + body…" },
  { value: "MESSAGE", label: "Chat / SMS", placeholder: "Paste suspicious message text…" },
  { value: "TEXT", label: "Scam text", placeholder: "Paste any suspicious narrative…" },
  { value: "WEBSITE_DESC", label: "Website description", placeholder: "Describe a suspicious site or offer…" },
] as const;

export default function Scanner() {
  const nav = useNavigate();
  const [scanType, setScanType] = useState<(typeof scanTypes)[number]["value"]>("URL");
  const [rawInput, setRawInput] = useState("");
  const [busy, setBusy] = useState(false);

  const ph = scanTypes.find((s) => s.value === scanType)?.placeholder ?? "";

  async function runScan(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post<{ scan: { id: string } }>("/api/scans", { scanType, rawInput });
      toast.success("Scan complete — analyst layer attached");
      nav(`/scans/${data.scan.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">Module</p>
        <h2 className="font-display text-3xl font-semibold">Hybrid threat scanner</h2>
        <p className="mt-2 text-sm text-slate-400">
          Deterministic heuristics execute first. The AI layer produces SOC-style explanations — not open-ended chat.
        </p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card glow>
          <form onSubmit={runScan} className="space-y-5">
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">Channel</label>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {scanTypes.map((t) => (
                  <button
                    type="button"
                    key={t.value}
                    onClick={() => setScanType(t.value)}
                    className={`rounded-xl border px-3 py-2 text-left text-sm transition ${
                      scanType === t.value
                        ? "border-cyan-400/50 bg-cyan-500/10 text-white"
                        : "border-white/10 bg-night-950/40 text-slate-300 hover:border-white/20"
                    }`}
                  >
                    <div className="font-semibold">{t.label}</div>
                    <div className="text-xs text-slate-500">{t.value}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-wide text-slate-400">Evidence</label>
              <textarea
                name="evidence"
                autoComplete="off"
                aria-label="Evidence to analyze"
                className="mt-2 min-h-[180px] w-full rounded-xl border border-white/10 bg-night-950/60 px-3 py-3 text-sm outline-none ring-cyan-400/30 focus:ring-2"
                placeholder={ph}
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                required
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={busy}>
                {busy ? "Analyzing…" : "Run hybrid analysis"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setRawInput("")}>
                Clear
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}
