"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const config_1 = require("../config/config");
const db_1 = require("../database/db");
const xmanPrompt_1 = require("../prompts/xmanPrompt");
const router = express_1.default.Router();
// متغیرهای محیطی برای OpenRouter
const AI_API_KEY = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || config_1.config.openrouter?.model || 'openrouter/free';
// فیلتر امنیتی برای جلوگیری از وارد کردن seed phrase
const seedPhraseRegex = /\b([a-z]{3,12}\s+){11,23}[a-z]{3,12}\b/i;
// ======================================================
// 🔐 بررسی وضعیت کپچا
// ======================================================
router.get('/api/user/status', async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ error: "User ID is required" });
    }
    const userIdNum = Number(userId);
    if (isNaN(userIdNum)) {
        return res.status(400).json({ error: "Invalid user ID" });
    }
    try {
        const user = await (0, db_1.getUser)(userIdNum);
        if (!user) {
            return res.json({ isVerified: false });
        }
        const isVerified = user.is_verified === 1;
        res.json({ isVerified });
    }
    catch (error) {
        console.error("Error checking user status:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
// ======================================================
// 💬 پردازش پیام‌های چت Xman (با OpenRouter)
// ======================================================
router.post('/api/xman/chat', async (req, res) => {
    console.log('📨 Xman chat request received:', req.body);
    try {
        const { userId, message, history = [] } = req.body;
        if (!userId || !message) {
            return res.status(400).json({ success: false, error: 'userId and message are required' });
        }
        // 1. فیلتر امنیتی ورودی (جلوگیری از وارد کردن کلمات کلیدی)
        if (seedPhraseRegex.test(message)) {
            return res.json({
                success: true,
                reply: "⚠️ SECURITY WARNING: Never enter 12 or 24 words anywhere online! Even in this simulation. Please acknowledge this rule to continue.",
                stage: 1,
            });
        }
        // 2. دریافت وضعیت کاربر از دیتابیس
        const userIdNum = Number(userId);
        if (isNaN(userIdNum)) {
            return res.status(400).json({ success: false, error: 'Invalid userId' });
        }
        // استفاده از getCurrentStage به‌جای دسترسی مستقیم به user.current_stage
        const currentStage = await (0, db_1.getCurrentStage)(userId);
        // 3. ساخت پرامپت اختصاصی مرحله
        const systemPrompt = (0, xmanPrompt_1.buildXmanSystemPrompt)(currentStage);
        // 4. ساخت تاریخچه پیام‌ها برای OpenRouter
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: message },
        ];
        console.log('[xmanChat] OpenRouter request', {
            model: AI_MODEL,
            stage: currentStage,
            messageLength: message.length,
            historyLength: history.length,
        });
        // 5. فراخوانی OpenRouter API
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${AI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: AI_MODEL,
                messages,
                max_tokens: 300,
                temperature: 0.3,
            }),
        });
        const data = await response.json(); // <-- استفاده از as any
        if (!response.ok) {
            console.error('OpenRouter API error:', data);
            return res.status(500).json({ success: false, error: 'AI service failed' });
        }
        const reply = data.choices?.[0]?.message?.content || 'I could not process that. Please try again.';
        // 6. تشخیص تغییر مرحله بر اساس پاسخ
        let newStage = currentStage;
        const lowerReply = reply.toLowerCase();
        if (lowerReply.includes('stage 2') || lowerReply.includes('illusion of ownership')) {
            newStage = Math.min(currentStage + 1, 5);
        }
        else if (lowerReply.includes('stage 3') || lowerReply.includes('common attacks')) {
            newStage = Math.min(currentStage + 1, 5);
        }
        else if (lowerReply.includes('stage 4') || lowerReply.includes('shift to self-custody')) {
            newStage = Math.min(currentStage + 1, 5);
        }
        else if (lowerReply.includes('stage 5') || lowerReply.includes('full sovereignty') || lowerReply.includes('building the right mindset')) {
            newStage = 5;
        }
        // 7. بروزرسانی مرحله در دیتابیس
        if (newStage !== currentStage) {
            await (0, db_1.updateCurrentStage)(userId, newStage);
        }
        return res.json({
            success: true,
            reply,
            stage: newStage,
        });
    }
    catch (error) {
        console.error('Xman chat error:', error);
        return res.status(500).json({
            success: false,
            error: 'Connection interrupted. Maintain focus and try sending your message again.'
        });
    }
});
exports.default = router;
//# sourceMappingURL=xmanChat.js.map