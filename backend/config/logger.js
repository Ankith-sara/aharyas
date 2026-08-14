const logger = {
    error: (msg, meta) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`, meta || ''),
    warn: (msg) => console.warn(`[WARN]  ${new Date().toISOString()} ${msg}`),
    info: (msg) => console.log(`[INFO]  ${new Date().toISOString()} ${msg}`),
    debug: (msg) => process.env.NODE_ENV === 'development' && console.log(`[DEBUG] ${new Date().toISOString()} ${msg}`)
};

export default logger;
