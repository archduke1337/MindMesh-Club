"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
    return (
        <div className={cn("prose prose-sm sm:prose md:prose-lg dark:prose-invert max-w-none", className)}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
                components={{
                    link: ({ href, children }) => {
                        // Only allow safe protocols
                        const safeHref = href && (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('mailto:'))
                            ? href
                            : '#';
                        return <a href={safeHref} target="_blank" rel="noopener noreferrer">{children}</a>;
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
