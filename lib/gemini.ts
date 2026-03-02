import Anthropic from '@anthropic-ai/sdk';

const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
if (!apiKey) {
  throw new Error('EXPO_PUBLIC_ANTHROPIC_API_KEY is not set. Add it to your .env file.');
}

const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

export interface Recommendation {
  id: string;
  title: string;
  type: 'movie' | 'tv show' | 'book';
  genre: string;
  duration: string;
  rating?: string;
  explanation: string;
  savedAt?: number;
}

export async function getRecommendations(
  mood: string,
  genres: string[],
  timeAvailable: string,
  options?: { nostalgiaMode?: boolean },
): Promise<Recommendation[]> {
  const genreText = genres.length > 0 ? genres.join(', ') : 'No specific preference';

  const extraRules: string[] = [];
  if (options?.nostalgiaMode) {
    extraRules.push('- NOSTALGIA MODE is ON: Only recommend movies and TV shows originally released between 1990 and 2005 (inclusive). No exceptions.');
  }

  const prompt = `You are a TV show, movie, and book recommendation expert. Return EXACTLY 4 recommendations: exactly 3 movies/TV shows followed by exactly 1 book.

User's current mood: ${mood}
Genre preferences: ${genreText}
Available time: ${timeAvailable}

Return ONLY a valid JSON array (no markdown, no code blocks, no extra text) with EXACTLY 4 items in this exact format:
[
  {
    "title": "Exact Title",
    "type": "movie",
    "genre": "Primary Genre",
    "duration": "e.g. 1h 52m or ~45 min/episode",
    "rating": "e.g. PG-13",
    "explanation": "2-3 sentences explaining specifically why this matches their current mood and preferences"
  }
]

Rules:
- Items 1–3 must have "type" of exactly "movie" or "tv show" (lowercase)
- Item 4 (the last item) must have "type": "book" — choose a book whose emotional tone deeply matches the user's mood; set "duration" to estimated reading time (e.g. "~8 hours"); set "rating" to target audience (e.g. "All Ages", "Teen", "Adult")
- For movies/TV shows: "rating" must use the official US content rating (G, PG, PG-13, R, NC-17, TV-Y, TV-Y7, TV-G, TV-PG, TV-14, TV-MA)
- Mix movies and TV shows for the first 3 items when appropriate
- Consider the available time for movies/shows (avoid 3-hour films if they only have 30 min)
- Make explanations personal and specific to their stated mood
- Only suggest well-known, highly-rated content${extraRules.length > 0 ? '\n' + extraRules.join('\n') : ''}`;

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
