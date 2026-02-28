// app/admin/resources/page.tsx
"use client";
import { useEffect, useState, useCallback } from "react";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Chip } from "@heroui/chip";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import AdminPageWrapper from "@/components/AdminPageWrapper";
import {
  PlusIcon, Pencil, Trash2, ArrowLeftIcon, SearchIcon, FileTextIcon, VideoIcon,
  CodeIcon, LinkIcon, FileIcon, MapIcon, AlertCircle, XIcon, CheckCircleIcon,
  InfoIcon, ExternalLinkIcon, StarIcon, EyeIcon,
} from "lucide-react";

type ResourceType = "slides" | "video" | "notes" | "code" | "pdf" | "link" | "roadmap";
type Difficulty = "beginner" | "intermediate" | "advanced";

interface Resource {
  $id?: string;
  title: string;
  description: string | null;
  type: ResourceType;
  category: string;
  url: string | null;
  fileUrl: string | null;
  eventId: string | null;
  eventName: string | null;
  difficulty: Difficulty;
  tags: string[];
  uploadedBy: string;
  isApproved: boolean;
  isFeatured: boolean;
  $createdAt?: string;
}

const RESOURCE_TYPES: { key: ResourceType; label: string; icon: typeof FileTextIcon }[] = [
  { key: "slides", label: "Slides", icon: FileTextIcon },
  { key: "video", label: "Video", icon: VideoIcon },
  { key: "notes", label: "Notes", icon: FileTextIcon },
  { key: "code", label: "Code", icon: CodeIcon },
  { key: "pdf", label: "PDF", icon: FileIcon },
  { key: "link", label: "Link", icon: LinkIcon },
  { key: "roadmap", label: "Roadmap", icon: MapIcon },
];

const DIFFICULTIES: { key: Difficulty; label: string; color: "success" | "warning" | "danger" }[] = [
  { key: "beginner", label: "Beginner", color: "success" },
  { key: "intermediate", label: "Intermediate", color: "warning" },
  { key: "advanced", label: "Advanced", color: "danger" },
];

const CATEGORIES = [
  "Web Development", "Mobile Development", "AI/ML", "Data Science",
  "Cybersecurity", "Cloud Computing", "DevOps", "Blockchain",
  "UI/UX Design", "Career", "General", "Other",
];

const emptyForm: Omit<Resource, "$id" | "$createdAt"> = {
  title: "",
  description: null,
  type: "link",
  category: "General",
  url: null,
  fileUrl: null,
  eventId: null,
  eventName: null,
  difficulty: "beginner",
  tags: [],
  uploadedBy: "",
  isApproved: true,
  isFeatured: false,
};

const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;

