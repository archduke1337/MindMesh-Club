/**
 * Logger utility for consistent logging across the application.
 * Error and warn logs always appear. Debug/info/log only in development.
 */
export const logger = {
    log: (...args: any[]) => {
        if (process.env.NODE_ENV === 'development') {
            console.log(...args);
        }
    },
    error: (...args: any[]) => {
        // Always log errors, even in production
        console.error(...args);
    },
    warn: (...args: any[]) => {
        // Always log warnings, even in production
        console.warn(...args);
    },
    info: (...args: any[]) => {
        if (process.env.NODE_ENV === 'development') {
            console.info(...args);
        }
    },
    debug: (...args: any[]) => {
        if (process.env.NODE_ENV === 'development') {
            console.debug(...args);
        }
    }
};
