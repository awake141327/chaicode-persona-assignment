import { hiteshPersona } from "./hitesh.persona.js";
import { piyushPersona } from "./piyush.persona.js";
import { getCustomPersona } from "../services/personaStore.service.js";

export const PERSONAS = {
  [hiteshPersona.id]: hiteshPersona,
  [piyushPersona.id]: piyushPersona,
};

// Built-in personas first, then user-created ones from the store
export function getPersona(personaId) {
  return PERSONAS[personaId] || getCustomPersona(personaId) || null;
}
