// components/events/EventDetailSections.tsx
// ═══════════════════════════════════════════════════════
// Renders the right detail page sections for an event type
// Uses the config's detailSections array to determine
// which sections to show and in what order
// ═══════════════════════════════════════════════════════
"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { EventType, DETAIL_SECTIONS } from "@/lib/events/types";
import { getEventTypeConfig, getDetailSections } from "@/lib/events/registry";
import { getFeatureLabel } from "@/lib/events/features/feature-resolver";

interface EventDetailSectionsProps {
  eventType: EventType;
  eventData: Record<string, unknown>;
  /** Extra data like teams, speakers, etc. fetched by the parent */
  sectionData?: Record<string, unknown>;
}

/**
 * Renders ordered sections for an event detail page
 * based on the event type's config.
 */
export default function EventDetailSections({
  eventType,
  eventData,
  sectionData = {},
}: EventDetailSectionsProps) {
  const sections = getDetailSections(eventType);
  const config = getEventTypeConfig(eventType);

  return (
    <div className="space-y-6">
      {sections.map((sectionId) => {
        const SectionComponent = SECTION_RENDERERS[sectionId];
        if (!SectionComponent) return null;

        return (
          <SectionComponent
            key={sectionId}
            eventType={eventType}
            eventData={eventData}
            sectionData={sectionData}
            config={config}
          />
        );
      })}
    </div>
  );
}

// ── Section Props ───────────────────────────────────────

interface SectionProps {
  eventType: EventType;
  eventData: Record<string, unknown>;
  sectionData: Record<string, unknown>;
  config: ReturnType<typeof getEventTypeConfig>;
}

// ── Section Renderers ───────────────────────────────────

function OverviewSection({ eventData }: SectionProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold">About This Event</h2>
      </CardHeader>
      <CardBody>
        <p className="text-default-600 whitespace-pre-wrap">
          {(eventData.description as string) || "No description available."}
        </p>
      </CardBody>
    </Card>
  );
}

