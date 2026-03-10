// components/events/AdminEventTabs.tsx
// ═══════════════════════════════════════════════════════
// Renders admin tabs dynamically based on event type config.
// Each tab maps to a feature panel.
// ═══════════════════════════════════════════════════════
"use client";

import { useState } from "react";
import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { EventType, ADMIN_TABS } from "@/lib/events/types";
import { getEventTypeConfig, getAdminTabs } from "@/lib/events/registry";
import { getFeatureLabel } from "@/lib/events/features/feature-resolver";

interface AdminEventTabsProps {
  eventType: EventType;
  eventId: string;
  eventData: Record<string, unknown>;
  /** Pass tab-specific data (registrations list, teams, etc.) */
  tabData?: Record<string, unknown>;
  /** Callback when a tab needs fresh data */
  onTabChange?: (tabId: string) => void;
}

// Tab display labels and icons
const TAB_META: Record<
  string,
  { label: string; icon: string; description: string }
> = {
  [ADMIN_TABS.OVERVIEW]: {
    label: "Overview",
    icon: "📊",
    description: "Event summary and quick stats",
  },
  [ADMIN_TABS.REGISTRATIONS]: {
    label: "Registrations",
    icon: "📋",
    description: "Manage registered participants",
  },
  [ADMIN_TABS.TEAMS]: {
    label: "Teams",
    icon: "👥",
    description: "Team management and invite codes",
  },
  [ADMIN_TABS.ROUNDS]: {
    label: "Rounds",
    icon: "🔄",
    description: "Manage rounds, brackets, elimination",
  },
  [ADMIN_TABS.CHECK_IN]: {
    label: "Check-In",
    icon: "✅",
    description: "QR scan and attendance tracking",
  },
  [ADMIN_TABS.SUBMISSIONS]: {
    label: "Submissions",
    icon: "📁",
    description: "Review and manage submissions",
  },
  [ADMIN_TABS.JUDGING]: {
    label: "Judging",
    icon: "⚖️",
    description: "Judges, criteria, and scoring",
  },
  [ADMIN_TABS.LEADERBOARD]: {
    label: "Leaderboard",
    icon: "🏅",
    description: "Rankings and scores",
  },
  [ADMIN_TABS.SCHEDULE]: {
    label: "Schedule",
    icon: "📅",
    description: "Event timeline and sessions",
  },
  [ADMIN_TABS.SPEAKERS]: {
    label: "Speakers",
    icon: "🎤",
    description: "Manage speakers and presenters",
  },
  [ADMIN_TABS.MATERIALS]: {
    label: "Materials",
    icon: "📚",
    description: "Resources, slides, and files",
  },
  [ADMIN_TABS.CERTIFICATES]: {
    label: "Certificates",
    icon: "🏅",
    description: "Generate and distribute certificates",
  },
  [ADMIN_TABS.PRIZES]: {
    label: "Prizes",
    icon: "🏆",
    description: "Prize distribution and tracking",
  },
  [ADMIN_TABS.MENTORS]: {
    label: "Mentors",
    icon: "🧑‍🏫",
    description: "Mentor assignments and management",
  },
  [ADMIN_TABS.EXHIBITORS]: {
    label: "Exhibitors",
    icon: "🎪",
    description: "Exhibitor booths and details",
  },
  [ADMIN_TABS.SUB_EVENTS]: {
    label: "Sub-Events",
    icon: "📋",
    description: "Manage individual events within the fest",
  },
  [ADMIN_TABS.APPLICATIONS]: {
    label: "Applications",
    icon: "📝",
    description: "Review and approve applications",
  },
  [ADMIN_TABS.SHORTLIST]: {
    label: "Shortlist",
    icon: "✨",
    description: "Shortlisted candidates",
  },
  [ADMIN_TABS.INTERVIEW_SLOTS]: {
    label: "Interview Slots",
    icon: "🕐",
    description: "Manage interview scheduling",
  },
  [ADMIN_TABS.PROBLEMS]: {
    label: "Problems",
    icon: "🧩",
    description: "Problem statements and challenges",
  },
  [ADMIN_TABS.FEST_PASSES]: {
    label: "Fest Passes",
    icon: "🎫",
    description: "Pass management and tiers",
  },
  [ADMIN_TABS.SPONSORS]: {
    label: "Sponsors",
    icon: "💰",
    description: "Sponsor management",
  },
  [ADMIN_TABS.ATTENDANCE]: {
    label: "Attendance",
    icon: "📍",
    description: "Track participant attendance",
  },
  [ADMIN_TABS.ANALYTICS]: {
    label: "Analytics",
    icon: "📈",
    description: "Event analytics and insights",
  },
  [ADMIN_TABS.FEEDBACK]: {
    label: "Feedback",
    icon: "💬",
    description: "Participant feedback and ratings",
  },
  [ADMIN_TABS.RESULTS]: {
    label: "Results",
    icon: "🏁",
    description: "Publish and manage results",
  },
  [ADMIN_TABS.SETTINGS]: {
    label: "Settings",
    icon: "⚙️",
    description: "Event configuration",
  },
  [ADMIN_TABS.EXPORT]: {
    label: "Export",
    icon: "📤",
    description: "Export data (CSV, PDF)",
  },
  [ADMIN_TABS.GALLERY]: {
    label: "Gallery",
    icon: "🖼️",
    description: "Event photos and media",
  },
  [ADMIN_TABS.STREAMING]: {
    label: "Streaming",
    icon: "📡",
    description: "Live stream configuration",
  },
  [ADMIN_TABS.VOTING]: {
    label: "Voting",
    icon: "🗳️",
    description: "Audience voting and polls",
  },
  [ADMIN_TABS.FORUM]: {
    label: "Forum",
    icon: "💭",
    description: "Discussion forum management",
  },
};

