import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import * as analytics from "../controllers/analyticsController.js";

export const analyticsRouter = Router();
analyticsRouter.use(requireAuth);
analyticsRouter.get("/risk-score", asyncHandler(analytics.getRiskScore));
