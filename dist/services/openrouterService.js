"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatWithOpenRouter = chatWithOpenRouter;
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
const OPENROUTER_API_KEY = config_1.config.openrouter.apiKey;
const OPENROUTER_MODEL = config_1.config.openrouter.model || 'openrouter/free';
async function chatWithOpenRouter(userId, message) {
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
                max_tokens: 300,
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            logger_1.logger.error('OpenRouter API error', { status: response.status, error: errorText });
            return { success: false, error: `OpenRouter API error: ${response.status}` };
        }
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (!text) {
            return { success: false, error: 'No response from OpenRouter' };
        }
        return { success: true, text };
    }
    catch (error) {
        logger_1.logger.error('OpenRouter chat error', { error: error.message });
        return { success: false, error: error.message };
    }
}
//# sourceMappingURL=openrouterService.js.map