// components/ErrorBoundary.tsx
'use client';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@heroui/button';
import { Card, CardBody, CardFooter, CardHeader } from '@heroui/card';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
    hasError: boolean;
    error?: Error;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        // Log the error to console
        console.error('ErrorBoundary caught an error:', error, errorInfo);

        // Call custom error handler if provided
        if (this.props.onError) {
            this.props.onError(error, errorInfo);
        }

        // TODO: Send to error reporting service
        // Example: logErrorToService(error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: undefined });
    };

    handleReload = () => {
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            // Custom fallback UI if provided
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default fallback UI
            return (
                <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-danger-50 to-warning-50 dark:from-danger-950 dark:to-warning-950">
                    <Card className="w-full max-w-2xl">
                        <CardHeader className="flex flex-col gap-2 items-start">
                            <div className="flex items-center gap-2">
                                <span className="text-4xl">⚠️</span>
                                <h1 className="text-2xl font-bold text-danger">
                                    Something Went Wrong
                                </h1>
                            </div>
                        </CardHeader>

                        <CardBody className="gap-4">
                            <p className="text-default-600">
                                We apologize for the inconvenience. An unexpected error has occurred.
                            </p>

                            {this.state.error && (
                                <div className="bg-danger-50 dark:bg-danger-950/30 border border-danger-200 dark:border-danger-800 rounded-lg p-4">
                                    <p className="text-sm font-semibold text-danger-700 dark:text-danger-300 mb-2">
                                        Error Details:
                                    </p>
                                    <p className="text-xs font-mono text-danger-600 dark:text-danger-400 break-all">
                                        {this.state.error.message}
                                    </p>
                                </div>
                            )}

                            <div className="bg-default-100 dark:bg-default-900/30 rounded-lg p-4">
                                <p className="text-sm font-semibold mb-2">What you can do:</p>
                                <ul className="text-sm text-default-600 space-y-1 list-disc list-inside">
                                    <li>Try refreshing the page</li>
                                    <li>Go back and try again</li>
                                    <li>Clear your browser cache</li>
                                    <li>If the problem persists, contact support</li>
                                </ul>
                            </div>
                        </CardBody>

                        <CardFooter className="gap-3">
                            <Button
                                color="primary"
                                variant="solid"
                                onPress={this.handleReset}
                            >
                                Try Again
                            </Button>
                            <Button
                                color="default"
                                variant="flat"
                                onPress={this.handleReload}
                            >
                                Reload Page
                            </Button>
                            <Button
                                color="default"
                                variant="light"
                                as="a"
                                href="/"
                            >
                                Go to Home
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            );
        }

        return this.props.children;
    }
}

/**
 * Simplified Error Fallback Component
 * Can be used as a custom fallback prop
 */
export function ErrorFallback({ error, reset }: { error?: Error; reset?: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-6 text-center">
            <span className="text-6xl mb-4">😕</span>
            <h2 className="text-2xl font-bold mb-2">Oops!</h2>
            <p className="text-default-600 mb-4 max-w-md">
                {error?.message || 'Something went wrong. Please try again.'}
            </p>
            {reset && (
                <Button color="primary" onPress={reset}>
                    Try Again
                </Button>
            )}
        </div>
    );
}
