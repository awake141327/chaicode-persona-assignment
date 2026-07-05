import { hiteshPersona } from "./hitesh.persona.js";
import { piyushPersona } from "./piyush.persona.js";

export const PERSONAS = {
  [hiteshPersona.id]: hiteshPersona,
  [piyushPersona.id]: piyushPersona,
};

export function getPersona(personaId) {
  return PERSONAS[personaId] || null;
}
