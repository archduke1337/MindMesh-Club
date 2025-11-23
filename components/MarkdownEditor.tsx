"use client";

import React, { useState } from 'react';
import { Tabs, Tab } from "@heroui/tabs";
import { Textarea } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { MarkdownRenderer } from './MarkdownRenderer';
import { PenLine, Eye } from 'lucide-react';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    minRows?: number;
    className?: string;
    isRequired?: boolean;
}

export function MarkdownEditor({
    value,
    onChange,
    label = "Description",
    placeholder = "Write your content in Markdown...",
    minRows = 10,
    className,
    isRequired = false
}: MarkdownEditorProps) {
    const [activeTab, setActiveTab] = useState<string>("write");

    return (
        <div className={className}>
            <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold flex items-center gap-1">
                    {label} {isRequired && <span className="text-danger">*</span>}
                </label>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab("write")}
                        className={`text-xs flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${activeTab === "write"
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-default-500 hover:text-default-700"
                            }`}
                    >
                        <PenLine size={14} />
                        Write
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab("preview")}
                        className={`text-xs flex items-center gap-1 px-2 py-1 rounded-md transition-colors ${activeTab === "preview"
                                ? "bg-primary/10 text-primary font-medium"
                                : "text-default-500 hover:text-default-700"
                            }`}
                    >
                        <Eye size={14} />
                        Preview
                    </button>
                </div>
            </div>

            {activeTab === "write" ? (
                <Textarea
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    minRows={minRows}
                    classNames={{
                        input: "font-mono text-sm"
                    }}
                />
            ) : (
                <Card className="border-default-200 border shadow-sm">
                    <CardBody className="bg-content1 min-h-[200px] p-4">
                        {value ? (
                            <MarkdownRenderer content={value} />
                        ) : (
                            <p className="text-default-400 italic text-center mt-10">Nothing to preview</p>
                        )}
                    </CardBody>
                </Card>
            )}

            <div className="mt-1 text-xs text-default-400 flex justify-end">
                Markdown supported
            </div>
        </div>
    );
}
