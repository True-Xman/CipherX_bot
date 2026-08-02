import { config } from '../config/config';
import { logger } from '../utils/logger';

const OPENROUTER_API_KEY = config.openrouter.apiKey;
const OPENROUTER_MODEL = config.openrouter.model || 'openrouter/free';

export async function chatWithOpenRouter(userId: string, message: string): Promise<{ success: boolean; text?: string; error?: string }> {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENROUTER_MODEL,
        messages: [
          { role: 'system', content: 'You are Xman, a Web3 assistant.' },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error('OpenRouter API error', { status: response.status, error: errorText });
      return { success: false, error: `OpenRouter API error: ${response.status}` };
    }

    const data: any = await response.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      return { success: false, error: 'No response from OpenRouter' };
    }
    return { success: true, text };
  } catch (error: any) {
    logger.error('OpenRouter chat error', { error: error.message });
    return { success: false, error: error.message };
  }
}
