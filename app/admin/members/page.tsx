"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Divider } from "@heroui/divider";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { isUserAdminByEmail } from "@/lib/adminConfig";
import {
  UsersIcon,
  SearchIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowLeftIcon,
  FilterIcon,
  EyeIcon,
  MapPinIcon,
  BuildingIcon,
  MailIcon,
  PhoneIcon,
  LinkIcon,
} from "lucide-react";

interface MemberProfile {
  $id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  branch: string;
  year: string;
  college: string;
  program: string;
  rollNumber?: string;
  skills: string[];
  interests?: string[];
  bio?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  memberStatus: string;
  eventsAttended?: number;
  badges?: string[];
  $createdAt: string;
}

export default function AdminMembersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profiles, setProfiles] = useState<MemberProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [updating, setUpdating] = useState<string | null>(null);
  
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedProfile, setSelectedProfile] = useState<MemberProfile | null>(null);

  const isAdmin = !authLoading && user && (
    isUserAdminByEmail(user.email) || user.labels?.includes("admin")
  );

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const listRes = await fetch(
        `/api/admin/members`,
        { credentials: "same-origin" }
      );
      if (listRes.ok) {
        const data = await listRes.json();
        setProfiles(data.profiles || []);
      }
    } catch (err) {
      console.error("Error loading profiles:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push("/unauthorized");
      return;
    }
    if (isAdmin) loadProfiles();
  }, [authLoading, isAdmin, loadProfiles]);

  const updateStatus = async (profileId: string, status: string) => {
    setUpdating(profileId);
    try {
      const res = await fetch("/api/admin/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId, memberStatus: status }),
      });
      if (res.ok) {
        setProfiles((prev) =>
          prev.map((p) =>
            p.$id === profileId ? { ...p, memberStatus: status } : p
          )
        );
      }
    } catch (err) {
      console.error("Error updating status:", err);
    } finally {
      setUpdating(null);
    }
  };

  const filteredProfiles = profiles.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.college.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === "all" || p.memberStatus === filter;
    return matchesSearch && matchesFilter;
  });

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAdmin) return null;

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

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
            <UsersIcon className="w-7 h-7 text-primary" />
            Member Profiles
          </h1>
          <p className="text-default-500 mt-1">{profiles.length} total members</p>
        </div>

        <div className="flex gap-2">
          {["all", "pending", "approved", "suspended"].map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "solid" : "flat"}
              color={
                f === "pending" ? "warning" :
                f === "approved" ? "success" :
                f === "suspended" ? "danger" : "default"
              }
              onPress={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <Input
        placeholder="Search by name, email, or college..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        startContent={<SearchIcon className="w-4 h-4 text-default-400" />}
        variant="bordered"
        className="mb-6"
      />

      {loading ? (
        <div className="text-center py-12">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProfiles.map((profile) => (
            <Card key={profile.$id} className="border-none shadow-md">
              <CardBody className="p-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold flex-shrink-0">
                      {profile.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-base">{profile.name}</p>
                        <Chip
                          size="sm"
                          color={
                            profile.memberStatus === "approved" ? "success" :
                            profile.memberStatus === "suspended" ? "danger" : "warning"
                          }
                          variant="flat"
                        >
                          {profile.memberStatus}
                        </Chip>
                      </div>
                      <p className="text-sm text-default-500">{profile.email}</p>
                      <div className="flex flex-wrap gap-2 mt-2 text-xs text-default-400">
                        <span>{profile.college}</span>
                        <span>•</span>
                        <span>{profile.program} - {profile.branch}</span>
                        <span>•</span>
                        <span>{profile.year}</span>
                      </div>
                      {profile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {profile.skills.slice(0, 5).map((skill, i) => (
                            <Chip key={i} size="sm" variant="flat" className="text-xs">
                              {skill}
                            </Chip>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      startContent={<EyeIcon className="w-3.5 h-3.5" />}
                      onPress={() => {
                        setSelectedProfile(profile);
                        onOpen();
                      }}
                    >
                      Details
                    </Button>
                    {profile.memberStatus !== "approved" && (
                      <Button
                        size="sm"
                        color="success"
                        variant="flat"
                        isLoading={updating === profile.$id}
                        onPress={() => updateStatus(profile.$id, "approved")}
                        startContent={<CheckCircleIcon className="w-3.5 h-3.5" />}
                      >
                        Approve
                      </Button>
                    )}
                    {profile.memberStatus !== "suspended" && (
                      <Button
                        size="sm"
                        color="danger"
                        variant="flat"
                        isLoading={updating === profile.$id}
                        onPress={() => updateStatus(profile.$id, "suspended")}
                        startContent={<XCircleIcon className="w-3.5 h-3.5" />}
                      >
                        Suspend
                      </Button>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}

          {filteredProfiles.length === 0 && (
            <div className="text-center py-12 text-default-400">
              <UsersIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No members found</p>
            </div>
          )}
        </div>
      )}

      {/* Profile Details Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={() => {
          onClose();
          setSelectedProfile(null);
        }}
        size="2xl"
        scrollBehavior="inside"
        classNames={{
          base: "max-h-[95vh]",
          wrapper: "items-center"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 pb-4 border-b">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <UsersIcon className="w-5 h-5 text-primary" />
              Member Profile Details
            </h2>
            <p className="text-sm font-normal text-default-500">
              Full details and information provided during registration
            </p>
          </ModalHeader>
          <ModalBody className="py-6">
            {selectedProfile && (
              <div className="space-y-6">
                {/* Header Section */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold flex-shrink-0 shadow-sm">
                    {selectedProfile.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="text-xl font-bold truncate">{selectedProfile.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Chip
                        size="sm"
                        color={
                          selectedProfile.memberStatus === "approved" ? "success" :
                          selectedProfile.memberStatus === "suspended" ? "danger" : "warning"
                        }
                        variant="flat"
                      >
                        {selectedProfile.memberStatus}
                      </Chip>
                      <span className="text-sm text-default-500">Joined {new Date(selectedProfile.$createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <Divider />

                {/* Contact Information */}
                <div>
                  <h4 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-default-100 dark:bg-default-50/10 flex items-center justify-center text-default-500 shrink-0">
                        <MailIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-default-500">Email Address</p>
                        <p className="text-sm font-medium truncate" title={selectedProfile.email}>{selectedProfile.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-default-100 dark:bg-default-50/10 flex items-center justify-center text-default-500 shrink-0">
                        <PhoneIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-default-500">Phone</p>
                        <p className="text-sm font-medium truncate">{selectedProfile.phone || "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="p-4 bg-default-50 dark:bg-default-100/5 rounded-xl border border-default-100 dark:border-default-100/10">
                  <h4 className="text-sm font-semibold text-primary mb-4 uppercase tracking-wider flex items-center gap-2">
                    <BuildingIcon className="w-4 h-4" />
                    Academic Details
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-default-500">College / Institution</p>
                      <p className="text-sm font-medium">{selectedProfile.college}</p>
                    </div>
                    <div>
                      <p className="text-xs text-default-500">Program / Degree</p>
                      <p className="text-sm font-medium">{selectedProfile.program}</p>
                    </div>
                    <div>
                      <p className="text-xs text-default-500">Branch / Major</p>
                      <p className="text-sm font-medium">{selectedProfile.branch}</p>
                    </div>
                    <div>
                      <p className="text-xs text-default-500">Year</p>
                      <p className="text-sm font-medium">{selectedProfile.year}</p>
                    </div>
                  </div>
                  {selectedProfile.rollNumber && (
                    <div className="mt-4 pt-4 border-t border-default-200 dark:border-default-50/10">
                      <p className="text-xs text-default-500">Roll/Registration Number</p>
                      <p className="text-sm font-medium">{selectedProfile.rollNumber}</p>
                    </div>
                  )}
                </div>

                {/* About & Skills */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Bio / About</h4>
                    {selectedProfile.bio ? (
                      <p className="text-sm text-default-600 leading-relaxed whitespace-pre-wrap bg-default-50 dark:bg-default-50/5 p-3 rounded-lg border border-default-100">
                        {selectedProfile.bio}
                      </p>
                    ) : (
                      <p className="text-sm text-default-400 italic">No bio provided</p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedProfile.skills && selectedProfile.skills.length > 0 ? (
                        selectedProfile.skills.map((skill, i) => (
                          <Chip key={i} size="sm" variant="flat" color="secondary">
                            {skill}
                          </Chip>
                        ))
                      ) : (
                        <p className="text-sm text-default-400 italic">No skills listed</p>
                      )}
                    </div>
                    
                    {selectedProfile.interests && selectedProfile.interests.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Interests</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedProfile.interests.map((interest, i) => (
                            <Chip key={i} size="sm" variant="flat" color="warning" className="text-xs">
                              {interest}
                            </Chip>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Social Links */}
                {(selectedProfile.linkedin || selectedProfile.github || selectedProfile.portfolio) && (
                  <>
                    <Divider />
                    <div>
                      <h4 className="text-sm font-semibold text-primary mb-3 uppercase tracking-wider">Profiles & Links</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {selectedProfile.linkedin && (
                          <Button as="a" href={selectedProfile.linkedin} target="_blank" rel="noopener noreferrer" 
                            size="sm" variant="flat" color="primary" className="justify-start" startContent={<LinkIcon className="w-3.5 h-3.5" />}>
                            LinkedIn Profile
                          </Button>
                        )}
                        {selectedProfile.github && (
                          <Button as="a" href={selectedProfile.github} target="_blank" rel="noopener noreferrer" 
                            size="sm" variant="flat" color="default" className="justify-start" startContent={<LinkIcon className="w-3.5 h-3.5" />}>
                            GitHub Profile
                          </Button>
                        )}
                        {selectedProfile.portfolio && (
                          <Button as="a" href={selectedProfile.portfolio} target="_blank" rel="noopener noreferrer" 
                            size="sm" variant="flat" color="secondary" className="justify-start" startContent={<LinkIcon className="w-3.5 h-3.5" />}>
                            Personal Portfolio
                          </Button>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Additional Stats */}
                <div className="flex gap-4 p-4 bg-primary-50 dark:bg-primary-900/10 rounded-xl">
                  <div>
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">Events Attended</p>
                    <p className="text-xl font-bold text-primary">{selectedProfile.eventsAttended || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">Badges Earned</p>
                    <p className="text-xl font-bold text-primary">{(selectedProfile.badges || []).length}</p>
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
          <ModalFooter className="border-t pt-4">
            <Button color="primary" onPress={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
