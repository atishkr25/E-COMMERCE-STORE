import express from "express";
import { getProfile, updateProfile, deleteProfile } from "../controllers/profile.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

// All profile routes are protected (require authentication)
router.get("/", protectRoute, getProfile);
router.put("/", protectRoute, updateProfile);
router.delete("/", protectRoute, deleteProfile);

export default router;
