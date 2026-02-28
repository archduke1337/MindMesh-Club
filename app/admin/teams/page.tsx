"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";
import { Select, SelectItem } from "@heroui/select";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { isUserAdminByEmail } from "@/lib/adminConfig";
import {
  ArrowLeftIcon,
  UsersIcon,
  CopyIcon,
  CheckIcon,
  LockIcon,
  UnlockIcon,
  EyeIcon,
  UserIcon,
} from "lucide-react";

interface Team {
  $id: string;
  eventId: string;
  teamName: string;
  description: string | null;
  leaderId: string;
  leaderName: string;
  leaderEmail: string;
  inviteCode: string;
  memberCount: number;
  maxSize: number;
  status: string;
  submissionId: string | null;
}

interface TeamMember {
  $id: string;
  teamId: string;
  eventId: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
}

export default function AdminTeamsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const membersModal = useDisclosure();

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  const isAdmin = !authLoading && user && (
    isUserAdminByEmail(user.email) || user.labels?.includes("admin")
  );

  useEffect(() => {
    if (!isAdmin) return;
    fetch("/api/events/register")
      .then((r) => r.json())
      .then((data) => {
        const hackathons = (data.events || data || []).filter(
          (e: any) => e.eventType === "hackathon" || e.category === "hackathon"
        );
        setEvents(hackathons);
      })
      .catch(() => {});
  }, [isAdmin]);

  const loadTeams = useCallback(async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hackathon/teams?eventId=${selectedEventId}`);
      const data = await res.json();
      setTeams(data.teams || []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    loadTeams();
  }, [loadTeams]);

  const viewMembers = async (team: Team) => {
    setSelectedTeam(team);
    setLoadingMembers(true);
    membersModal.onOpen();
    try {
      const res = await fetch(`/api/hackathon/teams?inviteCode=${team.inviteCode}`);
      const data = await res.json();
      setTeamMembers(data.members || []);
    } catch {
      setTeamMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "forming": return "primary";
      case "locked": return "warning";
      case "submitted": return "success";
      case "disqualified": return "danger";
      default: return "default";
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;
  }

  if (!authLoading && !isAdmin) {
    router.push("/unauthorized");
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button
        variant="light"
        startContent={<ArrowLeftIcon className="w-4 h-4" />}
        onPress={() => router.push("/admin")}
        className="mb-6"
      >
        Back to Admin
      </Button>

      <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 mb-2">
        <UsersIcon className="w-7 h-7 text-primary" />
        Hackathon Teams
      </h1>
      <p className="text-default-500 mb-6">View and manage teams for hackathon events</p>

      {/* Event Selector */}
      <Card className="mb-6 border-none shadow-md">
        <CardBody className="p-4">
          <Select
            label="Select Hackathon"
            placeholder="Choose a hackathon event..."
            selectedKeys={selectedEventId ? [selectedEventId] : []}
            onChange={(e) => setSelectedEventId(e.target.value)}
            variant="bordered"
          >
            {events.map((ev) => (
              <SelectItem key={ev.$id} variant="bordered">{ev.title}</SelectItem>
            ))}
          </Select>
        </CardBody>
      </Card>

      {!selectedEventId && (
        <div className="text-center py-12 text-default-400">
          <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Select a hackathon event to view teams</p>
        </div>
      )}

      {selectedEventId && loading && (
        <div className="text-center py-12"><Spinner size="lg" /></div>
      )}

      {selectedEventId && !loading && (
        <>
          <div className="flex items-center gap-4 mb-4">
            <p className="text-sm text-default-500">
              {teams.length} teams • {teams.reduce((sum, t) => sum + t.memberCount, 0)} total members
            </p>
          </div>

          <div className="space-y-3">
            {teams.map((team) => (
              <Card key={team.$id} className="border-none shadow-md">
                <CardBody className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {team.teamName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-sm">{team.teamName}</h3>
                        <Chip size="sm" variant="flat" color={getStatusColor(team.status)} className="capitalize">
                          {team.status === "locked" && <LockIcon className="w-3 h-3 mr-1" />}
                          {team.status}
                        </Chip>
                        {team.submissionId && (
                          <Chip size="sm" variant="flat" color="success">Submitted</Chip>
                        )}
                      </div>
                      {team.description && (
                        <p className="text-xs text-default-400 mb-1 truncate">{team.description}</p>
                      )}
                      <div className="flex items-center gap-3 text-xs text-default-400">
                        <span className="flex items-center gap-1">
                          <UserIcon className="w-3 h-3" />
                          Leader: {team.leaderName}
                        </span>
                        <span>•</span>
                        <span>{team.memberCount}/{team.maxSize} members</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-default-100 px-2 py-1 rounded font-mono">{team.inviteCode}</code>
                        <Button isIconOnly size="sm" variant="light" onPress={() => copyCode(team.inviteCode)}>
                          {copiedCode === team.inviteCode ? <CheckIcon className="w-3.5 h-3.5 text-success" /> : <CopyIcon className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                      <Button size="sm" variant="flat" startContent={<EyeIcon className="w-3.5 h-3.5" />} onPress={() => viewMembers(team)}>
                        Members
                      </Button>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}

            {teams.length === 0 && (
              <div className="text-center py-12 text-default-400">
                <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No teams formed yet for this hackathon</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Team Members Modal */}
      <Modal isOpen={membersModal.isOpen} onOpenChange={membersModal.onOpenChange} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {selectedTeam?.teamName} — Members
              </ModalHeader>
              <ModalBody>
                {loadingMembers ? (
                  <div className="flex justify-center py-4"><Spinner /></div>
                ) : (
                  <div className="space-y-3">
                    {teamMembers.map((m) => (
                      <div key={m.$id} className="flex items-center gap-3 p-3 bg-default-50 rounded-xl">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {m.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm">{m.name}</p>
                            <Chip size="sm" variant="flat" color={m.role === "leader" ? "warning" : "default"} className="capitalize">{m.role}</Chip>
                            <Chip size="sm" variant="flat" color={m.status === "accepted" ? "success" : "default"} className="capitalize">{m.status}</Chip>
                          </div>
                          <p className="text-xs text-default-400">{m.email}</p>
                        </div>
                        <span className="text-xs text-default-400">
                          {new Date(m.joinedAt).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                    {teamMembers.length === 0 && (
                      <p className="text-sm text-default-400 text-center py-4">No members found</p>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>Close</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
