/** @format */

import { config } from './config/ollama-config.ts';

type OllamaChatResponse = {
  readonly message?: { readonly content?: string };
};

type ScoreReplyOpportunityResult = {
  readonly score: number;
  readonly shouldReply: boolean;
  readonly reason: string;
};

type ScoreReplyOpportunityResponse = {
  readonly score?: number;
  readonly should_reply?: boolean;
  readonly reason?: string;
};

/**
 * Send a chat request to the local Ollama instance.
 */
async function ollamaChat(systemPrompt: string, userPrompt: string): Promise<string> {
  const { baseUrl, model } = config.ollama;
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      stream: false,
      options: {
        temperature: 0.85,
        num_ctx: 4096,
        top_p: 0.9
      },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });
  if (!response.ok) throw new Error(`Ollama API error ${response.status}: ${await response.text()}`);

  const data = (await response.json()) as OllamaChatResponse;

  console.log(
    'systemPrompt: ' +
      systemPrompt +
      '\nuserPrompt: ' +
      userPrompt +
      '\nResponse' +
      (data.message?.content?.trim() ?? '')
  );
  return data.message?.content?.trim() ?? '';
}

/**
 * Ask the model to score whether a reply opportunity exists.
 * Returns an object with shouldReply, reason, and score fields.
 */
export async function scoreReplyOpportunity(chatHistory: string): Promise<ScoreReplyOpportunityResult> {
  const { name } = config.bot;
  const systemPrompt = `You are a silent observer of a group chat. Your job is to decide if ${name} — a witty, laid-back human — should chime in.

Reply ONLY with a valid JSON object, no markdown, no explanation. Example:
{"score": 7, "should_reply": true, "reason": "Good setup for a pun"}

Score criteria (1-10):
- 8-10: Clear joke opportunity, direct question to the group, fascinating claim worth a quip
- 5-7: Mildly interesting, could add something small
- 1-4: Mid-conversation, serious topic, nothing to add

Be conservative. It's better to stay silent than to force a response.`;
  const userPrompt = `Recent chat:\n${chatHistory}\n\nShould ${name} reply? Respond with JSON only.`;
  const raw = await ollamaChat(systemPrompt, userPrompt);

  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean) as ScoreReplyOpportunityResponse;

    return {
      score: parsed.score ?? 0,
      shouldReply: parsed.should_reply === true,
      // shouldReply: (parsed.score ?? 0) >= 7,
      reason: parsed.reason ?? ''
    };
  } catch {
    console.warn('⚠️  Failed to parse scoring JSON:', raw);

    return { score: 0, shouldReply: false, reason: 'parse error' };
  }
}

/**
 * Generate a reply given recent chat history and optionally retrieved past messages.
 *
 * @param recentHistory - Last N messages formatted as "Author: message"
 * @param retrievedContext - Semantically similar past messages from vector store
 */
export async function generateReply(recentHistory: string, retrievedContext: readonly string[] = []): Promise<string> {
  const { name } = config.bot;
  const systemPrompt = `You are ${name}, a Bot member of this Discord group chat.

Your personality:
- Witty, dry, maybe sarcastic, but never try-hard
- Occasionally drop useful info if it's genuinely relevant
- Keep messages SHORT — 1 sentence, maybe 2 at most
- Match the group's energy and tone and themes (Gaming, ARPG, Path of Exile, Anime, VTubers, Pop culture)
- Never start with "I" — vary your openers
- Never use filler phrases like "Absolutely!" or "Great point!"
- Use lowercase casually, like a real person texting, but don't pretend you are human.
- You are directly replying to the last message below.

Your goal: contribute one natural, human message. Make it count.\n`;
  // Each element of retrievedContext is a multi-line block of consecutive
  // messages. Separate blocks with a divider so the model understands they
  // are distinct conversation snippets, not one continuous thread.
  const ragSection =
    retrievedContext.length > 0
      ? `[Relevant past conversations — use for context only, do not reference directly]\n${retrievedContext.join('\n---\n')}\n\n`
      : '';
  const userPrompt = `${ragSection}[Recent chat]\n${recentHistory}\n\nWrite your reply as ${name}. One short message only.`;

  return await ollamaChat(systemPrompt, userPrompt);
}
