import { Router } from "express";
import { chatWithPersona } from "../controllers/chat.controller.js";

const router = Router();

// POST /api/chat
router.post("/", chatWithPersona);

export default router;
