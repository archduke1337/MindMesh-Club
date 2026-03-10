// components/events/TeamRegistrationForm.tsx
// ═══════════════════════════════════════════════════════
// Two-mode team registration form:
//   1. Create a new team (leader)
//   2. Join existing team with invite code
// Used for hackathon, competition, and any team-model event.
// ═══════════════════════════════════════════════════════
"use client";

import { useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { EventType } from "@/lib/events/types";
import { getEventTypeConfig } from "@/lib/events/registry";

type TeamMode = "create" | "join";

interface TeamRegistrationFormProps {
  eventType: EventType;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  onSubmit: (data: TeamCreateData | TeamJoinData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export interface TeamCreateData {
  mode: "create";
  teamName: string;
  extraFields: Record<string, string>;
}

export interface TeamJoinData {
  mode: "join";
  inviteCode: string;
}

export default function TeamRegistrationForm({
  eventType,
  eventId,
  userId,
  userName,
  userEmail,
  onSubmit,
  isLoading = false,
  error = null,
}: TeamRegistrationFormProps) {
  const config = getEventTypeConfig(eventType);
  const teamConfig = config.registration.teamConfig;

  const [mode, setMode] = useState<TeamMode>("create");
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});

  const minSize = teamConfig?.minSize ?? 1;
  const maxSize = teamConfig?.maxSize ?? 4;

  const handleSubmit = async () => {
    if (mode === "create") {
      await onSubmit({ mode: "create", teamName: teamName.trim(), extraFields });
    } else {
      await onSubmit({ mode: "join", inviteCode: inviteCode.trim().toUpperCase() });
    }
  };

  const isCreateValid = teamName.trim().length >= 2;
  const isJoinValid = inviteCode.trim().length === 6;

  return (
    <div className="space-y-4">
      <Tabs
        selectedKey={mode}
        onSelectionChange={(key) => setMode(key as TeamMode)}
        variant="bordered"
        fullWidth
      >
        <Tab key="create" title="Create Team" />
        <Tab key="join" title="Join Team" />
      </Tabs>

      {mode === "create" ? (
        <Card>
          <CardBody className="gap-4">
            <div>
              <h4 className="text-sm font-semibold mb-1">Create a New Team</h4>
              <p className="text-xs text-default-400">
                You&apos;ll be the team leader. Share the invite code with
                your teammates ({minSize}–{maxSize} members).
              </p>
            </div>

            <Input
              label="Team Name"
              placeholder="Enter your team name"
              value={teamName}
              isRequired
              maxLength={50}
              onChange={(e) => setTeamName(e.target.value)}
            />

            {/* Extra registration fields from config */}
            {config.registration.extraFields
              .filter((f) => f.name !== "teamName" && f.name !== "inviteCode")
              .map((field) => (
                <Input
                  key={field.name}
                  label={field.label}
                  placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                  isRequired={field.required}
                  value={extraFields[field.name] || ""}
                  onChange={(e) =>
                    setExtraFields((prev) => ({
                      ...prev,
                      [field.name]: e.target.value,
                    }))
                  }
                />
              ))}

            <div className="flex items-center gap-2 text-xs text-default-400">
              <Chip size="sm" variant="flat">
                👤 {userName}
              </Chip>
              <span>will be registered as team leader</span>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card>
          <CardBody className="gap-4">
            <div>
              <h4 className="text-sm font-semibold mb-1">Join Existing Team</h4>
              <p className="text-xs text-default-400">
                Enter the 6-character invite code shared by your team leader.
              </p>
            </div>

            <Input
              label="Invite Code"
              placeholder="e.g., AB12CD"
              value={inviteCode}
              isRequired
              maxLength={6}
              classNames={{ input: "uppercase tracking-widest text-center font-mono text-lg" }}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            />
          </CardBody>
        </Card>
      )}

      {error && (
        <p className="text-sm text-danger">{error}</p>
      )}

      <Button
        color="primary"
        fullWidth
        isLoading={isLoading}
        isDisabled={mode === "create" ? !isCreateValid : !isJoinValid}
        onPress={handleSubmit}
      >
        {mode === "create" ? "Create Team & Register" : "Join Team"}
      </Button>
    </div>
  );
}
