import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
if (!apiKey) {
  throw new Error('EXPO_PUBLIC_ANTHROPIC_API_KEY is not set. Add it to your .env file.');
}

const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

export interface Recommendation {
  id: string;
  title: string;
  type: 'movie' | 'tv show';
  genre: string;
  duration: string;
  explanation: string;
  savedAt?: number;
}

export async function getRecommendations(
  mood: string,
  genres: string[],
  timeAvailable: string,
): Promise<Recommendation[]> {
  const genreText = genres.length > 0 ? genres.join(', ') : 'No specific preference';

  const prompt = `You are a TV show and movie recommendation expert. Based on the user's mood, genre preferences, and available time, suggest 3-5 perfectly tailored TV shows or movies.

User's current mood: ${mood}
Genre preferences: ${genreText}
Available time: ${timeAvailable}

Return ONLY a valid JSON array (no markdown, no code blocks, no extra text) with 3-5 recommendations in this exact format:
[
  {
    "title": "Exact Title",
    "type": "movie",
    "genre": "Primary Genre",
    "duration": "e.g. 1h 52m or ~45 min/episode",
    "explanation": "2-3 sentences explaining specifically why this matches their current mood and preferences"
  }
]

Rules:
- "type" must be exactly "movie" or "tv show" (lowercase)
- Mix movies and TV shows when appropriate
- Consider the available time (avoid 3-hour films if they only have 30 min)
- Make explanations personal and specific to their stated mood
- Only suggest well-known, highly-rated content`;

  console.log('[Anthropic] Sending request — model: claude-haiku-4-5-20251001, mood:', mood, '| genres:', genreText, '| time:', timeAvailable);

  let response;
  try {
    response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });
  } catch (apiErr) {
    console.error('[Anthropic] API call failed:', apiErr);
    throw apiErr;
  }

  const rawText = (response.content[0].type === 'text' ? response.content[0].text : '').trim();
  console.log('[Anthropic] Raw response:', rawText);

  // Strip any markdown code fences if present
  const jsonText = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  let parsed: Omit<Recommendation, 'id'>[];
  try {
    parsed = JSON.parse(jsonText) as Omit<Recommendation, 'id'>[];
  } catch (parseErr) {
    console.error('[Anthropic] JSON parse failed. Raw text was:', rawText);
    throw parseErr;
  }

  const timestamp = Date.now();

  return parsed.map((rec, i) => ({
    ...rec,
    id: `${rec.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${timestamp}-${i}`,
  }));
}