export default function AdminResourcesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const modal = useDisclosure();

  const [resources, setResources] = useState<Resource[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [tagInput, setTagInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchResources = useCallback(async () => {
    try {
      setLoadingResources(true);
      const res = await fetch("/api/resources");
      if (res.ok) {
        const data = await res.json();
        setResources(data.resources || []);
      } else {
        setError("Failed to load resources");
      }
    } catch {
      setError("Failed to load resources");
    } finally {
      setLoadingResources(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) fetchResources();
  }, [user, loading, fetchResources]);

  const handleSave = async () => {
    if (!formData.title.trim()) {
      showToast("Title is required", "error");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
      const headers = {
        "Content-Type": "application/json",
        "X-Appwrite-Project": process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
        "X-Appwrite-Key": process.env.APPWRITE_API_KEY || "",
      };

      const body = {
        title: formData.title,
        description: formData.description || null,
        type: formData.type,
        category: formData.category,
        url: formData.url || null,
        fileUrl: formData.fileUrl || null,
        eventId: formData.eventId || null,
        eventName: formData.eventName || null,
        difficulty: formData.difficulty,
        tags: formData.tags,
        uploadedBy: formData.uploadedBy || user?.email || "",
        isApproved: formData.isApproved,
        isFeatured: formData.isFeatured,
      };

      // Use the API route with admin privileges
      const apiUrl = editingId
        ? `/api/admin/resources?id=${editingId}`
        : `/api/admin/resources`;

      const res = await fetch(apiUrl, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to save resource");
      }

      modal.onClose();
      setFormData(emptyForm);
      setEditingId(null);
      setTagInput("");
      await fetchResources();
      showToast(editingId ? "Resource updated!" : "Resource created!", "success");
    } catch (err: any) {
      showToast(err.message || "Failed to save resource", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingId(resource.$id || null);
    setFormData({
      title: resource.title,
      description: resource.description,
      type: resource.type,
      category: resource.category,
      url: resource.url,
      fileUrl: resource.fileUrl,
      eventId: resource.eventId,
      eventName: resource.eventName,
      difficulty: resource.difficulty,
      tags: resource.tags || [],
      uploadedBy: resource.uploadedBy,
      isApproved: resource.isApproved,
      isFeatured: resource.isFeatured,
    });
    modal.onOpen();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this resource?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/resources?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      await fetchResources();
      showToast("Resource deleted", "success");
    } catch {
      showToast("Failed to delete resource", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData((p) => ({ ...p, tags: [...p.tags, tagInput.trim()] }));
      setTagInput("");
    }
  };

  const getTypeIcon = (type: ResourceType) => {
    const found = RESOURCE_TYPES.find((t) => t.key === type);
    const Icon = found?.icon || FileIcon;
    return <Icon className="w-4 h-4" />;
  };

  const filteredResources = resources.filter((r) => {
    const matchSearch = !searchQuery || r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.category?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = typeFilter === "all" || r.type === typeFilter;
    return matchSearch && matchType;
  });

  if (loading) {
    return (
      <AdminPageWrapper title="Resources" description="Loading...">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper title="Resource Management" description="Manage learning resources, slides, and roadmaps">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 max-w-sm ${
          toast.type === "success" ? "bg-success-50 dark:bg-success-950/80 border border-success-200 dark:border-success-800 text-success-800 dark:text-success-200"
          : toast.type === "error" ? "bg-danger-50 dark:bg-danger-950/80 border border-danger-200 dark:border-danger-800 text-danger-800 dark:text-danger-200"
          : "bg-primary-50 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-200"
        }`}>
          {toast.type === "success" && <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />}
          {toast.type === "error" && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.type === "info" && <InfoIcon className="w-4 h-4 flex-shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><XIcon className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Back + Add */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="light" startContent={<ArrowLeftIcon className="w-4 h-4" />} onPress={() => router.push("/admin")}>
          Back to Admin
        </Button>
        <Button color="primary" startContent={<PlusIcon className="w-4 h-4" />}
          className="bg-gradient-to-r from-purple-600 to-pink-600"
          onPress={() => { setEditingId(null); setFormData(emptyForm); setTagInput(""); modal.onOpen(); }}
        >
          Add Resource
        </Button>
      </div>

      {/* Error */}
      {error && (
        <Card className="mb-6 border-none bg-danger-50 dark:bg-danger-950/30">
          <CardBody className="flex-row items-center gap-2">
            <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
            <p className="text-sm text-danger">{error}</p>
          </CardBody>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <Card className="border-none shadow-md"><CardBody className="p-4 text-center">
          <p className="text-2xl font-bold">{resources.length}</p>
          <p className="text-xs text-default-500">Total</p>
        </CardBody></Card>
        <Card className="border-none shadow-md"><CardBody className="p-4 text-center">
          <p className="text-2xl font-bold text-success">{resources.filter(r => r.isApproved).length}</p>
          <p className="text-xs text-default-500">Approved</p>
        </CardBody></Card>
        <Card className="border-none shadow-md"><CardBody className="p-4 text-center">
          <p className="text-2xl font-bold text-warning">{resources.filter(r => r.isFeatured).length}</p>
          <p className="text-xs text-default-500">Featured</p>
        </CardBody></Card>
        <Card className="border-none shadow-md"><CardBody className="p-4 text-center">
          <p className="text-2xl font-bold text-secondary">{new Set(resources.map(r => r.category)).size}</p>
          <p className="text-xs text-default-500">Categories</p>
        </CardBody></Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          placeholder="Search resources..." value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<SearchIcon className="w-4 h-4 text-default-400" />}
          className="w-full sm:max-w-xs" size="sm" isClearable onClear={() => setSearchQuery("")}
        />
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant={typeFilter === "all" ? "solid" : "flat"}
            color={typeFilter === "all" ? "primary" : "default"} onPress={() => setTypeFilter("all")}
          >All</Button>
          {RESOURCE_TYPES.map((t) => (
            <Button key={t.key} size="sm" variant={typeFilter === t.key ? "solid" : "flat"}
              color={typeFilter === t.key ? "primary" : "default"} onPress={() => setTypeFilter(t.key)}
              startContent={<t.icon className="w-3 h-3" />}
            >{t.label}</Button>
          ))}
        </div>
      </div>

      {/* Resources List */}
      {loadingResources ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        </div>
      ) : filteredResources.length === 0 ? (
        <Card className="border-none">
          <CardBody className="text-center py-16 text-default-400">
            <FileIcon className="w-14 h-14 mx-auto mb-4 opacity-40" />
            <p className="text-lg font-medium">No resources found</p>
            <p className="text-sm mt-1">{searchQuery || typeFilter !== "all" ? "Try adjusting your filters" : "Add your first resource"}</p>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResources.map((resource) => (
            <Card key={resource.$id} className={`border-none shadow-md hover:shadow-lg transition-shadow ${!resource.isApproved ? "opacity-60" : ""}`}>
              <CardBody className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      {getTypeIcon(resource.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{resource.title}</p>
                      <p className="text-xs text-default-500 capitalize">{resource.type}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {resource.isFeatured && <StarIcon className="w-4 h-4 text-warning fill-warning" />}
                    {resource.url && (
                      <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-default-400 hover:text-primary">
                        <ExternalLinkIcon className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>

                {resource.description && (
                  <p className="text-xs text-default-600 line-clamp-2">{resource.description}</p>
                )}

                <div className="flex flex-wrap gap-1.5">
                  <Chip size="sm" variant="flat" color="secondary" className="text-xs">{resource.category}</Chip>
                  <Chip size="sm" variant="flat"
                    color={DIFFICULTIES.find(d => d.key === resource.difficulty)?.color || "default"}
                    className="text-xs capitalize"
                  >{resource.difficulty}</Chip>
                  {!resource.isApproved && <Chip size="sm" variant="flat" color="warning" className="text-xs">Pending</Chip>}
                </div>

                {resource.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {resource.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-default-100 dark:bg-default-50/10 text-default-600">{tag}</span>
                    ))}
                    {resource.tags.length > 3 && <span className="text-xs text-default-400">+{resource.tags.length - 3}</span>}
                  </div>
                )}

                <div className="flex gap-1.5 pt-1">
                  <Button size="sm" variant="flat" color="primary" className="flex-1"
                    startContent={<Pencil className="w-3 h-3" />} onPress={() => handleEdit(resource)}
                  >Edit</Button>
                  <Button size="sm" variant="flat" color="danger" isIconOnly
                    isLoading={deletingId === resource.$id}
                    onPress={() => handleDelete(resource.$id!)}
                  ><Trash2 className="w-3 h-3" /></Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modal.isOpen} onClose={() => { modal.onClose(); setEditingId(null); setFormData(emptyForm); setTagInput(""); }}
        size="2xl" scrollBehavior="inside"
        classNames={{ base: "max-h-[95vh]", wrapper: "items-center" }}
      >
        <ModalContent>
          <ModalHeader className="border-b pb-4">
            <div>
              <h2 className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {editingId ? "Edit Resource" : "Add New Resource"}
              </h2>
              <p className="text-xs text-default-500 font-normal mt-1">Fill in the details below</p>
            </div>
          </ModalHeader>

          <ModalBody className="py-6 space-y-4">
            <Input label="Title" placeholder="Resource title" required
              value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
            />

            <Textarea label="Description" placeholder="Brief description"
              value={formData.description || ""} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value || null }))}
              minRows={2}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Type" selectedKeys={[formData.type]}
                onChange={(e) => setFormData(p => ({ ...p, type: e.target.value as ResourceType }))}
              >
                {RESOURCE_TYPES.map((t) => <SelectItem key={t.key} variant="bordered">{t.label}</SelectItem>)}
              </Select>

              <Select label="Difficulty" selectedKeys={[formData.difficulty]}
                onChange={(e) => setFormData(p => ({ ...p, difficulty: e.target.value as Difficulty }))}
              >
                {DIFFICULTIES.map((d) => <SelectItem key={d.key} variant="bordered">{d.label}</SelectItem>)}
              </Select>
            </div>

            <Select label="Category" selectedKeys={[formData.category]}
              onChange={(e) => setFormData(p => ({ ...p, category: e.target.value }))}
            >
              {CATEGORIES.map((c) => <SelectItem key={c} variant="bordered">{c}</SelectItem>)}
            </Select>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="URL" placeholder="https://..." type="url"
                value={formData.url || ""} onChange={(e) => setFormData(p => ({ ...p, url: e.target.value || null }))}
                startContent={<LinkIcon className="w-4 h-4 text-default-400" />}
              />
              <Input label="File URL" placeholder="https://..." type="url"
                value={formData.fileUrl || ""} onChange={(e) => setFormData(p => ({ ...p, fileUrl: e.target.value || null }))}
                startContent={<FileIcon className="w-4 h-4 text-default-400" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Event Name (optional)" placeholder="Linked event"
                value={formData.eventName || ""} onChange={(e) => setFormData(p => ({ ...p, eventName: e.target.value || null }))}
              />
              <Input label="Uploaded By" placeholder="email or name"
                value={formData.uploadedBy} onChange={(e) => setFormData(p => ({ ...p, uploadedBy: e.target.value }))}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <label className="text-sm font-semibold">Tags</label>
              <div className="flex gap-2">
                <Input placeholder="e.g. React, JavaScript" value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                />
                <Button type="button" onPress={handleAddTag} color="primary" variant="flat">Add</Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {formData.tags.map((tag) => (
                    <Chip key={tag} onClose={() => setFormData(p => ({ ...p, tags: p.tags.filter(t => t !== tag) }))}
                      variant="flat" color="secondary" size="sm"
                    >{tag}</Chip>
                  ))}
                </div>
              )}
            </div>

            {/* Switches */}
            <div className="flex items-center gap-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
              <Switch isSelected={formData.isApproved}
                onValueChange={(v) => setFormData(p => ({ ...p, isApproved: v }))}
                color="success" size="sm"
              >
                <span className="text-sm font-medium flex items-center gap-1">
                  <EyeIcon className="w-3.5 h-3.5" /> Approved
                </span>
              </Switch>
              <Switch isSelected={formData.isFeatured}
                onValueChange={(v) => setFormData(p => ({ ...p, isFeatured: v }))}
                color="warning" size="sm"
              >
                <span className="text-sm font-medium flex items-center gap-1">
                  <StarIcon className="w-3.5 h-3.5" /> Featured
                </span>
              </Switch>
            </div>
          </ModalBody>

          <ModalFooter className="border-t pt-4">
            <Button variant="light" onPress={() => { modal.onClose(); setEditingId(null); setFormData(emptyForm); }}>
              Cancel
            </Button>
            <Button color="primary" onPress={handleSave} isLoading={saving}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold"
            >
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminPageWrapper>
  );
}
