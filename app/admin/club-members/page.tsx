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
  UsersIcon,
  PlusIcon,
  ArrowLeftIcon,
  EditIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "lucide-react";

interface ClubMember {
  $id: string;
  name: string;
  avatar: string | null;
  memberType: string;
  designation: string;
  department: string | null;
  bio: string | null;
  tagline: string | null;
  institution: string | null;
  linkedin: string | null;
  github: string | null;
  isActive: boolean;
  isFeatured: boolean;
  displayOrder: number;
}

const MEMBER_TYPES = ["core", "volunteer", "advisor", "alumni", "mentor"];

export default function AdminClubMembersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const modal = useDisclosure();

  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingMember, setEditingMember] = useState<ClubMember | null>(null);

  const [form, setForm] = useState({
    name: "",
    designation: "",
    memberType: "core",
    department: "",
    bio: "",
    tagline: "",
    institution: "",
    linkedin: "",
    github: "",
    isActive: true,
    isFeatured: false,
  });

  const isAdmin = !authLoading && user && (
    isUserAdminByEmail(user.email) || user.labels?.includes("admin")
  );

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/club-members");
      if (res.ok) {
        const data = await res.json();
        setMembers((data.members || []).sort((a: ClubMember, b: ClubMember) => a.displayOrder - b.displayOrder));
      }
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
    if (isAdmin) loadMembers();
  }, [authLoading, isAdmin, loadMembers]);

  const openCreateModal = () => {
    setEditingMember(null);
    setForm({
      name: "",
      designation: "",
      memberType: "core",
      department: "",
      bio: "",
      tagline: "",
      institution: "",
      linkedin: "",
      github: "",
      isActive: true,
      isFeatured: false,
    });
    modal.onOpen();
  };

  const openEditModal = (member: ClubMember) => {
    setEditingMember(member);
    setForm({
      name: member.name,
      designation: member.designation,
      memberType: member.memberType,
      department: member.department || "",
      bio: member.bio || "",
      tagline: member.tagline || "",
      institution: member.institution || "",
      linkedin: member.linkedin || "",
      github: member.github || "",
      isActive: member.isActive,
      isFeatured: member.isFeatured,
    });
    modal.onOpen();
  };

  const handleSave = async () => {
    if (!form.name || !form.designation) return;
    setSaving(true);
    try {
      const method = editingMember ? "PATCH" : "POST";
      const body = editingMember
        ? { memberId: editingMember.$id, ...form }
        : { ...form, displayOrder: members.length };

      const res = await fetch("/api/admin/club-members", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        modal.onClose();
        await loadMembers();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save");
      }
    } catch (err: any) {
      alert(err.message || "Error saving");
    } finally {
      setSaving(false);
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
            <UsersIcon className="w-7 h-7 text-secondary" />
            Club Team Members
          </h1>
          <p className="text-default-500 mt-1">{members.length} members</p>
        </div>
        <Button
          color="primary"
          startContent={<PlusIcon className="w-4 h-4" />}
          onPress={openCreateModal}
        >
          Add Member
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12"><Spinner size="lg" /></div>
      ) : (
        <div className="space-y-3">
          {members.map((member, idx) => (
            <Card key={member.$id} className="border-none shadow-md">
              <CardBody className="p-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold flex-shrink-0 text-lg">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-sm">{member.name}</p>
                      <Chip size="sm" variant="flat" className="capitalize text-xs">
                        {member.memberType}
                      </Chip>
                      {!member.isActive && (
                        <Chip size="sm" color="danger" variant="flat" className="text-xs">
                          Inactive
                        </Chip>
                      )}
                      {member.isFeatured && (
                        <Chip size="sm" color="warning" variant="flat" className="text-xs">
                          ⭐ Featured
                        </Chip>
                      )}
                    </div>
                    <p className="text-xs text-default-500">{member.designation}</p>
                    {member.department && (
                      <p className="text-xs text-default-400">{member.department}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs text-default-400 mr-2">#{idx + 1}</span>
                    <Button
                      isIconOnly
                      size="sm"
                      variant="light"
                      onPress={() => openEditModal(member)}
                    >
                      <EditIcon className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}

          {members.length === 0 && (
            <div className="text-center py-12 text-default-400">
              <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No team members yet</p>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={modal.isOpen} onOpenChange={modal.onOpenChange} size="2xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>
                {editingMember ? "Edit Team Member" : "Add Team Member"}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label="Name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    isRequired
                    variant="bordered"
                  />
                  <Input
                    label="Designation"
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    isRequired
                    variant="bordered"
                    placeholder="e.g. President, Tech Lead"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Select
                      label="Member Type"
                      selectedKeys={[form.memberType]}
                      onChange={(e) => setForm({ ...form, memberType: e.target.value })}
                      variant="bordered"
                    >
                      {MEMBER_TYPES.map((t) => (
                        <SelectItem key={t} className="capitalize">{t}</SelectItem>
                      ))}
                    </Select>
                    <Input
                      label="Department"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      variant="bordered"
                      placeholder="e.g. Technology"
                    />
                  </div>
                  <Input
                    label="Institution"
                    value={form.institution}
                    onChange={(e) => setForm({ ...form, institution: e.target.value })}
                    variant="bordered"
                  />
                  <Input
                    label="Tagline"
                    value={form.tagline}
                    onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                    variant="bordered"
                    placeholder="Short one-liner"
                  />
                  <Textarea
                    label="Bio"
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    variant="bordered"
                    minRows={2}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="LinkedIn URL"
                      value={form.linkedin}
                      onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
                      variant="bordered"
                    />
                    <Input
                      label="GitHub username"
                      value={form.github}
                      onChange={(e) => setForm({ ...form, github: e.target.value })}
                      variant="bordered"
                    />
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                      <Switch
                        isSelected={form.isActive}
                        onValueChange={(val) => setForm({ ...form, isActive: val })}
                        size="sm"
                      />
                      <span className="text-sm">Active</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        isSelected={form.isFeatured}
                        onValueChange={(val) => setForm({ ...form, isFeatured: val })}
                        size="sm"
                      />
                      <span className="text-sm">Featured</span>
                    </div>
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>Cancel</Button>
                <Button
                  color="primary"
                  onPress={handleSave}
                  isLoading={saving}
                  isDisabled={!form.name || !form.designation}
                >
                  {editingMember ? "Update" : "Add Member"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
