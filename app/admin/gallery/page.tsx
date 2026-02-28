"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { isUserAdminByEmail } from "@/lib/adminConfig";
import { galleryService, type GalleryImage } from "@/lib/database";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import {
  ArrowLeftIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  StarIcon,
  ImageIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
} from "lucide-react";

type GalleryCategory = "events" | "workshops" | "hackathons" | "team" | "projects" | "campus" | "achievements";

interface FormData {
  title: string;
  description: string;
  imageUrl: string;
  category: GalleryCategory;
  eventName: string;
  date: string;
  photographer: string;
  attendees: number;
  tags: string;
}

const CATEGORIES: { key: GalleryCategory; label: string }[] = [
  { key: "events", label: "Events" },
  { key: "workshops", label: "Workshops" },
  { key: "hackathons", label: "Hackathons" },
  { key: "team", label: "Team" },
  { key: "projects", label: "Projects" },
  { key: "campus", label: "Campus" },
  { key: "achievements", label: "Achievements" },
];

const emptyForm: FormData = {
  title: "",
  description: "",
  imageUrl: "",
  category: "events",
  eventName: "",
  date: new Date().toISOString().split("T")[0],
  photographer: "",
  attendees: 0,
  tags: "",
};

export default function AdminGalleryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const modal = useDisclosure();

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [formData, setFormData] = useState<FormData>(emptyForm);

  const isAdmin =
    !authLoading &&
    user &&
    (isUserAdminByEmail(user.email) || user.labels?.includes("admin"));

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await galleryService.getAllImages();
      setImages(data);
    } catch {
      setError("Failed to load gallery images");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/unauthorized");
      return;
    }
    if (isAdmin) fetchImages();
  }, [authLoading, isAdmin, fetchImages]);

  const handleSubmit = async () => {
    if (!formData.title || !formData.imageUrl) {
      setError("Title and Image URL are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const imageData = {
        title: formData.title,
        description: formData.description,
        imageUrl: formData.imageUrl,
        category: formData.category,
        eventName: formData.eventName || null,
        date: formData.date,
        photographer: formData.photographer || null,
        attendees: formData.attendees,
        uploadedBy: user?.email || "",
        isApproved: true,
        isFeatured: false,
        tags: formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      };

      if (editingId) {
        await galleryService.updateImage(editingId, imageData as any);
      } else {
        await galleryService.createImage(imageData as any);
      }

      modal.onClose();
      setFormData(emptyForm);
      setEditingId(null);
      await fetchImages();
    } catch {
      setError("Failed to save image");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (image: GalleryImage) => {
    setFormData({
      title: image.title,
      description: image.description || "",
      imageUrl: image.imageUrl,
      category: image.category || "events",
      eventName: (image as any).eventName || "",
      date: image.date || "",
      photographer: (image as any).photographer || "",
      attendees: image.attendees || 0,
      tags: image.tags?.join(", ") || "",
    });
    setEditingId(image.$id || null);
    modal.onOpen();
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this image?")) return;
    try {
      await galleryService.deleteImage(id);
      await fetchImages();
    } catch {
      setError("Failed to delete image");
    }
  };

  const handleToggleFeatured = async (id: string, currentStatus: boolean) => {
    try {
      await galleryService.toggleFeatured(id, !currentStatus);
      await fetchImages();
    } catch {
      setError("Failed to update image");
    }
  };

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      await galleryService.updateImage(id, { isApproved: approved });
      await fetchImages();
    } catch {
      setError("Failed to update approval status");
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;
  }
  if (!isAdmin) return null;

  const filtered = filter === "all" ? images
    : filter === "pending" ? images.filter((i) => !i.isApproved)
    : filter === "featured" ? images.filter((i) => i.isFeatured)
    : images.filter((i) => i.category === filter);

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

      {/* Header + Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <ImageIcon className="w-7 h-7 text-primary" />
            Gallery Management
          </h1>
          <p className="text-default-500 mt-1">
            {images.length} images &bull; {images.filter((i) => !i.isApproved).length} pending
          </p>
        </div>
        <Button
          color="primary"
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={() => { setFormData(emptyForm); setEditingId(null); modal.onOpen(); }}
        >
          Upload Image
        </Button>
      </div>

      {error && (
        <Card className="mb-4 border-none bg-danger-50 dark:bg-danger-950/30">
          <CardBody className="text-danger text-sm py-3">{error}</CardBody>
        </Card>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total", value: images.length, color: "text-primary" },
          { label: "Approved", value: images.filter((i) => i.isApproved).length, color: "text-success" },
          { label: "Pending", value: images.filter((i) => !i.isApproved).length, color: "text-warning" },
          { label: "Featured", value: images.filter((i) => i.isFeatured).length, color: "text-secondary" },
        ].map((s) => (
          <Card key={s.label} className="border-none shadow-md">
            <CardBody className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-default-500">{s.label}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { key: "all", label: "All" },
          { key: "pending", label: "Pending" },
          { key: "featured", label: "Featured" },
          ...CATEGORIES,
        ].map((cat) => (
          <Button
            key={cat.key}
            size="sm"
            variant={filter === cat.key ? "solid" : "flat"}
            color={filter === cat.key ? "primary" : "default"}
            onPress={() => setFilter(cat.key)}
            className="capitalize"
          >
            {cat.label}
          </Button>
        ))}
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="text-center py-12"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-default-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No images found</p>
          <p className="text-sm mt-1">
            {filter !== "all" ? "Try a different filter or " : ""}upload your first image
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((image) => (
            <Card key={image.$id} className="border-none shadow-md overflow-hidden">
              <CardBody className="p-0">
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={image.imageUrl}
                    alt={image.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    {image.isFeatured && (
                      <Chip size="sm" color="warning" variant="solid" className="text-xs">
                        <StarIcon className="w-3 h-3 mr-0.5 inline" /> Featured
                      </Chip>
                    )}
                    {!image.isApproved && (
                      <Chip size="sm" color="warning" variant="solid" className="text-xs">
                        Pending
                      </Chip>
                    )}
                  </div>
                </div>
              </CardBody>
              <CardFooter className="flex-col items-start gap-2 p-4">
                <div className="w-full">
                  <h3 className="font-semibold text-sm truncate">{image.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Chip size="sm" variant="flat" className="capitalize text-xs">
                      {image.category}
                    </Chip>
                    {image.date && (
                      <span className="text-xs text-default-400">{image.date}</span>
                    )}
                    {image.attendees > 0 && (
                      <span className="text-xs text-default-400">
                        <EyeIcon className="w-3 h-3 inline mr-0.5" />{image.attendees}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1.5 w-full pt-1">
                  <Button size="sm" variant="flat" onPress={() => handleEdit(image)} className="flex-1">
                    <EditIcon className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color={image.isFeatured ? "warning" : "default"}
                    isIconOnly
                    onPress={() => handleToggleFeatured(image.$id || "", image.isFeatured)}
                  >
                    <StarIcon className="w-3.5 h-3.5" />
                  </Button>
                  {!image.isApproved ? (
                    <Button size="sm" color="success" variant="flat" isIconOnly
                      onPress={() => handleApprove(image.$id || "", true)}
                    >
                      <CheckCircleIcon className="w-3.5 h-3.5" />
                    </Button>
                  ) : (
                    <Button size="sm" color="warning" variant="flat" isIconOnly
                      onPress={() => handleApprove(image.$id || "", false)}
                    >
                      <XCircleIcon className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button size="sm" color="danger" variant="flat" isIconOnly
                    onPress={() => handleDelete(image.$id || "")}
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Upload/Edit Modal */}
      <Modal isOpen={modal.isOpen} onOpenChange={modal.onOpenChange} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{editingId ? "Edit Image" : "Upload New Image"}</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input label="Title" value={formData.title} variant="bordered" isRequired
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Tech Summit 2024"
                  />
                  <Textarea label="Description" value={formData.description} variant="bordered"
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    minRows={2}
                  />
                  <Input label="Image URL" value={formData.imageUrl} variant="bordered" isRequired
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />

                  {/* Preview */}
                  {formData.imageUrl && (
                    <div className="border rounded-lg overflow-hidden">
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-40 object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <Select label="Category" selectedKeys={[formData.category]} variant="bordered"
                      onChange={(e) => setFormData({ ...formData, category: e.target.value as GalleryCategory })}
                    >
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.key} variant="bordered">{cat.label}</SelectItem>
                      ))}
                    </Select>
                    <Input label="Date" type="date" value={formData.date} variant="bordered"
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Event Name" value={formData.eventName} variant="bordered"
                      onChange={(e) => setFormData({ ...formData, eventName: e.target.value })}
                      placeholder="Optional"
                    />
                    <Input label="Photographer" value={formData.photographer} variant="bordered"
                      onChange={(e) => setFormData({ ...formData, photographer: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Attendees" type="number" value={String(formData.attendees)} variant="bordered"
                      onChange={(e) => setFormData({ ...formData, attendees: parseInt(e.target.value) || 0 })}
                    />
                    <Input label="Tags" value={formData.tags} variant="bordered"
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      placeholder="tag1, tag2, tag3"
                    />
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>Cancel</Button>
                <Button color="primary" onPress={handleSubmit} isLoading={saving}
                  isDisabled={!formData.title || !formData.imageUrl}
                >
                  {editingId ? "Update" : "Upload"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