export default function AdminEventTabs({
  eventType,
  eventId,
  eventData,
  tabData = {},
  onTabChange,
}: AdminEventTabsProps) {
  const tabs = getAdminTabs(eventType);
  const [activeTab, setActiveTab] = useState(tabs[0] || "overview");

  const handleTabChange = (key: React.Key) => {
    const tabId = key as string;
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className="space-y-4">
      <Tabs
        selectedKey={activeTab}
        onSelectionChange={handleTabChange}
        variant="underlined"
        classNames={{
          tabList: "gap-4 w-full overflow-x-auto flex-wrap",
        }}
      >
        {tabs.map((tabId) => {
          const meta = TAB_META[tabId] || {
            label: tabId,
            icon: "📋",
            description: "",
          };
          return (
            <Tab
              key={tabId}
              title={
                <div className="flex items-center gap-1.5">
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </div>
              }
            />
          );
        })}
      </Tabs>

      {/* Tab content area */}
      <Card>
        <CardBody>
          <AdminTabContent
            tabId={activeTab}
            eventType={eventType}
            eventId={eventId}
            eventData={eventData}
            tabData={tabData}
          />
        </CardBody>
      </Card>
    </div>
  );
}

// ── Tab Content Router ──────────────────────────────────

function AdminTabContent({
  tabId,
  eventType,
  eventId,
  eventData,
  tabData,
}: {
  tabId: string;
  eventType: EventType;
  eventId: string;
  eventData: Record<string, unknown>;
  tabData: Record<string, unknown>;
}) {
  const meta = TAB_META[tabId];

  // Placeholder content — each tab will be implemented
  // with its own component as the admin UI evolves
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{meta?.label || tabId}</h3>
          <p className="text-sm text-default-400">{meta?.description || ""}</p>
        </div>
        <Chip size="sm" variant="flat" color="default">
          {eventType}
        </Chip>
      </div>
      <p className="text-default-500 text-sm">
        Tab content for &quot;{meta?.label || tabId}&quot; will render here.
        This tab is configured for {eventType} events.
      </p>
    </div>
  );
}