function ScheduleSection({ eventType, eventData }: SectionProps) {
  const label = getFeatureLabel("schedule", eventType);
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold">{label}</h2>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-default-400">Date</p>
            <p className="font-medium">{(eventData.date as string) || "TBA"}</p>
          </div>
          <div>
            <p className="text-sm text-default-400">Time</p>
            <p className="font-medium">{(eventData.time as string) || "TBA"}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function SpeakersSection({ eventType, sectionData }: SectionProps) {
  const label = getFeatureLabel("speakers", eventType);
  const speakers = (sectionData.speakers as Array<Record<string, unknown>>) || [];

  if (speakers.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold">{label}</h2>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {speakers.map((speaker, i) => (
            <div key={i} className="flex gap-3 items-center">
              <div className="w-12 h-12 rounded-full bg-default-200 flex items-center justify-center text-lg font-bold">
                {((speaker.name as string) || "?")[0]}
              </div>
              <div>
                <p className="font-medium">{(speaker.name as string) || "Speaker"}</p>
                <p className="text-sm text-default-400">
                  {(speaker.designation as string) || ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

function PrizesSection({ sectionData }: SectionProps) {
  const prizes = sectionData.prizes;
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold">Prizes</h2>
      </CardHeader>
      <CardBody>
        {prizes ? (
          <p className="text-default-600 whitespace-pre-wrap">
            {typeof prizes === "string" ? prizes : JSON.stringify(prizes, null, 2)}
          </p>
        ) : (
          <p className="text-default-400">Prize details will be announced soon.</p>
        )}
      </CardBody>
    </Card>
  );
}

function RegistrationSection({ eventType, eventData, config }: SectionProps) {
  const model = config.registration.model;
  const modelLabels: Record<string, string> = {
    team: "Team-based registration",
    individual: "Individual registration",
    application: "Application-based (requires approval)",
    rsvp: "Simple RSVP",
    dual: "Separate exhibitor & visitor registration",
    "fest-pass": "Fest pass registration",
    rolling: "Rolling (join anytime)",
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold">Registration</h2>
      </CardHeader>
      <CardBody className="gap-3">
        <div className="flex items-center gap-2">
          <Chip variant="flat" color="primary" size="sm">
            {modelLabels[model] || model}
          </Chip>
          {config.registration.requiresApproval && (
            <Chip variant="flat" color="warning" size="sm">
              Requires Approval
            </Chip>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-default-400">Capacity</p>
            <p className="font-medium">{(eventData.capacity as number) || "Unlimited"}</p>
          </div>
          <div>
            <p className="text-default-400">Registered</p>
            <p className="font-medium">{(eventData.registered as number) || 0}</p>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function VenueSection({ eventData }: SectionProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold">Venue</h2>
      </CardHeader>
      <CardBody>
        <p className="font-medium">{(eventData.venue as string) || "TBA"}</p>
        <p className="text-sm text-default-400">{(eventData.location as string) || ""}</p>
      </CardBody>
    </Card>
  );
}

function LeaderboardSection({ sectionData }: SectionProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold">Leaderboard</h2>
      </CardHeader>
      <CardBody>
        {sectionData.leaderboard ? (
          <p className="text-default-600">Leaderboard data available.</p>
        ) : (
          <p className="text-default-400">Leaderboard will be updated during the event.</p>
        )}
      </CardBody>
    </Card>
  );
}

function TeamsSection({ sectionData }: SectionProps) {
  const teamCount = (sectionData.teamCount as number) || 0;
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold">Teams</h2>
      </CardHeader>
      <CardBody>
        <p className="text-default-600">
          {teamCount > 0 ? `${teamCount} teams registered` : "Teams will appear here once formed."}
        </p>
      </CardBody>
    </Card>
  );
}

function FaqSection({ sectionData }: SectionProps) {
  const faqs = (sectionData.faqs as Array<{ q: string; a: string }>) || [];
  if (faqs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold">FAQ</h2>
      </CardHeader>
      <CardBody className="gap-3">
        {faqs.map((faq, i) => (
          <div key={i}>
            <p className="font-medium">{faq.q}</p>
            <p className="text-sm text-default-500">{faq.a}</p>
            {i < faqs.length - 1 && <Divider className="my-2" />}
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

function ContactSection({ eventData }: SectionProps) {
  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold">Contact</h2>
      </CardHeader>
      <CardBody>
        <p className="text-default-600">
          Organizer: {(eventData.organizerName as string) || "Event Organizer"}
        </p>
      </CardBody>
    </Card>
  );
}

function GenericSection({ eventType }: SectionProps & { sectionId?: string }) {
  return null; // placeholder for sections not yet fully implemented
}

// ── Section Registry ────────────────────────────────────

const SECTION_RENDERERS: Record<string, React.FC<SectionProps>> = {
  [DETAIL_SECTIONS.OVERVIEW]: OverviewSection,
  [DETAIL_SECTIONS.SCHEDULE]: ScheduleSection,
  [DETAIL_SECTIONS.SPEAKERS]: SpeakersSection,
  [DETAIL_SECTIONS.PRIZES]: PrizesSection,
  [DETAIL_SECTIONS.REGISTRATION]: RegistrationSection,
  [DETAIL_SECTIONS.VENUE]: VenueSection,
  [DETAIL_SECTIONS.LEADERBOARD]: LeaderboardSection,
  [DETAIL_SECTIONS.TEAMS]: TeamsSection,
  [DETAIL_SECTIONS.FAQ]: FaqSection,
  [DETAIL_SECTIONS.CONTACT]: ContactSection,
  // Sections with shared generic renderer (expanded later)
  [DETAIL_SECTIONS.MENTORS]: GenericSection,
  [DETAIL_SECTIONS.MATERIALS]: GenericSection,
  [DETAIL_SECTIONS.SUBMISSIONS]: GenericSection,
  [DETAIL_SECTIONS.JUDGING]: GenericSection,
  [DETAIL_SECTIONS.ROUNDS]: GenericSection,
  [DETAIL_SECTIONS.STREAMING]: GenericSection,
  [DETAIL_SECTIONS.QNA]: GenericSection,
  [DETAIL_SECTIONS.FORUM]: GenericSection,
  [DETAIL_SECTIONS.EXHIBITORS]: GenericSection,
  [DETAIL_SECTIONS.SUB_EVENTS]: GenericSection,
  [DETAIL_SECTIONS.PROBLEM_STATEMENTS]: GenericSection,
  [DETAIL_SECTIONS.PROBLEMS]: GenericSection,
  [DETAIL_SECTIONS.RESULTS]: GenericSection,
  [DETAIL_SECTIONS.GALLERY]: GenericSection,
  [DETAIL_SECTIONS.FEEDBACK]: GenericSection,
  [DETAIL_SECTIONS.SPONSORS]: GenericSection,
  [DETAIL_SECTIONS.RULES]: GenericSection,
  [DETAIL_SECTIONS.VOTING]: GenericSection,
  [DETAIL_SECTIONS.POSITIONS]: GenericSection,
  [DETAIL_SECTIONS.PROCESS]: GenericSection,
};
