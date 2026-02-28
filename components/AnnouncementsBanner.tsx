"use client";
import { useEffect, useState } from "react";
import { Button } from "@heroui/button";
import NextLink from "next/link";

interface Announcement {
  $id: string;
  title: string;
  content: string;
  type: "info" | "event" | "urgent" | "update";
  priority: "low" | "normal" | "high" | "critical";
  isPinned: boolean;
  link: string | null;
  linkText: string | null;
}

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-default-100 text-default-700 border-default-200",
  normal: "bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-800",
  high: "bg-warning-50 text-warning-700 border-warning-200 dark:bg-warning-900/30 dark:text-warning-300 dark:border-warning-800",
  critical: "bg-danger-50 text-danger-700 border-danger-200 dark:bg-danger-900/30 dark:text-danger-300 dark:border-danger-800",
};

const TYPE_ICONS: Record<string, string> = {
  info: "ℹ️",
  event: "🎉",
  urgent: "🚨",
  update: "🔔",
};

export default function AnnouncementsBanner() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements");
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch {
      // Silent fail
    }
  };

  const visibleAnnouncements = announcements.filter(
    (a) => !dismissed.has(a.$id)
  );

  if (visibleAnnouncements.length === 0) return null;

  const current = visibleAnnouncements[currentIndex % visibleAnnouncements.length];
  if (!current) return null;

  return (
    <div
      className={`border-b px-4 py-2.5 flex items-center gap-3 ${PRIORITY_STYLES[current.priority] || PRIORITY_STYLES.normal}`}
    >
      <span className="text-sm flex-shrink-0">
        {TYPE_ICONS[current.type] || TYPE_ICONS.info}
      </span>

      <div className="flex-1 min-w-0">
        <span className="font-semibold text-sm mr-2">{current.title}</span>
        <span className="text-sm opacity-80 truncate">{current.content}</span>
      </div>

      {current.link && (
        <Button
          as={NextLink}
          href={current.link}
          size="sm"
          variant="flat"
          className="flex-shrink-0 text-xs"
        >
          {current.linkText || "View"}
        </Button>
      )}

      {visibleAnnouncements.length > 1 && (
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() =>
              setCurrentIndex(
                (currentIndex - 1 + visibleAnnouncements.length) %
                  visibleAnnouncements.length
              )
            }
            className="text-xs opacity-60 hover:opacity-100 p-1"
            aria-label="Previous"
          >
            ‹
          </button>
          <span className="text-xs opacity-50 self-center">
            {(currentIndex % visibleAnnouncements.length) + 1}/
            {visibleAnnouncements.length}
          </span>
          <button
            onClick={() =>
              setCurrentIndex(
                (currentIndex + 1) % visibleAnnouncements.length
              )
            }
            className="text-xs opacity-60 hover:opacity-100 p-1"
            aria-label="Next"
          >
            ›
          </button>
        </div>
      )}

      <button
        onClick={() => {
          setDismissed((prev) => new Set(Array.from(prev).concat(current.$id)));
          setCurrentIndex(0);
        }}
        className="text-xs opacity-40 hover:opacity-100 flex-shrink-0 p-1"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}
