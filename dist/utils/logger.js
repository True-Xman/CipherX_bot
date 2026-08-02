"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
function log(level, message, meta) {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    const line = `[${timestamp}] [${level}] ${message}${metaStr}`;
    if (level === 'ERROR') {
        console.error(line);
    }
    else {
        console.log(line);
    }
}
exports.logger = {
    info: (message, meta) => log('INFO', message, meta),
    warn: (message, meta) => log('WARN', message, meta),
    error: (message, meta) => log('ERROR', message, meta),
    debug: (message, meta) => {
        if (process.env.NODE_ENV !== 'production') {
            log('DEBUG', message, meta);
        }
    },
};
//# sourceMappingURL=logger.js.map