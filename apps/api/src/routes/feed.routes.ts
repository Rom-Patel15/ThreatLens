import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import * as feed from "../controllers/feedController.js";

export const feedRouter = Router();
feedRouter.use(requireAuth);
feedRouter.get("/", asyncHandler(feed.listFeed));
feedRouter.get("/:id", asyncHandler(feed.getFeedDetail));
