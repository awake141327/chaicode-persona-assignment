import { getPersona } from "../personas/index.js";
import { streamReply } from "../services/openai.service.js";
import { searchChannelVideos } from "../services/youtube.service.js";

const YOUTUBE_TAG_REGEX = /\[YOUTUBE_SEARCH:\s*([^\]]+)\]/i;
const TAG_PREFIX = "[YOUTUBE_SEARCH:";

// How much of the text is safe to send to the client right now.
// Everything from a (possibly still incomplete) [YOUTUBE_SEARCH: tag
// onwards is held back so the tag never flashes on the user's screen.
function safeLength(text) {
  const tagIndex = text.indexOf(TAG_PREFIX);
  if (tagIndex !== -1) return tagIndex;

  // The text might end mid-tag (e.g. "...[YOUTU") — hold back any
  // suffix that could still turn out to be the start of the tag.
  const max = Math.min(TAG_PREFIX.length - 1, text.length);
  for (let len = max; len > 0; len--) {
    if (text.endsWith(TAG_PREFIX.slice(0, len))) return text.length - len;
  }
  return text.length;
}

function sendEvent(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

// POST /api/chat  (streaming, Server-Sent Events)
// Body: { persona: "hitesh" | "piyush", messages: [{ role, content }, ...] }
// Emits: { delta } events while the reply streams,
// then a final { done: true, videos } event.
export async function chatWithPersona(req, res) {
  const { persona: personaId, messages } = req.body;

  const persona = getPersona(personaId);
  if (!persona) {
    return res.status(404).json({ error: `Unknown persona: ${personaId}` });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  let accumulated = "";
  let sentLength = 0;

  try {
    for await (const delta of streamReply(persona.systemPrompt, messages)) {
      accumulated += delta;
      const safe = safeLength(accumulated);
      if (safe > sentLength) {
        sendEvent(res, { delta: accumulated.slice(sentLength, safe) });
        sentLength = safe;
      }
    }

    // Flush any held-back text that turned out not to be a tag
    const finalReply = accumulated.replace(YOUTUBE_TAG_REGEX, "").trimEnd();
    if (finalReply.length > sentLength) {
      sendEvent(res, { delta: finalReply.slice(sentLength) });
    }

    // The persona appends [YOUTUBE_SEARCH: keyword] for tech topics —
    // turn it into video suggestions from the persona's own channels.
    const tagMatch = accumulated.match(YOUTUBE_TAG_REGEX);
    let videos = [];
    if (tagMatch) {
      videos = await searchChannelVideos(
        tagMatch[1].trim(),
        persona.youtubeChannels
      );
    }

    sendEvent(res, { done: true, videos });
  } catch (error) {
    console.error("Chat error:", error);
    sendEvent(res, { done: true, error: "Failed to generate a reply" });
  } finally {
    res.end();
  }
}
