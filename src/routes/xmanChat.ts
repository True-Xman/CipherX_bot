import express, { Request, Response } from 'express';
import { config } from '../config/config';
import { getCurrentStage, updateCurrentStage } from '../database/db';
import { XMAN_SYSTEM_PROMPT } from '../prompts/xmanPrompt';

const router = express.Router();

// متغیرهای محیطی برای AI
const AI_API_KEY = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY;
const AI_MODEL = process.env.GEMINI_MODEL || process.env.AI_MODEL || config.gemini.model || 'google/gemini-2.0-flash';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

router.post('/api/xman/chat', async (req: Request, res: Response) => {
  console.log('📨 Xman chat request received:', req.body);
  try {
    const { userId, message, history = [] }: { userId: string; message: string; history?: ChatMessage[] } = req.body;

    if (!userId || !message) {
      return res.status(400).json({ success: false, error: 'userId and message are required' });
    }

    // دریافت مرحله‌ی فعلی کاربر از دیتابیس
    const currentStage = await getCurrentStage(userId);

    // ساخت system prompt با مرحله‌ی فعلی
    const systemPrompt = XMAN_SYSTEM_PROMPT + `\n\nCURRENT_STAGE: ${currentStage}`;

    // ساخت تاریخچه‌ی پیام‌ها برای ارسال به AI
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message },
    ];

    console.log('[xmanChat] OpenRouter request', {
      resolvedModel: AI_MODEL,
      geminiModel: process.env.GEMINI_MODEL,
      aiModel: process.env.AI_MODEL,
      apiKeyPresent: Boolean(AI_API_KEY),
    });

    // فراخوانی AI Provider (OpenRouter)
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages,
        max_tokens: 400,
        temperature: 0.7,
      }),
    });

    const data = await response.json() as any;

    if (!response.ok) {
      console.error('AI API error:', data);
      return res.status(500).json({ success: false, error: 'AI service failed' });
    }

    const reply = data.choices?.[0]?.message?.content || 'I could not process that. Please try again.';

    // تشخیص تغییر مرحله بر اساس پاسخ (ساده)
    let newStage = currentStage;
    if (reply.includes('Stage 2') || reply.includes('Illusion of Ownership')) {
      newStage = Math.min(currentStage + 1, 5);
    } else if (reply.includes('Stage 3') || reply.includes('Common Attacks')) {
      newStage = Math.min(currentStage + 1, 5);
    } else if (reply.includes('Stage 4') || reply.includes('Shift to Self-Custody')) {
      newStage = Math.min(currentStage + 1, 5);
    } else if (reply.includes('Stage 5') || reply.includes('Full Sovereignty')) {
      newStage = 5;
    }

    // بروزرسانی مرحله در دیتابیس
    if (newStage !== currentStage) {
      await updateCurrentStage(userId, newStage);
    }

    return res.json({
      success: true,
      reply,
      stage: newStage,
    });

  } catch (error) {
    console.error('Xman chat error:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
