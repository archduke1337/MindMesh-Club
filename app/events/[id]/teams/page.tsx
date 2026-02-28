"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import { Tabs, Tab } from "@heroui/tabs";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import {
  UsersIcon,
  CopyIcon,
  CheckIcon,
  PlusIcon,
  LogInIcon,
  ShieldIcon,
  FileTextIcon,
  TrophyIcon,
  SendIcon,
  AlertTriangleIcon,
  ClipboardIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";

interface Team {
  $id: string;
  teamName: string;
  description: string | null;
  leaderId: string;
  leaderName: string;
  inviteCode: string;
  memberCount: number;
  maxSize: number;
  status: string;
  problemStatement: string | null;
}

interface TeamMember {
  $id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
  joinedAt: string;
}

interface ProblemStatement {
  $id: string;
  title: string;
  description: string;
  category: string | null;
  difficulty: string;
  maxTeams: number;
  enrolledTeams: number;
}

export default function HackathonTeamsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [problemStatements, setProblemStatements] = useState<ProblemStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);

  // Create team form
  const [teamName, setTeamName] = useState("");
  const [teamDesc, setTeamDesc] = useState("");
  const [maxSize, setMaxSize] = useState("5");
  const [creating, setCreating] = useState(false);

  // Join team form
  const [inviteCode, setInviteCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  const createModal = useDisclosure();
  const joinModal = useDisclosure();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load user's team
      if (user) {
        const teamRes = await fetch(
          `/api/hackathon/teams?eventId=${eventId}&userId=${user.$id}`
        );
        const teamData = await teamRes.json();
        if (teamData.team) {
          setUserTeam(teamData.team);
          // Load team members
          const membersRes = await fetch(
            `/api/hackathon/teams?inviteCode=${teamData.team.inviteCode}`
          );
          const membersData = await membersRes.json();
          setTeamMembers(membersData.members || []);
        }
      }

      // Load all teams for this event
      const allTeamsRes = await fetch(
        `/api/hackathon/teams?eventId=${eventId}`
      );
      const allTeamsData = await allTeamsRes.json();
      setAllTeams(allTeamsData.teams || []);
    } catch (err) {
      console.error("Error loading hackathon data:", err);
    } finally {
      setLoading(false);
    }
  }, [eventId, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateTeam = async () => {
    if (!user || !teamName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/hackathon/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          teamName: teamName.trim(),
          description: teamDesc.trim() || null,
          leaderId: user.$id,
          leaderName: user.name,
          leaderEmail: user.email,
          maxSize: parseInt(maxSize) || 5,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        createModal.onClose();
        setTeamName("");
        setTeamDesc("");
        await loadData();
      } else {
        alert(data.error || "Failed to create team");
      }
    } catch (err: any) {
      alert(err.message || "Error creating team");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!user || !inviteCode.trim()) return;
    setJoining(true);
    setJoinError("");
    try {
      const res = await fetch("/api/hackathon/teams/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inviteCode: inviteCode.trim().toUpperCase(),
          userId: user.$id,
          userName: user.name,
          userEmail: user.email,
          eventId,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        joinModal.onClose();
        setInviteCode("");
        await loadData();
      } else {
        setJoinError(data.error || "Failed to join team");
      }
    } catch (err: any) {
      setJoinError(err.message || "Error joining team");
    } finally {
      setJoining(false);
    }
  };

  const copyInviteCode = () => {
    if (userTeam) {
      navigator.clipboard.writeText(userTeam.inviteCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-default-500">Loading hackathon data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Hackathon Teams</h1>
          <p className="text-default-500 mt-1">
            {allTeams.length} teams registered • {allTeams.reduce((a, t) => a + t.memberCount, 0)} participants
          </p>
        </div>

        {!userTeam && user && (
          <div className="flex gap-2">
            <Button
              color="primary"
              startContent={<PlusIcon className="w-4 h-4" />}
              onPress={createModal.onOpen}
            >
              Create Team
            </Button>
            <Button
              variant="bordered"
              startContent={<LogInIcon className="w-4 h-4" />}
              onPress={joinModal.onOpen}
            >
              Join Team
            </Button>
          </div>
        )}
      </div>

      <Tabs aria-label="Hackathon sections" className="mb-6">
        {/* ── MY TEAM TAB ── */}
        <Tab key="my-team" title={<div className="flex items-center gap-2"><UsersIcon className="w-4 h-4" />My Team</div>}>
          {userTeam ? (
            <div className="space-y-6 mt-6">
              {/* Team Info Card */}
              <Card className="border-none shadow-lg">
                <CardBody className="p-6">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-bold">{userTeam.teamName}</h2>
                        <Chip
                          color={
                            userTeam.status === "forming" ? "warning" :
                            userTeam.status === "locked" ? "primary" :
                            userTeam.status === "submitted" ? "success" : "default"
                          }
                          size="sm"
                          variant="flat"
                        >
                          {userTeam.status}
                        </Chip>
                      </div>
                      {userTeam.description && (
                        <p className="text-default-500 mb-4">{userTeam.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-default-500">
                          <UsersIcon className="w-4 h-4 inline mr-1" />
                          {userTeam.memberCount}/{userTeam.maxSize} members
                        </span>
                        {userTeam.problemStatement && (
                          <span className="text-default-500">
                            <FileTextIcon className="w-4 h-4 inline mr-1" />
                            {userTeam.problemStatement}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Invite Code */}
                    <div className="bg-default-100 rounded-xl p-4 text-center min-w-[180px]">
                      <p className="text-xs text-default-500 mb-1">Invite Code</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-2xl font-mono font-bold tracking-widest text-primary">
                          {userTeam.inviteCode}
                        </span>
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={copyInviteCode}
                        >
                          {codeCopied ? (
                            <CheckIcon className="w-4 h-4 text-success" />
                          ) : (
                            <CopyIcon className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-default-400 mt-1">Share with teammates</p>
                    </div>
                  </div>
                </CardBody>
              </Card>

              {/* Team Members */}
              <Card className="border-none shadow-lg">
                <CardHeader className="px-6 pt-6 pb-0">
                  <h3 className="text-lg font-bold">Team Members</h3>
                </CardHeader>
                <CardBody className="px-6 pb-6">
                  <div className="space-y-3">
                    {teamMembers.map((member) => (
                      <div
                        key={member.$id}
                        className="flex items-center justify-between p-3 rounded-lg bg-default-50 dark:bg-default-100/5"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{member.name}</p>
                            <p className="text-xs text-default-500">{member.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Chip
                            size="sm"
                            color={member.role === "leader" ? "primary" : "default"}
                            variant="flat"
                          >
                            {member.role === "leader" ? "👑 Leader" : "Member"}
                          </Chip>
                          <Chip
                            size="sm"
                            color={member.status === "accepted" ? "success" : "warning"}
                            variant="flat"
                          >
                            {member.status}
                          </Chip>
                        </div>
                      </div>
                    ))}
                  </div>

                  {userTeam.memberCount < userTeam.maxSize && (
                    <div className="mt-4 p-4 border-2 border-dashed border-default-200 rounded-xl text-center">
                      <p className="text-sm text-default-500">
                        {userTeam.maxSize - userTeam.memberCount} spot(s) remaining
                      </p>
                      <p className="text-xs text-default-400 mt-1">
                        Share invite code <span className="font-mono font-bold text-primary">{userTeam.inviteCode}</span> with your teammates
                      </p>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  color="primary"
                  variant="flat"
                  startContent={<SendIcon className="w-4 h-4" />}
                  onPress={() => router.push(`/events/${eventId}/submit`)}
                  isDisabled={userTeam.status === "submitted"}
                >
                  {userTeam.status === "submitted" ? "Already Submitted" : "Submit Project"}
                </Button>
                <Button
                  variant="flat"
                  startContent={<TrophyIcon className="w-4 h-4" />}
                  onPress={() => router.push(`/events/${eventId}/results`)}
                >
                  View Results
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <UsersIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">You haven&apos;t joined a team yet</h3>
              <p className="text-default-500 mb-6 max-w-md mx-auto">
                Create your own team or join an existing one with an invite code.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  color="primary"
                  size="lg"
                  startContent={<PlusIcon className="w-4 h-4" />}
                  onPress={createModal.onOpen}
                >
                  Create Team
                </Button>
                <Button
                  variant="bordered"
                  size="lg"
                  startContent={<LogInIcon className="w-4 h-4" />}
                  onPress={joinModal.onOpen}
                >
                  Join with Code
                </Button>
              </div>
            </div>
          )}
        </Tab>

        {/* ── ALL TEAMS TAB ── */}
        <Tab key="all-teams" title={<div className="flex items-center gap-2"><ClipboardIcon className="w-4 h-4" />All Teams ({allTeams.length})</div>}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
            {allTeams.map((team) => (
              <Card key={team.$id} className="border-none shadow-md">
                <CardBody className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-base">{team.teamName}</h4>
                    <Chip
                      size="sm"
                      color={
                        team.status === "forming" ? "warning" :
                        team.status === "locked" ? "primary" :
                        team.status === "submitted" ? "success" : "default"
                      }
                      variant="flat"
                    >
                      {team.status}
                    </Chip>
                  </div>
                  {team.description && (
                    <p className="text-sm text-default-500 mb-3 line-clamp-2">
                      {team.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-default-500">
                      <UsersIcon className="w-3.5 h-3.5 inline mr-1" />
                      {team.memberCount}/{team.maxSize}
                    </span>
                    <span className="text-default-400 text-xs">
                      Led by {team.leaderName}
                    </span>
                  </div>
                  {team.problemStatement && (
                    <Chip size="sm" variant="flat" className="mt-2 text-xs">
                      {team.problemStatement}
                    </Chip>
                  )}
                </CardBody>
              </Card>
            ))}

            {allTeams.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-default-400">No teams registered yet.</p>
              </div>
            )}
          </div>
        </Tab>

        {/* ── PROBLEM STATEMENTS TAB ── */}
        <Tab key="problem-statements" title={<div className="flex items-center gap-2"><FileTextIcon className="w-4 h-4" />Problem Statements</div>}>
          <div className="mt-6">
            {problemStatements.length > 0 ? (
              <div className="space-y-4">
                {problemStatements.map((ps, idx) => (
                  <Card key={ps.$id} className="border-none shadow-md">
                    <CardBody className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold flex-shrink-0">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h4 className="font-bold text-lg">{ps.title}</h4>
                            <Chip
                              size="sm"
                              color={
                                ps.difficulty === "beginner" ? "success" :
                                ps.difficulty === "intermediate" ? "warning" : "danger"
                              }
                              variant="flat"
                            >
                              {ps.difficulty}
                            </Chip>
                          </div>
                          <p className="text-sm text-default-600 mb-3">{ps.description}</p>
                          <div className="flex items-center gap-4 text-xs text-default-400">
                            {ps.category && <span>Category: {ps.category}</span>}
                            <span>{ps.enrolledTeams}/{ps.maxTeams} teams</span>
                          </div>
                        </div>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileTextIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Problem Statements</h3>
                <p className="text-default-500">
                  Problem statements will be published by the organizers soon.
                </p>
              </div>
            )}
          </div>
        </Tab>
      </Tabs>

      {/* ── CREATE TEAM MODAL ── */}
      <Modal isOpen={createModal.isOpen} onOpenChange={createModal.onOpenChange} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-lg font-bold">Create a Team</h3>
                <p className="text-sm text-default-500 font-normal">
                  Create your team and share the invite code with teammates.
                </p>
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Team Name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    isRequired
                    variant="bordered"
                    placeholder="e.g. Code Warriors"
                    maxLength={50}
                  />
                  <Input
                    label="Description (optional)"
                    value={teamDesc}
                    onChange={(e) => setTeamDesc(e.target.value)}
                    variant="bordered"
                    placeholder="Brief description of your team"
                  />
                  <Input
                    label="Max Team Size"
                    type="number"
                    value={maxSize}
                    onChange={(e) => setMaxSize(e.target.value)}
                    variant="bordered"
                    min={2}
                    max={10}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>Cancel</Button>
                <Button
                  color="primary"
                  onPress={handleCreateTeam}
                  isLoading={creating}
                  isDisabled={!teamName.trim()}
                >
                  Create Team
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* ── JOIN TEAM MODAL ── */}
      <Modal isOpen={joinModal.isOpen} onOpenChange={joinModal.onOpenChange}>
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h3 className="text-lg font-bold">Join a Team</h3>
                <p className="text-sm text-default-500 font-normal">
                  Enter the invite code shared by your team leader.
                </p>
              </ModalHeader>
              <ModalBody>
                <Input
                  label="Invite Code"
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value.toUpperCase());
                    setJoinError("");
                  }}
                  variant="bordered"
                  placeholder="e.g. X7K3M2"
                  maxLength={6}
                  classNames={{
                    input: "text-center text-2xl font-mono tracking-[0.3em]",
                  }}
                />
                {joinError && (
                  <div className="flex items-center gap-2 text-danger text-sm p-2 bg-danger/10 rounded-lg">
                    <AlertTriangleIcon className="w-4 h-4 flex-shrink-0" />
                    {joinError}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>Cancel</Button>
                <Button
                  color="primary"
                  onPress={handleJoinTeam}
                  isLoading={joining}
                  isDisabled={inviteCode.length < 6}
                >
                  Join Team
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
