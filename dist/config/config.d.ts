export declare const config: {
    telegram: {
        botToken: string;
        botUsername: string;
    };
    gemini: {
        apiKey: string;
        model: string;
    };
    openrouter: {
        apiKey: string;
        model: string;
    };
    db: {
        path: string;
    };
    api: {
        port: number;
    };
    captcha: {
        timeoutSeconds: number;
        maxAttempts: number;
        banDurationHours: number;
    };
    rateLimit: {
        windowSeconds: number;
        maxMessages: number;
    };
    defaultLanguage: string;
    nodeEnv: string;
};
export type SupportedLanguage = 'en' | 'ar' | 'tr' | 'ru';
//# sourceMappingURL=config.d.ts.map