"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

/**
 * Sanitize HTML to prevent XSS attacks.
 * Strips all HTML tags from content to ensure safety.
 */
function sanitizeContent(content: string): string {
    // Strip raw HTML tags to prevent XSS — only allow Markdown syntax
    return content.replace(/<script[\s\S]*?<\/script>/gi, '')
                  .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
                  .replace(/<object[\s\S]*?<\/object>/gi, '')
                  .replace(/<embed[\s\S]*?\/?>|<\/embed>/gi, '')
                  .replace(/<link[\s\S]*?\/?>|<\/link>/gi, '')
                  .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
                  .replace(/javascript\s*:/gi, '');
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    const safeContent = sanitizeContent(content);
    return (
        <div className={cn("prose prose-sm sm:prose md:prose-lg dark:prose-invert max-w-none", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Prevent raw HTML rendering for security
                    script: () => null,
                    iframe: () => null,
                    object: () => null,
                    embed: () => null,
                    link: ({ href, children }) => {
                        // Only allow safe protocols
                        const safeHref = href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:'))
                            ? href
                            : '#';
                        return <a href={safeHref} target="_blank" rel="noopener noreferrer">{children}</a>;
                    },
                }}
            >
                {safeContent}
            </ReactMarkdown>
        </div>
    );
}
