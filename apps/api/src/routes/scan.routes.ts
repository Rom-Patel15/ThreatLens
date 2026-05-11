import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import * as scan from "../controllers/scanController.js";

const scanTypes = ["URL", "EMAIL", "MESSAGE", "TEXT", "WEBSITE_DESC"] as const;

const createScanSchema = z.object({
  scanType: z.enum(scanTypes),
  rawInput: z.string().min(1, "Input required").max(20000),
});

export const scanRouter = Router();
scanRouter.use(requireAuth);

scanRouter.post("/", validateBody(createScanSchema), asyncHandler(scan.createScan));
scanRouter.get("/", asyncHandler(scan.listScans));
scanRouter.get("/:id", asyncHandler(scan.getScan));
scanRouter.delete("/:id", asyncHandler(scan.deleteScan));
