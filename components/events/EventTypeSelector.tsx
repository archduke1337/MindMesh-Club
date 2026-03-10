// components/events/EventTypeSelector.tsx
// ═══════════════════════════════════════════════════════
// Event type picker — shown first when creating an event
// Renders a card grid of all 11 event types with icons
// ═══════════════════════════════════════════════════════
"use client";

import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { EventType } from "@/lib/events/types";
import { getEventTypeOptions } from "@/lib/events/registry";

// Lucide-style icons mapped to event type icon names
const ICON_MAP: Record<string, string> = {
  Code: "💻",
  Trophy: "🏆",
  GraduationCap: "🎓",
  Mic: "🎤",
  BookOpen: "📖",
  Presentation: "🎪",
  PartyPopper: "🎉",
  CalendarRange: "📅",
  Monitor: "🖥️",
  UserPlus: "👥",
  Flame: "🔥",
};

interface EventTypeSelectorProps {
  selectedType: EventType | null;
  onSelect: (type: EventType) => void;
}

export default function EventTypeSelector({
  selectedType,
  onSelect,
}: EventTypeSelectorProps) {
  const options = getEventTypeOptions();

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Choose Event Type</h3>
        <p className="text-sm text-default-500">
          This determines registration flow, ticketing, features, and admin tools.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {options.map((option) => {
          const isSelected = selectedType === option.value;
          return (
            <Card
              key={option.value}
              isPressable
              onPress={() => onSelect(option.value)}
              className={`transition-all ${
                isSelected
                  ? "border-2 border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "border-2 border-transparent hover:border-default-300"
              }`}
            >
              <CardBody className="p-3 text-center gap-2">
                <span className="text-2xl">
                  {ICON_MAP[option.icon] || "📋"}
                </span>
                <p className="font-medium text-sm">{option.label}</p>
                <p className="text-xs text-default-400 line-clamp-2">
                  {option.description}
                </p>
                {isSelected && (
                  <Chip size="sm" color="primary" variant="flat">
                    Selected
                  </Chip>
                )}
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
