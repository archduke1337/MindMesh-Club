"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
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
  skills: string[];
  memberStatus: string;
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

  const isAdmin = !authLoading && user && (
    isUserAdminByEmail(user.email) || user.labels?.includes("admin")
  );

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/members/profile?userId=__ALL__");
      // Since our current API doesn't support listing all, we'll use the admin endpoint
      // For now, fetch from Appwrite directly using admin REST
      const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
      const dbId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

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
      const res = await fetch("/api/members/profile", {
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
    </div>
  );
}
