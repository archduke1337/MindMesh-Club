// __tests__/components/ErrorBoundary.test.tsx
import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Mock UI components
jest.mock('@heroui/button', () => ({
    Button: ({ children, onPress, ...props }: any) => (
        <button onClick={onPress} {...props}>
            {children}
        </button>
    ),
}));

jest.mock('@heroui/card', () => ({
    Card: ({ children }: any) => <div>{children}</div>,
    CardHeader: ({ children }: any) => <div>{children}</div>,
    CardBody: ({ children }: any) => <div>{children}</div>,
    CardFooter: ({ children }: any) => <div>{children}</div>,
}));

// Component that throws an error
function ThrowError({ shouldThrow }: { shouldThrow: boolean }) {
    if (shouldThrow) {
        throw new Error('Test error');
    }
    return <div>No error</div>;
}

describe('ErrorBoundary', () => {
    // Suppress console.error for these tests
    const originalError = console.error;
    beforeAll(() => {
        console.error = jest.fn();
    });

    afterAll(() => {
        console.error = originalError;
    });

    it('should render children when there is no error', () => {
        const { getByText } = render(
            <ErrorBoundary>
                <div>Test content</div>
            </ErrorBoundary>
        );

        expect(getByText('Test content')).toBeInTheDocument();
    });

    it('should display error UI when child throws error', () => {
        const { getByText } = render(
            <ErrorBoundary>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(getByText('Something Went Wrong')).toBeInTheDocument();
        expect(getByText(/Test error/i)).toBeInTheDocument();
    });

    it('should display fallback UI if provided', () => {
        const fallback = <div>Custom error message</div>;

        const { getByText } = render(
            <ErrorBoundary fallback={fallback}>
                <ThrowError shouldThrow={true} />
            </ErrorBoundary>
        );

        expect(getByText('Custom error message')).toBeInTheDocument();
    });
});
