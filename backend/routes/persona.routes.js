import { Router } from "express";
import {
  getQuestions,
  getCustomPersonas,
  createPersona,
  removePersona,
} from "../controllers/persona.controller.js";

const router = Router();

// GET /api/personas/questions — builder question catalog
router.get("/questions", getQuestions);

// GET /api/personas — list user-created personas
router.get("/", getCustomPersonas);

// POST /api/personas — create a persona from form answers
router.post("/", createPersona);

// DELETE /api/personas/:id — remove a user-created persona
router.delete("/:id", removePersona);

export default router;
