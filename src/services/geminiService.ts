import { config } from '../config/config';
import { logger } from '../utils/logger';

const GEMINI_API_KEY = config.gemini.apiKey;
const GEMINI_MODEL = config.gemini.model || 'gemini-2.0-flash';

export async function chatWithXman(userId: string, message: string): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: message }],
          role: 'user'
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 500,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('Gemini API error', { status: response.status, error: errorText });
      return { success: false, error: `Gemini API error: ${response.status}` };
    }

    const data = await response.json() as any;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return { success: false, error: 'No response from Gemini' };
    }
    return { success: true, text };
  } catch (error: any) {
    logger.error('Gemini chat error', { error: error.message });
    return { success: false, error: error.message };
  }
}

// Alias for backward compatibility
export const askGemini = chatWithXman;
