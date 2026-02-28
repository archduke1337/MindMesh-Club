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
import { isUserAdminByEmail } from "@/lib/adminConfig";
import {
  ArrowLeftIcon,
  PlusIcon,
  GavelIcon,
  ScaleIcon,
  UsersIcon,
  CopyIcon,
  CheckIcon,
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

export default function AdminJudgingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const judgeModal = useDisclosure();
  const criteriaModal = useDisclosure();

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [judges, setJudges] = useState<Judge[]>([]);
  const [criteria, setCriteria] = useState<Criteria[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const [judgeForm, setJudgeForm] = useState({
    name: "", email: "", organization: "", designation: "",
    expertise: "", isLead: false,
  });
  const [criteriaForm, setCriteriaForm] = useState({
    name: "", description: "", maxScore: 10, weight: 0.2,
  });

  const isAdmin = !authLoading && user && (
    isUserAdminByEmail(user.email) || user.labels?.includes("admin")
  );

  // Load hackathon events
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
      const [jRes, cRes] = await Promise.all([
        fetch(`/api/hackathon/judging?eventId=${selectedEventId}&type=judges`),
        fetch(`/api/hackathon/judging?eventId=${selectedEventId}&type=criteria`),
      ]);
      const jData = await jRes.json();
      const cData = await cRes.json();
      setJudges(jData.items || []);
      setCriteria(cData.items || []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddJudge = async () => {
    if (!judgeForm.name || !judgeForm.email) return;
    setSaving(true);
    try {
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
      judgeModal.onClose();
      setJudgeForm({ name: "", email: "", organization: "", designation: "", expertise: "", isLead: false });
      await loadData();
    } catch {
      //
    } finally {
      setSaving(false);
    }
  };

  const handleAddCriteria = async () => {
    if (!criteriaForm.name) return;
    setSaving(true);
    try {
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
      criteriaModal.onClose();
      setCriteriaForm({ name: "", description: "", maxScore: 10, weight: 0.2 });
      await loadData();
    } catch {
      //
    } finally {
      setSaving(false);
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
        <GavelIcon className="w-7 h-7 text-warning" />
        Hackathon Judging
      </h1>
      <p className="text-default-500 mb-6">Manage judges, criteria, and evaluation for hackathon events</p>

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
              <SelectItem key={ev.$id}>{ev.title}</SelectItem>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Judges Panel */}
          <Card className="border-none shadow-lg">
            <CardHeader className="px-6 pt-6 pb-0 flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <UsersIcon className="w-5 h-5" />
                Judges ({judges.length})
              </h2>
              <Button size="sm" color="primary" startContent={<PlusIcon className="w-3.5 h-3.5" />}
                onPress={judgeModal.onOpen}
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
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Criteria Panel */}
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
                onPress={criteriaModal.onOpen}
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
        </div>
      )}

      {/* Add Judge Modal */}
      <Modal isOpen={judgeModal.isOpen} onOpenChange={judgeModal.onOpenChange} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Add Judge</ModalHeader>
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
                <Button color="primary" onPress={handleAddJudge} isLoading={saving} isDisabled={!judgeForm.name || !judgeForm.email}>Add Judge</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Add Criteria Modal */}
      <Modal isOpen={criteriaModal.isOpen} onOpenChange={criteriaModal.onOpenChange} size="lg">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Add Judging Criteria</ModalHeader>
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
                <Button color="secondary" onPress={handleAddCriteria} isLoading={saving} isDisabled={!criteriaForm.name}>Add Criteria</Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
