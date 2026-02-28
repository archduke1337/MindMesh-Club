"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input, Textarea } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  PlusIcon,
  GavelIcon,
  ScaleIcon,
  UsersIcon,
  CopyIcon,
  CheckIcon,
  EditIcon,
  TrashIcon,
  BarChart3Icon,
} from "lucide-react";

interface Judge {
  $id: string;
  eventId: string;
  name: string;
  email: string;
  expertise: string[];
  organization: string | null;
  designation: string | null;
  status: string;
  inviteCode: string;
  isLead: boolean;
  order: number;
}

interface Criteria {
  $id: string;
  eventId: string;
  name: string;
  description: string | null;
  maxScore: number;
  weight: number;
  order: number;
}

interface Score {
  $id: string;
  eventId: string;
  judgeId: string;
  judgeName: string;
  submissionId: string;
  teamId: string;
  criteriaId: string;
  criteriaName: string;
  score: number;
  comment: string | null;
  scoredAt: string;
}

export default function AdminJudgingPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const judgeModal = useDisclosure();
  const criteriaModal = useDisclosure();

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [judges, setJudges] = useState<Judge[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"judges" | "criteria" | "scores">("judges");

  const [editingJudge, setEditingJudge] = useState<Judge | null>(null);
  const [editingCriteria, setEditingCriteria] = useState<Criteria | null>(null);

  const [judgeForm, setJudgeForm] = useState({
    name: "", email: "", organization: "", designation: "",
    expertise: "", isLead: false,
  });
  const [criteriaForm, setCriteriaForm] = useState({
    name: "", description: "", maxScore: 10, weight: 0.2,
  });

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

  const loadData = useCallback(async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const [jRes, cRes, sRes] = await Promise.all([
        fetch(`/api/hackathon/judging?eventId=${selectedEventId}&type=judges`),
        fetch(`/api/hackathon/judging?eventId=${selectedEventId}&type=criteria`),
        fetch(`/api/hackathon/judging?eventId=${selectedEventId}&type=scores`),
      ]);
      const jData = await jRes.json();
      const cData = await cRes.json();
      const sData = await sRes.json();
      setJudges(jData.items || []);
      setCriteria(cData.items || []);
      setScores(sData.items || []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Judge CRUD
  const openAddJudge = () => {
    setEditingJudge(null);
    setJudgeForm({ name: "", email: "", organization: "", designation: "", expertise: "", isLead: false });
    judgeModal.onOpen();
  };

  const openEditJudge = (j: Judge) => {
    setEditingJudge(j);
    setJudgeForm({
      name: j.name,
      email: j.email,
      organization: j.organization || "",
      designation: j.designation || "",
      expertise: (j.expertise || []).join(", "),
      isLead: j.isLead,
    });
    judgeModal.onOpen();
  };

  const handleSaveJudge = async () => {
    if (!judgeForm.name || !judgeForm.email) return;
    setSaving(true);
    try {
      if (editingJudge) {
        await fetch("/api/hackathon/judging", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "judge",
            id: editingJudge.$id,
            name: judgeForm.name,
            email: judgeForm.email,
            organization: judgeForm.organization || null,
            designation: judgeForm.designation || null,
            expertise: judgeForm.expertise.split(",").map((s) => s.trim()).filter(Boolean),
            isLead: judgeForm.isLead,
          }),
        });
      } else {
        await fetch("/api/hackathon/judging", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add_judge",
            eventId: selectedEventId,
            ...judgeForm,
            expertise: judgeForm.expertise.split(",").map((s) => s.trim()).filter(Boolean),
            order: judges.length,
          }),
        });
      }
      judgeModal.onClose();
      await loadData();
    } catch {
      alert("Failed to save judge");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteJudge = async (id: string) => {
    if (!confirm("Remove this judge?")) return;
    setDeleting(id);
    try {
      await fetch("/api/hackathon/judging", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "judge", id }),
      });
      await loadData();
    } catch {
      alert("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  // Criteria CRUD
  const openAddCriteria = () => {
    setEditingCriteria(null);
    setCriteriaForm({ name: "", description: "", maxScore: 10, weight: 0.2 });
    criteriaModal.onOpen();
  };

  const openEditCriteria = (c: Criteria) => {
    setEditingCriteria(c);
    setCriteriaForm({
      name: c.name,
      description: c.description || "",
      maxScore: c.maxScore,
      weight: c.weight,
    });
    criteriaModal.onOpen();
  };

  const handleSaveCriteria = async () => {
    if (!criteriaForm.name) return;
    setSaving(true);
    try {
      if (editingCriteria) {
        await fetch("/api/hackathon/judging", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: "criteria",
            id: editingCriteria.$id,
            name: criteriaForm.name,
            description: criteriaForm.description || null,
            maxScore: criteriaForm.maxScore,
            weight: criteriaForm.weight,
          }),
        });
      } else {
        await fetch("/api/hackathon/judging", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "add_criteria",
            eventId: selectedEventId,
            ...criteriaForm,
            order: criteria.length,
          }),
        });
      }
      criteriaModal.onClose();
      await loadData();
    } catch {
      alert("Failed to save criteria");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCriteria = async (id: string) => {
    if (!confirm("Remove this criteria?")) return;
    setDeleting(id);
    try {
      await fetch("/api/hackathon/judging", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "criteria", id }),
      });
      await loadData();
    } catch {
      alert("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;
  }
  if (!isAdmin) { router.push("/unauthorized"); return null; }

  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

  // Aggregate scores by submission
  const scoresBySubmission: Record<string, { total: number; count: number; judgeCount: number }> = {};
  scores.forEach((s) => {
    if (!scoresBySubmission[s.submissionId]) {
      scoresBySubmission[s.submissionId] = { total: 0, count: 0, judgeCount: 0 };
    }
    scoresBySubmission[s.submissionId].total += s.score;
    scoresBySubmission[s.submissionId].count++;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button
        variant="light"
        startContent={<ArrowLeftIcon className="w-4 h-4" />}
        onPress={() => router.push("/admin")}
        className="mb-6"
      >
        Back to Admin
      </Button>

      <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3 mb-2">
        <GavelIcon className="w-7 h-7 text-warning" />
        Hackathon Judging
      </h1>
      <p className="text-default-500 mb-6">Manage judges, criteria, and scores for hackathon events</p>

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
          <GavelIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Select a hackathon event above to manage judging</p>
        </div>
      )}

      {selectedEventId && loading && (
        <div className="text-center py-12"><Spinner size="lg" /></div>
      )}

      {selectedEventId && !loading && (
        <>
          {/* Tab Selector */}
          <div className="flex gap-2 mb-6">
            <Button
              size="sm"
              variant={activeTab === "judges" ? "solid" : "flat"}
              color={activeTab === "judges" ? "primary" : "default"}
              startContent={<UsersIcon className="w-4 h-4" />}
              onPress={() => setActiveTab("judges")}
            >
              Judges ({judges.length})
            </Button>
            <Button
              size="sm"
              variant={activeTab === "criteria" ? "solid" : "flat"}
              color={activeTab === "criteria" ? "secondary" : "default"}
              startContent={<ScaleIcon className="w-4 h-4" />}
              onPress={() => setActiveTab("criteria")}
            >
              Criteria ({criteria.length})
            </Button>
            <Button
              size="sm"
              variant={activeTab === "scores" ? "solid" : "flat"}
              color={activeTab === "scores" ? "warning" : "default"}
              startContent={<BarChart3Icon className="w-4 h-4" />}
              onPress={() => setActiveTab("scores")}
            >
              Scores ({scores.length})
            </Button>
          </div>

          {/* Judges Panel */}
          {activeTab === "judges" && (
            <Card className="border-none shadow-lg">
              <CardHeader className="px-6 pt-6 pb-0 flex justify-between items-center">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <UsersIcon className="w-5 h-5" />
                  Judges ({judges.length})
                </h2>
                <Button size="sm" color="primary" startContent={<PlusIcon className="w-3.5 h-3.5" />}
                  onPress={openAddJudge}
                >
                  Add Judge
                </Button>
              </CardHeader>
              <CardBody className="px-6 pb-6">
                {judges.length === 0 ? (
                  <p className="text-sm text-default-400 py-4 text-center">No judges added yet</p>
                ) : (
                  <div className="space-y-3 mt-3">
                    {judges.map((j) => (
                      <div key={j.$id} className="flex items-center gap-3 p-3 bg-default-50 rounded-xl">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-warning to-orange-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                          {j.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm truncate">{j.name}</p>
                            {j.isLead && <Chip size="sm" color="warning" variant="flat">Lead</Chip>}
                            <Chip size="sm" variant="flat" color={
                              j.status === "accepted" ? "success" :
                              j.status === "declined" ? "danger" : "default"
                            } className="capitalize">{j.status}</Chip>
                          </div>
                          <p className="text-xs text-default-400 truncate">{j.email}</p>
                          {j.organization && (
                            <p className="text-xs text-default-400">{j.designation ? `${j.designation}, ` : ""}{j.organization}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <code className="text-xs bg-default-100 px-2 py-1 rounded font-mono">{j.inviteCode}</code>
                          <Button isIconOnly size="sm" variant="light" onPress={() => copyCode(j.inviteCode)}>
                            {copiedCode === j.inviteCode ? <CheckIcon className="w-3.5 h-3.5 text-success" /> : <CopyIcon className="w-3.5 h-3.5" />}
                          </Button>
                          <Button isIconOnly size="sm" variant="light" onPress={() => openEditJudge(j)}>
                            <EditIcon className="w-3.5 h-3.5" />
                          </Button>
                          <Button isIconOnly size="sm" variant="light" color="danger" isLoading={deleting === j.$id} onPress={() => handleDeleteJudge(j.$id)}>
                            <TrashIcon className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Criteria Panel */}
          {activeTab === "criteria" && (
            <Card className="border-none shadow-lg">
              <CardHeader className="px-6 pt-6 pb-0 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold flex items-center gap-2">
                    <ScaleIcon className="w-5 h-5" />
                    Criteria ({criteria.length})
                  </h2>
                  <p className="text-xs text-default-400 mt-0.5">
                    Total weight: {(totalWeight * 100).toFixed(0)}%
                    {Math.abs(totalWeight - 1) > 0.01 && (
                      <span className="text-danger ml-2">(should be 100%)</span>
                    )}
                  </p>
                </div>
                <Button size="sm" color="secondary" startContent={<PlusIcon className="w-3.5 h-3.5" />}
                  onPress={openAddCriteria}
                >
                  Add Criteria
                </Button>
              </CardHeader>
              <CardBody className="px-6 pb-6">
                {criteria.length === 0 ? (
                  <p className="text-sm text-default-400 py-4 text-center">No criteria defined yet</p>
                ) : (
                  <div className="space-y-3 mt-3">
                    {criteria.map((c) => (
                      <div key={c.$id} className="p-3 bg-default-50 rounded-xl">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-semibold text-sm">{c.name}</p>
                          <div className="flex items-center gap-2">
                            <Chip size="sm" variant="flat">Max: {c.maxScore}</Chip>
                            <Chip size="sm" variant="flat" color="primary">{(c.weight * 100).toFixed(0)}%</Chip>
                            <Button isIconOnly size="sm" variant="light" onPress={() => openEditCriteria(c)}>
                              <EditIcon className="w-3.5 h-3.5" />
                            </Button>
                            <Button isIconOnly size="sm" variant="light" color="danger" isLoading={deleting === c.$id} onPress={() => handleDeleteCriteria(c.$id)}>
                              <TrashIcon className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        {c.description && (
                          <p className="text-xs text-default-400">{c.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Scores Panel */}
          {activeTab === "scores" && (
            <Card className="border-none shadow-lg">
              <CardHeader className="px-6 pt-6 pb-0">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <BarChart3Icon className="w-5 h-5" />
                  Scores ({scores.length} entries)
                </h2>
              </CardHeader>
              <CardBody className="px-6 pb-6">
                {scores.length === 0 ? (
                  <p className="text-sm text-default-400 py-4 text-center">No scores submitted yet</p>
                ) : (
                  <div className="space-y-3 mt-3">
                    {/* Group scores by submission */}
                    {Object.entries(
                      scores.reduce((acc, s) => {
                        const key = s.submissionId;
                        if (!acc[key]) acc[key] = [];
                        acc[key].push(s);
                        return acc;
                      }, {} as Record<string, Score[]>)
                    ).map(([submissionId, submScores]) => {
                      const avgScore = submScores.reduce((sum, s) => sum + s.score, 0) / submScores.length;
                      return (
                        <div key={submissionId} className="p-4 bg-default-50 rounded-xl">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-semibold text-sm">Submission: {submissionId.slice(0, 8)}...</p>
                            <Chip size="sm" color="warning" variant="flat">
                              Avg: {avgScore.toFixed(1)}
                            </Chip>
                          </div>
                          <Divider className="my-2" />
                          <div className="space-y-1.5">
                            {submScores.map((s) => (
                              <div key={s.$id} className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="text-default-600 font-medium">{s.judgeName || "Judge"}</span>
                                  <span className="text-default-400">→</span>
                                  <span className="text-default-500">{s.criteriaName || "Criteria"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold">{s.score}</span>
                                  {s.comment && (
                                    <span className="text-default-400 truncate max-w-[150px]" title={s.comment}>
                                      &quot;{s.comment}&quot;
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardBody>
            </Card>
          )}
        </>
      )}

      {/* Add/Edit Judge Modal */}
      <Modal isOpen={judgeModal.isOpen} onOpenChange={judgeModal.onOpenChange} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{editingJudge ? "Edit Judge" : "Add Judge"}</ModalHeader>
              <ModalBody className="space-y-4">
                <Input label="Name" value={judgeForm.name} onChange={(e) => setJudgeForm({ ...judgeForm, name: e.target.value })} isRequired variant="bordered" />
                <Input label="Email" type="email" value={judgeForm.email} onChange={(e) => setJudgeForm({ ...judgeForm, email: e.target.value })} isRequired variant="bordered" />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Organization" value={judgeForm.organization} onChange={(e) => setJudgeForm({ ...judgeForm, organization: e.target.value })} variant="bordered" />
                  <Input label="Designation" value={judgeForm.designation} onChange={(e) => setJudgeForm({ ...judgeForm, designation: e.target.value })} variant="bordered" />
                </div>
                <Input label="Expertise" value={judgeForm.expertise} onChange={(e) => setJudgeForm({ ...judgeForm, expertise: e.target.value })} variant="bordered" placeholder="AI/ML, Web Dev, Design (comma-separated)" />
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={judgeForm.isLead} onChange={(e) => setJudgeForm({ ...judgeForm, isLead: e.target.checked })} id="isLead" />
                  <label htmlFor="isLead" className="text-sm">Lead Judge (can finalize scores)</label>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>Cancel</Button>
                <Button color="primary" onPress={handleSaveJudge} isLoading={saving} isDisabled={!judgeForm.name || !judgeForm.email}>
                  {editingJudge ? "Update" : "Add Judge"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Add/Edit Criteria Modal */}
      <Modal isOpen={criteriaModal.isOpen} onOpenChange={criteriaModal.onOpenChange} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{editingCriteria ? "Edit Criteria" : "Add Judging Criteria"}</ModalHeader>
              <ModalBody className="space-y-4">
                <Input label="Criteria Name" value={criteriaForm.name} onChange={(e) => setCriteriaForm({ ...criteriaForm, name: e.target.value })} isRequired variant="bordered" placeholder="e.g. Innovation, Technical Complexity" />
                <Textarea label="Description" value={criteriaForm.description} onChange={(e) => setCriteriaForm({ ...criteriaForm, description: e.target.value })} variant="bordered" placeholder="What should judges evaluate for this criterion?" minRows={2} />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Max Score" type="number" value={String(criteriaForm.maxScore)} onChange={(e) => setCriteriaForm({ ...criteriaForm, maxScore: Number(e.target.value) })} variant="bordered" />
                  <Input label="Weight (0-1)" type="number" value={String(criteriaForm.weight)} onChange={(e) => setCriteriaForm({ ...criteriaForm, weight: Number(e.target.value) })} variant="bordered" description={`= ${(criteriaForm.weight * 100).toFixed(0)}%`} />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>Cancel</Button>
                <Button color="secondary" onPress={handleSaveCriteria} isLoading={saving} isDisabled={!criteriaForm.name}>
                  {editingCriteria ? "Update" : "Add Criteria"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
