import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { authRouter } from "./routes/auth.routes.js";
import { scanRouter } from "./routes/scan.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { feedRouter } from "./routes/feed.routes.js";
import { analyticsRouter } from "./routes/analytics.routes.js";

const app = express();
app.set("trust proxy", 1);

app.use(
  cors({
    origin: env.CORS_ORIGIN.split(",").map((s) => s.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => res.json({ ok: true, service: "threatlens-api" }));

app.use("/api/auth", authRouter);
app.use("/api/scans", scanRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/feed", feedRouter);
app.use("/api/analytics", analyticsRouter);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`ThreatLens API listening on :${env.PORT}`);
});
