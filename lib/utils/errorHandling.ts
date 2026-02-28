// lib/utils/errorHandling.ts
import { toast } from 'sonner';
import { ZodError } from 'zod';
import { getErrorMessage, getErrorDetails, isError } from '../errorHandler';

// Re-export from canonical source to avoid duplication
export { getErrorMessage, getErrorDetails, isError };

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: ZodError): string {
    const firstError = error.issues[0];
    if (firstError) {
        return `${firstError.path.join('.')}: ${firstError.message}`;
    }
    return 'Validation failed';
}

/**
 * Handle API errors with appropriate user feedback
 */
export function handleApiError(error: unknown, context?: string): void {
    console.error(`API Error${context ? ` (${context})` : ''}:`, error);

    // Handle Zod validation errors
    if (error instanceof ZodError) {
        const message = handleZodError(error);
        showErrorToast(message);
        return;
    }

    // Handle fetch/network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
        showErrorToast('Network error. Please check your connection and try again.');
        return;
    }

    // Handle Appwrite errors
    if (error && typeof error === 'object' && 'code' in error) {
        const appwriteError = error as { code: number; message: string };

        switch (appwriteError.code) {
            case 401:
                showErrorToast('Please log in to continue');
                break;
            case 403:
                showErrorToast('You do not have permission to perform this action');
                break;
            case 404:
                showErrorToast('The requested resource was not found');
                break;
            case 409:
                showErrorToast(appwriteError.message || 'A conflict occurred');
                break;
            case 429:
                showErrorToast('Too many requests. Please try again later');
                break;
            case 500:
            case 502:
            case 503:
                showErrorToast('Server error. Please try again later');
                break;
            default:
                showErrorToast(appwriteError.message || 'An error occurred');
        }
        return;
    }

    // Default error message
    const message = getErrorMessage(error);
    showErrorToast(message);
}

/**
 * Show error toast notification
 */
export function showErrorToast(message: string): void {
    toast.error(message, {
        duration: 5000,
    });
}

/**
 * Show success toast notification
 */
export function showSuccessToast(message: string): void {
    toast.success(message, {
        duration: 3000,
    });
}

/**
 * Show info toast notification
 */
export function showInfoToast(message: string): void {
    toast.info(message, {
        duration: 4000,
    });
}

/**
 * Show warning toast notification
 */
export function showWarningToast(message: string): void {
    toast.warning(message, {
        duration: 4000,
    });
}

/**
 * Log error to console and potentially to external service
 * In the future, this could send to Sentry, LogRocket, etc.
 */
export function logError(error: unknown, context?: string, additionalData?: Record<string, unknown>): void {
    const errorMessage = getErrorMessage(error);
    const timestamp = new Date().toISOString();

    console.error('[Error Log]', {
        timestamp,
        context,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        ...additionalData,
    });

    // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
    // Example:
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, {
    //     contexts: { custom: { context, ...additionalData } }
    //   });
    // }
}

/**
 * Async error handler wrapper
 * Wraps async functions to catch and handle errors
 */
export function withErrorHandling<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    context?: string
): T {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        try {
            return await fn(...args);
        } catch (error) {
            handleApiError(error, context);
            throw error; // Re-throw so caller can handle if needed
        }
    }) as T;
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number;
        initialDelay?: number;
        maxDelay?: number;
        backoffFactor?: number;
    } = {}
): Promise<T> {
    const {
        maxRetries = 3,
        initialDelay = 1000,
        maxDelay = 10000,
        backoffFactor = 2,
    } = options;

    let lastError: unknown;
    let delay = initialDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Don't retry on client errors (4xx)
            if (error && typeof error === 'object' && 'code' in error) {
                const code = (error as { code: number }).code;
                if (code >= 400 && code < 500) {
                    throw error;
                }
            }

            // Last attempt failed
            if (attempt === maxRetries) {
                break;
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));

            // Increase delay for next attempt
            delay = Math.min(delay * backoffFactor, maxDelay);

            console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        }
    }

    throw lastError;
}

/**
 * Validate and handle response from API
 */
export async function validateApiResponse<T>(
    response: Response,
    context?: string
): Promise<T> {
    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
            const errorData = await response.json();
            if (errorData.error) {
                errorMessage = errorData.error;
            } else if (errorData.message) {
                errorMessage = errorData.message;
            }
        } catch {
            // Could not parse error response
        }

        const error = new Error(errorMessage);
        handleApiError(error, context);
        throw error;
    }

    try {
        return await response.json();
    } catch (error) {
        logError(error, `Failed to parse response for: ${context}`);
        throw new Error('Failed to parse server response');
    }
}
