"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Spinner } from "@heroui/spinner";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { isUserAdminByEmail } from "@/lib/adminConfig";
import {
  BellIcon,
  PlusIcon,
  ArrowLeftIcon,
  TrashIcon,
  PinIcon,
} from "lucide-react";

interface Announcement {
  $id: string;
  title: string;
  content: string;
  type: string;
  priority: string;
  isPinned: boolean;
  isActive: boolean;
  link: string | null;
  linkText: string | null;
  createdBy: string;
  expiresAt: string | null;
  $createdAt: string;
}

const TYPE_OPTIONS = [
  { value: "info", label: "Info" },
  { value: "event", label: "Event" },
  { value: "urgent", label: "Urgent" },
  { value: "update", label: "Update" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

export default function AdminAnnouncementsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const createModal = useDisclosure();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: "",
    content: "",
    type: "info",
    priority: "normal",
    isPinned: false,
    link: "",
    linkText: "",
    expiresAt: "",
  });

  const isAdmin = !authLoading && user && (
    isUserAdminByEmail(user.email) || user.labels?.includes("admin")
  );

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/announcements");
      const data = await res.json();
      setAnnouncements(data.announcements || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/unauthorized");
      return;
    }
    if (isAdmin) loadAnnouncements();
  }, [authLoading, isAdmin, loadAnnouncements]);

  const handleCreate = async () => {
    if (!user || !form.title || !form.content) return;
    setCreating(true);
    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          link: form.link || null,
          linkText: form.linkText || null,
          expiresAt: form.expiresAt || null,
          createdBy: user.name,
        }),
      });
      if (res.ok) {
        createModal.onClose();
        setForm({
          title: "",
          content: "",
          type: "info",
          priority: "normal",
          isPinned: false,
          link: "",
          linkText: "",
          expiresAt: "",
        });
        await loadAnnouncements();
      }
    } catch (err: any) {
      alert(err.message || "Failed to create");
    } finally {
      setCreating(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Button
        variant="light"
        startContent={<ArrowLeftIcon className="w-4 h-4" />}
        onPress={() => router.push("/admin")}
        className="mb-6"
      >
        Back to Admin
      </Button>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <BellIcon className="w-7 h-7 text-warning" />
            Announcements
          </h1>
          <p className="text-default-500 mt-1">{announcements.length} active announcements</p>
        </div>
        <Button
          color="primary"
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={createModal.onOpen}
        >
          New Announcement
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <Card key={ann.$id} className="border-none shadow-md">
              <CardBody className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold">{ann.title}</h3>
                      {ann.isPinned && (
                        <PinIcon className="w-3.5 h-3.5 text-primary" />
                      )}
                      <Chip
                        size="sm"
                        color={
                          ann.priority === "critical" ? "danger" :
                          ann.priority === "high" ? "warning" :
                          ann.priority === "normal" ? "primary" : "default"
                        }
                        variant="flat"
                      >
                        {ann.priority}
                      </Chip>
                      <Chip size="sm" variant="flat">
                        {ann.type}
                      </Chip>
                    </div>
                    <p className="text-sm text-default-600">{ann.content}</p>
                    {ann.link && (
                      <p className="text-xs text-primary mt-1">
                        🔗 {ann.linkText || ann.link}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-default-400">
                      <span>By {ann.createdBy}</span>
                      <span>•</span>
                      <span>{new Date(ann.$createdAt).toLocaleDateString()}</span>
                      {ann.expiresAt && (
                        <>
                          <span>•</span>
                          <span>Expires: {new Date(ann.expiresAt).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}

          {announcements.length === 0 && (
            <div className="text-center py-12 text-default-400">
              <BellIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No announcements yet</p>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={createModal.isOpen} onOpenChange={createModal.onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Create Announcement</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input variant="bordered"
                    label="Title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    isRequired
                    variant="bordered"
                  />
                  <Textarea variant="bordered"
                    label="Content"
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    isRequired
                    variant="bordered"
                    minRows={2}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Select variant="bordered"
                      label="Type"
                      selectedKeys={[form.type]}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      variant="bordered"
                    >
                      {TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} variant="bordered">{opt.label}</SelectItem>
                      ))}
                    </Select>
                    <Select variant="bordered"
                      label="Priority"
                      selectedKeys={[form.priority]}
                      onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      variant="bordered"
                    >
                      {PRIORITY_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} variant="bordered">{opt.label}</SelectItem>
                      ))}
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input variant="bordered"
                      label="Link (optional)"
                      value={form.link}
                      onChange={(e) => setForm({ ...form, link: e.target.value })}
                      variant="bordered"
                      placeholder="https://..."
                    />
                    <Input variant="bordered"
                      label="Link Text (optional)"
                      value={form.linkText}
                      onChange={(e) => setForm({ ...form, linkText: e.target.value })}
                      variant="bordered"
                      placeholder="e.g. Register Now"
                    />
                  </div>
                  <Input variant="bordered"
                    label="Expires At (optional)"
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    variant="bordered"
                  />
                  <div className="flex items-center gap-3">
                    <Switch
                      isSelected={form.isPinned}
                      onValueChange={(val) => setForm({ ...form, isPinned: val })}
                    />
                    <span className="text-sm">Pin this announcement (shows first)</span>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>Cancel</Button>
                <Button
                  color="primary"
                  onPress={handleCreate}
                  isLoading={creating}
                  isDisabled={!form.title || !form.content}
                >
                  Create Announcement
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
