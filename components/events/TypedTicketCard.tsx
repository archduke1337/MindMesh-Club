// components/events/TypedTicketCard.tsx
// ═══════════════════════════════════════════════════════
// Renders a ticket card with a layout that varies by
// ticket template (team, individual, pass, virtual, etc.)
// ═══════════════════════════════════════════════════════
"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import type {
  TicketData,
  IndividualTicketData,
  TeamTicketData,
  PassTicketData,
  VirtualTicketData,
  SlotTicketData,
  EnrollmentTicketData,
  MinimalTicketData,
} from "@/lib/events/tickets/types";

interface TypedTicketCardProps {
  ticket: TicketData;
  /** Optional rendered QR code element */
  qrElement?: React.ReactNode;
  className?: string;
}

export default function TypedTicketCard({
  ticket,
  qrElement,
  className = "",
}: TypedTicketCardProps) {
  return (
    <Card className={`max-w-md ${className}`} shadow="md">
      <CardHeader className="flex flex-col items-start gap-1 pb-2">
        <div className="flex items-center justify-between w-full">
          <h3 className="text-lg font-bold">{ticket.eventTitle}</h3>
          <TemplateChip template={ticket.template} />
        </div>
        <p className="text-xs text-default-400 font-mono">{ticket.ticketId}</p>
      </CardHeader>

      <Divider />

      <CardBody className="gap-4">
        {/* Delegate to template-specific renderer */}
        <TicketContent ticket={ticket} />

        {/* QR code section */}
        {qrElement && (
          <>
            <Divider />
            <div className="flex justify-center py-2">{qrElement}</div>
          </>
        )}

        {/* Status footer */}
        <div className="flex items-center justify-between text-xs text-default-400">
          <span>{ticket.userName}</span>
          <StatusChip status={ticket.status} />
        </div>
      </CardBody>
    </Card>
  );
}

// ── Template Chip ──────────────────────────────

function TemplateChip({ template }: { template: string }) {
  const colorMap: Record<string, "primary" | "secondary" | "success" | "warning" | "danger" | "default"> = {
    individual: "primary",
    team: "secondary",
    pass: "warning",
    virtual: "success",
    slot: "default",
    enrollment: "primary",
    minimal: "default",
  };

  return (
    <Chip size="sm" variant="flat" color={colorMap[template] || "default"}>
      {template}
    </Chip>
  );
}

function StatusChip({ status }: { status: string }) {
  const colorMap: Record<string, "success" | "warning" | "danger" | "default"> = {
    confirmed: "success",
    approved: "success",
    pending: "warning",
    waitlisted: "warning",
    pending_payment: "warning",
    cancelled: "danger",
    rejected: "danger",
  };

  return (
    <Chip size="sm" variant="dot" color={colorMap[status] || "default"}>
      {status}
    </Chip>
  );
}

// ── Template-specific Content ──────────────────

function TicketContent({ ticket }: { ticket: TicketData }) {
  switch (ticket.template) {
    case "individual":
      return <IndividualContent ticket={ticket} />;
    case "team":
      return <TeamContent ticket={ticket} />;
    case "pass":
      return <PassContent ticket={ticket} />;
    case "virtual":
      return <VirtualContent ticket={ticket} />;
    case "slot":
      return <SlotContent ticket={ticket} />;
    case "enrollment":
      return <EnrollmentContent ticket={ticket} />;
    case "minimal":
      return <MinimalContent ticket={ticket} />;
    default:
      return <FallbackContent ticket={ticket} />;
  }
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-default-500">{label}</span>
      <span className="font-medium">{String(value)}</span>
    </div>
  );
}

function IndividualContent({ ticket }: { ticket: IndividualTicketData }) {
  return (
    <div className="space-y-1.5">
      <InfoRow label="Date" value={ticket.date} />
      <InfoRow label="Time" value={ticket.time} />
      <InfoRow label="Venue" value={ticket.venue} />
      <InfoRow label="Location" value={ticket.location} />
      {ticket.seatNumber && <InfoRow label="Seat" value={ticket.seatNumber} />}
      {ticket.price != null && ticket.price > 0 && (
        <InfoRow label="Price" value={`₹${ticket.price}`} />
      )}
    </div>
  );
}

