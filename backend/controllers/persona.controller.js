import crypto from "crypto";
import { PERSONAS } from "../personas/index.js";
import {
  QUESTIONS,
  buildSystemPrompt,
  buildGreeting,
  buildTagline,
} from "../services/promptBuilder.service.js";
import {
  listCustomPersonas,
  saveCustomPersona,
  deleteCustomPersona,
} from "../services/personaStore.service.js";

const VALID_QUESTION_COUNTS = [5, 10, 20];
const MAX_ANSWER_CHARS = 300;
const MAX_EXTRA_WORDS = 100;
const VALID_QUESTION_IDS = new Set(QUESTIONS.map((q) => q.id));

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}

// GET /api/personas/questions
export function getQuestions(req, res) {
  return res.json({ questions: QUESTIONS, counts: VALID_QUESTION_COUNTS });
}

// GET /api/personas — public fields of user-created personas only
export function getCustomPersonas(req, res) {
  const personas = listCustomPersonas().map(
    ({ id, name, tagline, greeting, createdAt }) => ({
      id,
      name,
      tagline,
      greeting,
      createdAt,
      custom: true,
    })
  );
  return res.json({ personas });
}

// POST /api/personas
// Body: { name, questionCount, answers: { [questionId]: string }, extraNotes }
export function createPersona(req, res) {
  // req.body is undefined when the request isn't sent as application/json
  const { name, questionCount, answers = {}, extraNotes = "" } = req.body ?? {};

  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 40) {
    return res.status(400).json({ error: "Persona name must be 2-40 characters" });
  }

  if (!VALID_QUESTION_COUNTS.includes(questionCount)) {
    return res.status(400).json({ error: "questionCount must be 5, 10 or 20" });
  }

  if (typeof answers !== "object" || Array.isArray(answers)) {
    return res.status(400).json({ error: "answers must be an object" });
  }

  const cleanAnswers = {};
  for (const [key, value] of Object.entries(answers)) {
    if (!VALID_QUESTION_IDS.has(key)) continue;
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    if (trimmed.length > MAX_ANSWER_CHARS) {
      return res.status(400).json({
        error: `Answer for "${key}" is too long (max ${MAX_ANSWER_CHARS} characters)`,
      });
    }
    cleanAnswers[key] = trimmed;
  }

  if (Object.keys(cleanAnswers).length === 0) {
    return res.status(400).json({ error: "At least one question must be answered" });
  }

  if (typeof extraNotes !== "string") {
    return res.status(400).json({ error: "extraNotes must be a string" });
  }

  if (countWords(extraNotes) > MAX_EXTRA_WORDS) {
    return res.status(400).json({ error: `Extra notes are limited to ${MAX_EXTRA_WORDS} words` });
  }

  const cleanName = name.trim();
  let id = `${slugify(cleanName) || "persona"}-${crypto.randomBytes(3).toString("hex")}`;
  // Regenerate on the (unlikely) collision with a built-in or existing id
  while (PERSONAS[id]) {
    id = `${slugify(cleanName) || "persona"}-${crypto.randomBytes(3).toString("hex")}`;
  }

  const persona = {
    id,
    name: cleanName,
    tagline: buildTagline(cleanAnswers),
    greeting: buildGreeting(cleanName, cleanAnswers),
    systemPrompt: buildSystemPrompt(cleanName, cleanAnswers, extraNotes),
    youtubeChannels: [],
    questionCount,
    answers: cleanAnswers,
    extraNotes: extraNotes.trim(),
    createdAt: new Date().toISOString(),
    custom: true,
  };

  saveCustomPersona(persona);

  return res.status(201).json({
    persona: {
      id: persona.id,
      name: persona.name,
      tagline: persona.tagline,
      greeting: persona.greeting,
      createdAt: persona.createdAt,
      custom: true,
    },
  });
}

// DELETE /api/personas/:id
export function removePersona(req, res) {
  const { id } = req.params;
  const deleted = deleteCustomPersona(id);
  if (!deleted) {
    return res.status(404).json({ error: `No custom persona with id: ${id}` });
  }
  return res.json({ deleted: id });
}
