import type { Request } from "express";

export function getClientIp(req: Request): string {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length) return xf.split(",")[0]!.trim();
  if (Array.isArray(xf) && xf[0]) return xf[0].trim();
  return req.socket.remoteAddress ?? "unknown";
}