function TeamContent({ ticket }: { ticket: TeamTicketData }) {
  return (
    <div className="space-y-2">
      <div className="bg-default-100 rounded-lg p-3 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">{ticket.teamName}</span>
          <Chip size="sm" variant="flat">
            {ticket.memberRole === "leader" ? "👑 Leader" : "Member"}
          </Chip>
        </div>
        <p className="text-xs text-default-400 font-mono">
          Invite: {ticket.inviteCode}
        </p>
        <p className="text-xs text-default-400">
          {ticket.memberCount}/{ticket.maxSize} members
        </p>
      </div>

      <InfoRow label="Date" value={ticket.date} />
      <InfoRow label="Time" value={ticket.time} />
      <InfoRow label="Venue" value={ticket.venue} />
    </div>
  );
}

function PassContent({ ticket }: { ticket: PassTicketData }) {
  return (
    <div className="space-y-2">
      <div className="bg-gradient-to-r from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/20 rounded-lg p-3 text-center">
        <p className="text-xs text-default-400">FEST PASS</p>
        <p className="text-lg font-bold font-mono">{ticket.festPassId}</p>
        <Chip size="sm" variant="flat" color="warning">
          {ticket.tier}
        </Chip>
      </div>

      <InfoRow label="Dates" value={ticket.dates} />
      <InfoRow label="Venue" value={ticket.venue} />
      {ticket.college && <InfoRow label="College" value={ticket.college} />}
      {ticket.perks && ticket.perks.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {ticket.perks.map((perk) => (
            <Chip key={perk} size="sm" variant="flat" color="default">
              {perk}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}

function VirtualContent({ ticket }: { ticket: VirtualTicketData }) {
  return (
    <div className="space-y-2">
      <div className="bg-success-50 dark:bg-success-900/20 rounded-lg p-3 text-center">
        <p className="text-xs text-default-400">ONLINE EVENT</p>
        <p className="font-semibold">{ticket.platform}</p>
      </div>

      <InfoRow label="Date" value={ticket.date} />
      <InfoRow label="Time" value={ticket.time} />
      {ticket.timezone && <InfoRow label="Timezone" value={ticket.timezone} />}
      {ticket.meetingLink && (
        <a
          href={ticket.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline block text-center"
        >
          Join Meeting →
        </a>
      )}
    </div>
  );
}

function SlotContent({ ticket }: { ticket: SlotTicketData }) {
  return (
    <div className="space-y-1.5">
      <div className="bg-default-100 rounded-lg p-2 text-center">
        <p className="text-xs text-default-400">{ticket.slotType.toUpperCase()}</p>
        {ticket.slotNumber && (
          <p className="font-semibold">Slot #{ticket.slotNumber}</p>
        )}
      </div>
      <InfoRow label="Date" value={ticket.date} />
      <InfoRow label="Time" value={ticket.time} />
      <InfoRow label="Venue" value={ticket.venue} />
      {ticket.role && <InfoRow label="Role" value={ticket.role} />}
    </div>
  );
}

function EnrollmentContent({ ticket }: { ticket: EnrollmentTicketData }) {
  return (
    <div className="space-y-1.5">
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3 text-center">
        <p className="text-xs text-default-400">ENROLLED IN</p>
        <p className="font-semibold">{ticket.topic}</p>
        {ticket.cohort && (
          <p className="text-xs text-default-400">Cohort: {ticket.cohort}</p>
        )}
      </div>

      <InfoRow label="Starts" value={ticket.startDate} />
      <InfoRow label="Ends" value={ticket.endDate} />
      <InfoRow label="Venue" value={ticket.venue} />
      {ticket.schedule && <InfoRow label="Schedule" value={ticket.schedule} />}
    </div>
  );
}

function MinimalContent({ ticket }: { ticket: MinimalTicketData }) {
  return (
    <div className="space-y-1.5">
      <InfoRow label="Date" value={ticket.date} />
      {ticket.time && <InfoRow label="Time" value={ticket.time} />}
      {ticket.venue && <InfoRow label="Venue" value={ticket.venue} />}
      {ticket.note && (
        <p className="text-xs text-default-400 italic">{ticket.note}</p>
      )}
    </div>
  );
}

function FallbackContent({ ticket }: { ticket: TicketData }) {
  return (
    <p className="text-sm text-default-400">
      Ticket details for template &quot;{ticket.template}&quot;
    </p>
  );
}
