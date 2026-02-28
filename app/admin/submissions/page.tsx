"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Select, SelectItem } from "@heroui/select";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { isUserAdminByEmail } from "@/lib/adminConfig";
import {
  ArrowLeftIcon,
  FileTextIcon,
  EyeIcon,
  ExternalLinkIcon,
  GithubIcon,
  VideoIcon,
} from "lucide-react";

interface Submission {
  $id: string;
  eventId: string;
  teamId: string | null;
  userId: string;
  userName: string;
  projectTitle: string;
  projectDescription: string;
  problemStatementId: string | null;
  techStack: string[];
  repoUrl: string | null;
  demoUrl: string | null;
  videoUrl: string | null;
  presentationUrl: string | null;
  screenshots: string[];
  status: string;
  submittedAt: string;
  reviewedBy: string | null;
  reviewNotes: string | null;
  totalScore: number;
}

export default function AdminSubmissionsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const detailModal = useDisclosure();

  const [events, setEvents] = useState<any[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

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

  const loadSubmissions = useCallback(async () => {
    if (!selectedEventId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/hackathon/submissions?eventId=${selectedEventId}`);
      const data = await res.json();
      setSubmissions(data.submissions || []);
    } catch {
      //
    } finally {
      setLoading(false);
    }
  }, [selectedEventId]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const viewDetails = (sub: Submission) => {
    setSelectedSubmission(sub);
    detailModal.onOpen();
  };

  const updateStatus = async (submissionId: string, status: string) => {
    try {
      await fetch("/api/hackathon/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          submissionId,
          status,
          reviewedBy: user?.name || "Admin",
        }),
      });
      await loadSubmissions();
    } catch {
      alert("Failed to update status");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "submitted": return "primary";
      case "under_review": return "warning";
      case "accepted": return "success";
      case "rejected": return "danger";
      case "winner": return "success";
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
        <FileTextIcon className="w-7 h-7 text-secondary" />
        Hackathon Submissions
      </h1>
      <p className="text-default-500 mb-6">Review and manage project submissions</p>

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
          <FileTextIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p>Select a hackathon event to view submissions</p>
        </div>
      )}

      {selectedEventId && loading && (
        <div className="text-center py-12"><Spinner size="lg" /></div>
      )}

      {selectedEventId && !loading && (
        <>
          <div className="flex items-center gap-4 mb-4">
            <p className="text-sm text-default-500">
              {submissions.length} submissions
            </p>
          </div>

          <div className="space-y-3">
            {submissions.map((sub) => (
              <Card key={sub.$id} className="border-none shadow-md">
                <CardBody className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-purple-400 flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                      {sub.projectTitle.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-bold text-sm">{sub.projectTitle}</h3>
                        <Chip size="sm" variant="flat" color={getStatusColor(sub.status)} className="capitalize">
                          {sub.status.replace("_", " ")}
                        </Chip>
                        {sub.totalScore > 0 && (
                          <Chip size="sm" variant="flat" color="warning">Score: {sub.totalScore}</Chip>
                        )}
                      </div>
                      <p className="text-xs text-default-500 line-clamp-2 mb-1">{sub.projectDescription}</p>
                      <div className="flex items-center gap-3 text-xs text-default-400 flex-wrap">
                        <span>By {sub.userName}</span>
                        <span>•</span>
                        <span>{new Date(sub.submittedAt).toLocaleDateString()}</span>
                        {sub.techStack?.length > 0 && (
                          <>
                            <span>•</span>
                            <span>{sub.techStack.slice(0, 3).join(", ")}{sub.techStack.length > 3 ? "..." : ""}</span>
                          </>
                        )}
                      </div>
                      {/* Quick Links */}
                      <div className="flex items-center gap-2 mt-2">
                        {sub.repoUrl && (
                          <a href={sub.repoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                            <GithubIcon className="w-3 h-3" /> Repo
                          </a>
                        )}
                        {sub.demoUrl && (
                          <a href={sub.demoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                            <ExternalLinkIcon className="w-3 h-3" /> Demo
                          </a>
                        )}
                        {sub.videoUrl && (
                          <a href={sub.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 hover:underline">
                            <VideoIcon className="w-3 h-3" /> Video
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <Button size="sm" variant="flat" startContent={<EyeIcon className="w-3.5 h-3.5" />} onPress={() => viewDetails(sub)}>
                        Details
                      </Button>
                      <div className="flex gap-1">
                        {sub.status === "submitted" && (
                          <Button size="sm" color="warning" variant="flat" onPress={() => updateStatus(sub.$id, "under_review")}>
                            Review
                          </Button>
                        )}
                        {(sub.status === "submitted" || sub.status === "under_review") && (
                          <Button size="sm" color="success" variant="flat" onPress={() => updateStatus(sub.$id, "accepted")}>
                            Accept
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            ))}

            {submissions.length === 0 && (
              <div className="text-center py-12 text-default-400">
                <FileTextIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No submissions yet for this hackathon</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Submission Detail Modal */}
      <Modal isOpen={detailModal.isOpen} onOpenChange={detailModal.onOpenChange} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => selectedSubmission && (
            <>
              <ModalHeader>{selectedSubmission.projectTitle}</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-default-400 uppercase mb-1">Description</p>
                    <p className="text-sm">{selectedSubmission.projectDescription}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-default-400 uppercase mb-1">Submitted By</p>
                      <p className="text-sm font-medium">{selectedSubmission.userName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-default-400 uppercase mb-1">Status</p>
                      <Chip size="sm" variant="flat" color={getStatusColor(selectedSubmission.status)} className="capitalize">
                        {selectedSubmission.status.replace("_", " ")}
                      </Chip>
                    </div>
                  </div>

                  {selectedSubmission.techStack?.length > 0 && (
                    <div>
                      <p className="text-xs text-default-400 uppercase mb-1">Tech Stack</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedSubmission.techStack.map((tech) => (
                          <Chip key={tech} size="sm" variant="flat">{tech}</Chip>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {selectedSubmission.repoUrl && (
                      <div>
                        <p className="text-xs text-default-400 uppercase mb-1">Repository</p>
                        <a href={selectedSubmission.repoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                          {selectedSubmission.repoUrl}
                        </a>
                      </div>
                    )}
                    {selectedSubmission.demoUrl && (
                      <div>
                        <p className="text-xs text-default-400 uppercase mb-1">Demo</p>
                        <a href={selectedSubmission.demoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                          {selectedSubmission.demoUrl}
                        </a>
                      </div>
                    )}
                    {selectedSubmission.videoUrl && (
                      <div>
                        <p className="text-xs text-default-400 uppercase mb-1">Video</p>
                        <a href={selectedSubmission.videoUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                          {selectedSubmission.videoUrl}
                        </a>
                      </div>
                    )}
                    {selectedSubmission.presentationUrl && (
                      <div>
                        <p className="text-xs text-default-400 uppercase mb-1">Presentation</p>
                        <a href={selectedSubmission.presentationUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline break-all">
                          {selectedSubmission.presentationUrl}
                        </a>
                      </div>
                    )}
                  </div>

                  {selectedSubmission.reviewedBy && (
                    <div>
                      <p className="text-xs text-default-400 uppercase mb-1">Reviewed By</p>
                      <p className="text-sm">{selectedSubmission.reviewedBy}</p>
                    </div>
                  )}

                  {selectedSubmission.reviewNotes && (
                    <div>
                      <p className="text-xs text-default-400 uppercase mb-1">Review Notes</p>
                      <p className="text-sm">{selectedSubmission.reviewNotes}</p>
                    </div>
                  )}

                  {selectedSubmission.totalScore > 0 && (
                    <div>
                      <p className="text-xs text-default-400 uppercase mb-1">Total Score</p>
                      <p className="text-lg font-bold text-warning">{selectedSubmission.totalScore}</p>
                    </div>
                  )}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>Close</Button>
                {selectedSubmission.status !== "accepted" && (
                  <Button color="success" variant="flat" onPress={() => { updateStatus(selectedSubmission.$id, "accepted"); onClose(); }}>
                    Accept
                  </Button>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
