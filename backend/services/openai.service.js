import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Appended to every persona's system prompt so replies stay
// chat-sized instead of blog-sized.
const BREVITY_RULE = `

### Response Length:
Keep responses short and chat-friendly — a few sentences, or one compact code block with a line or two of explanation. No long multi-section breakdowns unless the user explicitly asks for a detailed/deep explanation.`;

// Streams the model's reply token by token. Yields text deltas.
export async function* streamReply(systemPrompt, history) {
  const stream = await client.chat.completions.create({
    model: "gpt-5-mini",
    stream: true,
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
