import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import * as dashboard from "../controllers/dashboardController.js";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);
dashboardRouter.get("/", asyncHandler(dashboard.getDashboard));
