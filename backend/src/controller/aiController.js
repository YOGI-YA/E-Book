import { GoogleGenAI } from '@google/genai';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/api-error.js';
import { ApiResponse } from '../utils/api-response.js';

const getAiClient = () => {
  const apiKey = process.env.AI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

/**
 * Generate Multi-Day Diary Vlog Outline
 */
const generateOutline = asyncHandler(async (req, res) => {
  const { topic, style = 'Candid', numChapter = 5, description = '' } = req.body;

  if (!topic) {
    throw new ApiError(400, 'Please provide a topic or theme for your daily diary');
  }

  const ai = getAiClient();
  if (!ai) {
    throw new ApiError(500, 'AI API key not configured on server');
  }

  const prompt = `You are an expert personal essayist and written vlog creator.
Create a compelling multi-day written vlog/diary outline based on:
Theme/Topic: "${topic}"
${description ? `Context/Details: ${description}` : ''}
Tone/Style: ${style}
Number of Daily Entries: ${numChapter || 5}

Requirements:
1. Generate exactly ${numChapter || 5} daily entries.
2. Each title should be formatted like a vlog episode or journal entry, e.g.: "Day 1: The Departure & Nervous Excitement", "Day 2: When Everything Went Off Script".
3. Each description should be 2-3 sentences previewing the emotional arc, key moment, or reflection for that day.
4. Keep the vibe authentic, intimate, and engaging—like reading someone's personal daily video vlog transcribed into rich text.

Output Format:
Return ONLY a valid JSON array of objects. No markdown backticks, no explanatory text.
Each object must have exactly two keys: "title" and "description".

Example:
[
  {
    "title": "Day 1: Landing in Chaos",
    "description": "Stepping off the red-eye flight into pouring rain. Finding a midnight ramen stall and questioning why I decided to travel solo."
  }
]`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    });

    const text = response.text || '';
    const startIndex = text.indexOf('[');
    const endIndex = text.lastIndexOf(']');

    if (startIndex === -1 || endIndex === -1) {
      throw new ApiError(500, 'Failed to parse AI response into structured daily entries');
    }

    const jsonString = text.substring(startIndex, endIndex + 1);
    const outline = JSON.parse(jsonString);

    return res
      .status(200)
      .json(new ApiResponse(200, { outline }, 'Diary vlog outline generated successfully'));
  } catch (err) {
    console.error('AI Outline Error:', err);
    throw new ApiError(500, err.message || 'Failed to generate outline with AI');
  }
});

/**
 * Generate Written Daily Vlog Entry from notes or outline
 */
const generateChapterContent = asyncHandler(async (req, res) => {
  const { chapterTitle, chapterDescription, style = 'Candid', notes = '' } = req.body;

  if (!chapterTitle) {
    throw new ApiError(400, 'Entry title is required');
  }

  const ai = getAiClient();
  if (!ai) {
    throw new ApiError(500, 'AI API key not configured on server');
  }

  const prompt = `You are a talented writer creating an authentic, vlog-style written diary entry.
It should feel like a creator talking directly to their closest subscribers about their day in written form (like a daily life vlog in text).

Day / Entry Title: "${chapterTitle}"
${chapterDescription ? `Concept/Summary: ${chapterDescription}` : ''}
${notes ? `User Raw Notes/Events: ${notes}` : ''}
Writing Style: ${style} (e.g. Candid, Reflective, Humorous, Inspiring, Chill)

Guidelines:
- Write in first person ("I woke up today...", "Here's what nobody tells you about...").
- Include sensory details, real human thoughts, triumphs, or vulnerabilities.
- Adapt the length naturally to the user's notes and emotions—whether a quick, punchy 3-sentence daily thought or an expansive memory.
- Feel free to include placeholders for photos or videos where relevant (e.g. "[Photo: sunset from the balcony]").
- Format with clean paragraph breaks.
- Return plain text / clean markdown prose without extra meta comments.

Write the diary entry now:`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: prompt,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, { content: response.text }, 'Generated daily entry successfully'));
  } catch (err) {
    console.error('AI Content Error:', err);
    throw new ApiError(500, err.message || 'Failed to generate diary content');
  }
});

export { generateOutline, generateChapterContent };
