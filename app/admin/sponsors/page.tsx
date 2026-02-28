// app/admin/sponsors/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { isUserAdminByEmail } from "@/lib/adminConfig";
import { Sponsor, sponsorService, sponsorTiers } from "@/lib/sponsors";
import { getErrorMessage } from "@/lib/errorHandler";
import {
  ArrowLeftIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
  ExternalLinkIcon,
  CheckIcon,
  XIcon,
  HeartHandshakeIcon,
} from "lucide-react";

export default function AdminSponsorsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const modal = useDisclosure();

  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);

  const [formData, setFormData] = useState<Sponsor>({
    name: "",
    logo: "",
    website: "",
    tier: "partner",
    description: "",
    category: "",
    isActive: true,
    displayOrder: 0,
    featured: false,
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
  });

  const isAdmin =
    !authLoading &&
    user &&
    (isUserAdminByEmail(user.email) || user.labels?.includes("admin"));

  const loadSponsors = useCallback(async () => {
    setLoading(true);
    try {
      setError(null);
      const data = await sponsorService.getAllSponsors();
      setSponsors(data);
    } catch (err) {
      setError(`Failed to load: ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/unauthorized");
      return;
    }
    if (isAdmin) loadSponsors();
  }, [authLoading, isAdmin, loadSponsors]);

  const resetForm = () => {
    setFormData({
      name: "", logo: "", website: "", tier: "partner",
      description: "", category: "", isActive: true,
      displayOrder: sponsors.length, featured: false,
      startDate: new Date().toISOString().split("T")[0], endDate: "",
    });
    setEditingSponsor(null);
  };

  const openCreate = () => { resetForm(); modal.onOpen(); };

  const openEdit = (sponsor: Sponsor) => {
    setEditingSponsor(sponsor);
    setFormData({ ...sponsor });
    modal.onOpen();
  };

  const handleSave = async () => {
    if (!formData.name || !formData.logo || !formData.website) {
      setError("Name, Logo URL, and Website are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (editingSponsor) {
        await sponsorService.updateSponsor(editingSponsor.$id!, formData);
      } else {
        await sponsorService.createSponsor(formData as any);
      }
      modal.onClose();
      await loadSponsors();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this sponsor?")) return;
    try {
      await sponsorService.deleteSponsor(id);
      await loadSponsors();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (authLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Spinner size="lg" /></div>;
  }
  if (!isAdmin) return null;

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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <HeartHandshakeIcon className="w-7 h-7 text-primary" />
            Sponsors Management
          </h1>
          <p className="text-default-500 mt-1">
            {sponsors.length} sponsors &bull; {sponsors.filter((s) => s.isActive).length} active
          </p>
        </div>
        <Button color="primary" startContent={<PlusIcon className="w-4 h-4" />} onPress={openCreate}>
          Add Sponsor
        </Button>
      </div>

      {error && (
        <Card className="mb-4 border-none bg-danger-50 dark:bg-danger-950/30">
          <CardBody className="text-danger text-sm py-3">{error}</CardBody>
        </Card>
      )}

      {/* Sponsors Grid */}
      {loading ? (
        <div className="text-center py-12"><Spinner size="lg" /></div>
      ) : sponsors.length === 0 ? (
        <div className="text-center py-12 text-default-400">
          <HeartHandshakeIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No sponsors yet</p>
          <Button color="primary" className="mt-4" onPress={openCreate}>
            Add First Sponsor
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sponsors.map((sponsor) => {
            const tierInfo = sponsorTiers[sponsor.tier as keyof typeof sponsorTiers];

            return (
              <Card key={sponsor.$id} className={`border-none shadow-md ${!sponsor.isActive ? "opacity-60" : ""}`}>
                <CardBody className="p-4 space-y-3">
                  {/* Badges */}
                  <div className="flex gap-1.5 flex-wrap">
                    <Chip
                      className={`bg-gradient-to-r ${tierInfo?.color || "from-gray-400 to-gray-500"} text-white`}
                      size="sm"
                    >
                      {tierInfo?.label || sponsor.tier}
                    </Chip>
                    {sponsor.featured && (
                      <Chip color="warning" size="sm" variant="flat">Featured</Chip>
                    )}
                    <Chip color={sponsor.isActive ? "success" : "danger"} size="sm" variant="flat"
                      startContent={sponsor.isActive ? <CheckIcon className="w-3 h-3" /> : <XIcon className="w-3 h-3" />}
                    >
                      {sponsor.isActive ? "Active" : "Inactive"}
                    </Chip>
                  </div>

                  {/* Logo */}
                  <div className="flex items-center justify-center h-20 bg-default-100 rounded-lg p-2">
                    <img
                      src={sponsor.logo}
                      alt={sponsor.name}
                      className="max-h-16 max-w-full object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className="font-bold text-base">{sponsor.name}</h3>
                    {sponsor.category && (
                      <p className="text-xs text-default-500 capitalize">{sponsor.category}</p>
                    )}
                    {sponsor.description && (
                      <p className="text-xs text-default-400 mt-1 line-clamp-2">{sponsor.description}</p>
                    )}
                    <p className="text-xs text-default-400 mt-1">Order: {sponsor.displayOrder}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button as="a" href={sponsor.website} target="_blank"
                      size="sm" variant="flat" className="flex-1"
                      startContent={<ExternalLinkIcon className="w-3.5 h-3.5" />}
                    >
                      Visit
                    </Button>
                    <Button size="sm" color="primary" variant="flat" isIconOnly
                      onPress={() => openEdit(sponsor)}
                    >
                      <EditIcon className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" color="danger" variant="flat" isIconOnly
                      onPress={() => handleDelete(sponsor.$id!)}
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modal.isOpen} onOpenChange={modal.onOpenChange} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>{editingSponsor ? "Edit Sponsor" : "Add Sponsor"}</ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Company Name" value={formData.name} isRequired variant="bordered"
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                    <Select label="Tier" selectedKeys={[formData.tier]} variant="bordered"
                      onChange={(e) => setFormData({ ...formData, tier: e.target.value as Sponsor["tier"] })}
                    >
                      <SelectItem key="platinum">Platinum Partner</SelectItem>
                      <SelectItem key="gold">Gold Sponsor</SelectItem>
                      <SelectItem key="silver">Silver Sponsor</SelectItem>
                      <SelectItem key="bronze">Bronze Sponsor</SelectItem>
                      <SelectItem key="partner">Community Partner</SelectItem>
                    </Select>
                  </div>

                  <Input label="Logo URL" value={formData.logo} isRequired variant="bordered"
                    onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                    description="Direct link to logo image (PNG, JPG, SVG)"
                  />

                  {formData.logo && (
                    <div className="border-2 border-dashed rounded-lg p-3 text-center">
                      <p className="text-xs text-default-400 mb-2">Logo Preview</p>
                      <img src={formData.logo} alt="Preview" className="max-h-20 mx-auto object-contain"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    </div>
                  )}

                  <Input label="Website URL" value={formData.website} isRequired variant="bordered"
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Select label="Category" selectedKeys={formData.category ? [formData.category] : []} variant="bordered"
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <SelectItem key="tech">Technology</SelectItem>
                      <SelectItem key="education">Education</SelectItem>
                      <SelectItem key="finance">Finance</SelectItem>
                      <SelectItem key="healthcare">Healthcare</SelectItem>
                      <SelectItem key="other">Other</SelectItem>
                    </Select>
                    <Input type="number" label="Display Order" value={String(formData.displayOrder)} variant="bordered"
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                      description="Lower = first"
                    />
                  </div>

                  <Textarea label="Description" value={formData.description || ""} variant="bordered"
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    minRows={2}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <Input type="date" label="Start Date" value={formData.startDate} variant="bordered"
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                    <Input type="date" label="End Date (optional)" value={formData.endDate || ""} variant="bordered"
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>

                  <div className="flex gap-6">
                    <Switch isSelected={formData.isActive}
                      onValueChange={(v) => setFormData({ ...formData, isActive: v })}
                    >
                      Active
                    </Switch>
                    <Switch isSelected={formData.featured}
                      onValueChange={(v) => setFormData({ ...formData, featured: v })}
                    >
                      Featured
                    </Switch>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>Cancel</Button>
                <Button color="primary" onPress={handleSave} isLoading={saving}
                  isDisabled={!formData.name || !formData.logo || !formData.website}
                >
                  {editingSponsor ? "Update" : "Create"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}