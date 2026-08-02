"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askGemini = void 0;
exports.chatWithXman = chatWithXman;
const config_1 = require("../config/config");
const logger_1 = require("../utils/logger");
const GEMINI_API_KEY = config_1.config.gemini.apiKey;
const GEMINI_MODEL = config_1.config.gemini.model || 'gemini-2.0-flash';
async function chatWithXman(userId, message) {
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
            logger_1.logger.error('Gemini API error', { status: response.status, error: errorText });
            return { success: false, error: `Gemini API error: ${response.status}` };
        }
        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            return { success: false, error: 'No response from Gemini' };
        }
        return { success: true, text };
    }
    catch (error) {
        logger_1.logger.error('Gemini chat error', { error: error.message });
        return { success: false, error: error.message };
    }
}
// Alias for backward compatibility
exports.askGemini = chatWithXman;
//# sourceMappingURL=geminiService.js.map