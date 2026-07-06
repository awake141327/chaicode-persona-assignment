import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Simple JSON-file store for user-created personas. Loaded once at startup,
// kept in memory, persisted on every write. Good enough for this app's
// scale; note that on hosts with ephemeral filesystems (Railway/Vercel)
// custom personas reset on redeploy.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const STORE_FILE = path.join(DATA_DIR, "custom-personas.json");

let customPersonas = {};

try {
  customPersonas = JSON.parse(fs.readFileSync(STORE_FILE, "utf-8"));
} catch {
  customPersonas = {};
}

function persist() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(STORE_FILE, JSON.stringify(customPersonas, null, 2));
}

export function listCustomPersonas() {
  return Object.values(customPersonas);
}

export function getCustomPersona(personaId) {
  return customPersonas[personaId] || null;
}

export function saveCustomPersona(persona) {
  customPersonas[persona.id] = persona;
  persist();
}

export function deleteCustomPersona(personaId) {
  if (!customPersonas[personaId]) return false;
  delete customPersonas[personaId];
  persist();
  return true;
}
