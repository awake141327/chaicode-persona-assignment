import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Appended to every persona's system prompt so replies stay
// chat-sized instead of blog-sized.
const BREVITY_RULE = `

### Response Length:
Keep responses short and chat-friendly — a few sentences, or one compact code block with a line or two of explanation. No long multi-section breakdowns unless the user explicitly asks for a detailed/deep explanation.`;

// Hard ceiling on a single reply. This budget also covers gpt-5's internal
// reasoning tokens, so it's set generously enough that a genuinely detailed
// answer (with a full code block) finishes cleanly; the BREVITY_RULE keeps
// everyday replies far below it. Its real job is a safety cap on cost and
// runaway generation. gpt-5 models require `max_completion_tokens` (the
// older `max_tokens` is rejected).
const MAX_COMPLETION_TOKENS = 1500;

// Streams the model's reply token by token. Yields text deltas.
export async function* streamReply(systemPrompt, history) {
  const stream = await client.chat.completions.create({
    model: "gpt-5-mini",
    stream: true,
    max_completion_tokens: MAX_COMPLETION_TOKENS,
    messages: [
      { role: "system", content: systemPrompt + BREVITY_RULE },
      ...history,
    ],
  });

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) yield delta;
  }
}
