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
import {
  BellIcon,
  PlusIcon,
  ArrowLeftIcon,
  TrashIcon,
  PinIcon,
  EditIcon,
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

const defaultForm = {
  title: "",
  content: "",
  type: "info",
  priority: "normal",
  isPinned: false,
  isActive: true,
  link: "",
  linkText: "",
  expiresAt: "",
};

export default function AdminAnnouncementsPage() {
  const { user, loading: authLoading, isAdmin } = useAuth();
  const router = useRouter();
  const modal = useDisclosure();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);

  const [form, setForm] = useState({ ...defaultForm });
  const [error, setError] = useState<string | null>(null);

  const loadAnnouncements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/announcements?all=true");
      const data = await res.json();
      setAnnouncements(data.announcements || []);
      if (data.error) {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load announcements");
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

  const openCreate = () => {
    setEditingAnn(null);
    setForm({ ...defaultForm });
    modal.onOpen();
  };

  const openEdit = (ann: Announcement) => {
    setEditingAnn(ann);
    setForm({
      title: ann.title,
      content: ann.content,
      type: ann.type,
      priority: ann.priority,
      isPinned: ann.isPinned,
      isActive: ann.isActive,
      link: ann.link || "",
      linkText: ann.linkText || "",
      expiresAt: ann.expiresAt ? ann.expiresAt.slice(0, 16) : "",
    });
    modal.onOpen();
  };

  const handleSave = async () => {
    if (!form.title || !form.content) return;
    setSaving(true);
    try {
      if (editingAnn) {
        const res = await fetch("/api/announcements", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            announcementId: editingAnn.$id,
            title: form.title,
            content: form.content,
            type: form.type,
            priority: form.priority,
            isPinned: form.isPinned,
            isActive: form.isActive,
            link: form.link || null,
            linkText: form.linkText || null,
            expiresAt: form.expiresAt || null,
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Update failed (${res.status})`);
        }
      } else {
        const res = await fetch("/api/announcements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            content: form.content,
            type: form.type,
            priority: form.priority,
            isPinned: form.isPinned,
            link: form.link || null,
            linkText: form.linkText || null,
            expiresAt: form.expiresAt || null,
            createdBy: user?.name || "Admin",
          }),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Create failed (${res.status})`);
        }
      }
      modal.onClose();
      setForm({ ...defaultForm });
      await loadAnnouncements();
    } catch (err: any) {
      alert(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this announcement?")) return;
    setDeleting(id);
    try {
      await fetch("/api/announcements", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId: id }),
      });
      await loadAnnouncements();
    } catch {
      alert("Failed to delete");
    } finally {
      setDeleting(null);
    }
  };

  const toggleActive = async (ann: Announcement) => {
    try {
      await fetch("/api/announcements", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ announcementId: ann.$id, isActive: !ann.isActive }),
      });
      await loadAnnouncements();
    } catch {
      alert("Failed to update");
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
          <p className="text-default-500 mt-1">{announcements.length} announcements</p>
        </div>
        <Button
          color="primary"
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={openCreate}
        >
          New Announcement
        </Button>
      </div>

      {error && (
        <Card className="mb-4 border border-danger/30 bg-danger/5">
          <CardBody className="p-3">
            <p className="text-sm text-danger">⚠️ {error}</p>
          </CardBody>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((ann) => (
            <Card key={ann.$id} className={`border-none shadow-md ${!ann.isActive ? "opacity-60" : ""}`}>
              <CardBody className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
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
                      {!ann.isActive && <Chip size="sm" color="danger" variant="flat">Inactive</Chip>}
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
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Switch
                      size="sm"
                      isSelected={ann.isActive}
                      onValueChange={() => toggleActive(ann)}
                    />
                    <Button isIconOnly size="sm" variant="light" onPress={() => openEdit(ann)}>
                      <EditIcon className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      color="danger"
                      isLoading={deleting === ann.$id}
                      onPress={() => handleDelete(ann.$id)}
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </Button>
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

      {/* Create/Edit Modal */}
      <Modal isOpen={modal.isOpen} onOpenChange={modal.onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{editingAnn ? "Edit Announcement" : "Create Announcement"}</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    isRequired
                    variant="bordered"
                  />
                  <Textarea
                    label="Content"
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    isRequired
                    variant="bordered"
                    minRows={2}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Type"
                      selectedKeys={[form.type]}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                      variant="bordered"
                    >
                      {TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} variant="bordered">{opt.label}</SelectItem>
                      ))}
                    </Select>
                    <Select
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
                    <Input
                      label="Link (optional)"
                      value={form.link}
                      onChange={(e) => setForm({ ...form, link: e.target.value })}
                      variant="bordered"
                      placeholder="https://..."
                    />
                    <Input
                      label="Link Text (optional)"
                      value={form.linkText}
                      onChange={(e) => setForm({ ...form, linkText: e.target.value })}
                      variant="bordered"
                      placeholder="e.g. Register Now"
                    />
                  </div>
                  <Input
                    label="Expires At (optional)"
                    type="datetime-local"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    variant="bordered"
                  />
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <Switch
                        isSelected={form.isPinned}
                        onValueChange={(val) => setForm({ ...form, isPinned: val })}
                      />
                      <span className="text-sm">Pin this announcement</span>
                    </div>
                    {editingAnn && (
                      <div className="flex items-center gap-3">
                        <Switch
                          isSelected={form.isActive}
                          onValueChange={(val) => setForm({ ...form, isActive: val })}
                        />
                        <span className="text-sm">Active</span>
                      </div>
                    )}
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>Cancel</Button>
                <Button
                  color="primary"
                  onPress={handleSave}
                  isLoading={saving}
                  isDisabled={!form.title || !form.content}
                >
                  {editingAnn ? "Update" : "Create Announcement"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
