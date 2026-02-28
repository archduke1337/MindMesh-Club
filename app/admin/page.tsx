// app/admin/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Divider } from "@heroui/divider";
import NextLink from "next/link";
import { useAuth } from "@/context/AuthContext";
import { isUserAdminByEmail } from "@/lib/adminConfig";
import { useRouter } from "next/navigation";
import {
  LayoutDashboardIcon,
  NewspaperIcon,
  CalendarIcon,
  ImageIcon,
  FolderIcon,
  HeartHandshakeIcon,
  UsersIcon,
  TrendingUpIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  ActivityIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  GavelIcon,
  TicketPercentIcon,
  BookOpenIcon,
  Users2Icon,
  FileTextIcon,
} from "lucide-react";

interface AdminStats {
  blogs: { total: number; pending: number; approved: number; rejected: number };
  gallery: { total: number; pending: number };
  events: { total: number; upcoming: number };
  loading: boolean;
  error: string | null;
}

const adminSections = [
  {
    title: "Blog Management",
    description: "Review, approve, reject, and manage blog submissions from community members.",
    href: "/admin/blog",
    icon: NewspaperIcon,
    color: "primary" as const,
    gradient: "from-blue-500 to-cyan-400",
  },
  {
    title: "Event Management",
    description: "Create, edit, and manage events. Track registrations and check-in attendees.",
    href: "/admin/events",
    icon: CalendarIcon,
    color: "secondary" as const,
    gradient: "from-purple-500 to-pink-400",
  },
  {
    title: "Gallery Management",
    description: "Upload, organize, and curate gallery images. Manage categories and featured photos.",
    href: "/admin/gallery",
    icon: ImageIcon,
    color: "success" as const,
    gradient: "from-green-500 to-emerald-400",
  },
  {
    title: "Project Management",
    description: "Showcase community projects. Add, edit, and organize project listings.",
    href: "/admin/projects",
    icon: FolderIcon,
    color: "warning" as const,
    gradient: "from-orange-500 to-yellow-400",
  },
  {
    title: "Sponsor Management",
    description: "Manage sponsor tiers, logos, and partnerships. Track sponsorship status.",
    href: "/admin/sponsors",
    icon: HeartHandshakeIcon,
    color: "danger" as const,
    gradient: "from-red-500 to-rose-400",
  },
  {
    title: "Member Profiles",
    description: "View, approve, and manage member registrations and profiles.",
    href: "/admin/members",
    icon: UsersIcon,
    color: "primary" as const,
    gradient: "from-indigo-500 to-blue-400",
  },
  {
    title: "Announcements",
    description: "Create and manage announcements shown across the platform.",
    href: "/admin/announcements",
    icon: ActivityIcon,
    color: "warning" as const,
    gradient: "from-amber-500 to-yellow-400",
  },
  {
    title: "Club Members",
    description: "Manage club team members, designations, departments, and display order.",
    href: "/admin/club-members",
    icon: ShieldCheckIcon,
    color: "secondary" as const,
    gradient: "from-violet-500 to-purple-400",
  },
  {
    title: "Hackathon Judging",
    description: "Manage judges, evaluation criteria, and scoring for hackathon events.",
    href: "/admin/judging",
    icon: GavelIcon,
    color: "warning" as const,
    gradient: "from-yellow-500 to-amber-400",
  },
  {
    title: "Hackathon Teams",
    description: "View and manage hackathon teams, members, and invite codes.",
    href: "/admin/teams",
    icon: Users2Icon,
    color: "primary" as const,
    gradient: "from-blue-500 to-indigo-400",
  },
  {
    title: "Submissions",
    description: "Review hackathon project submissions, manage status, and view scores.",
    href: "/admin/submissions",
    icon: FileTextIcon,
    color: "secondary" as const,
    gradient: "from-pink-500 to-rose-400",
  },
  {
    title: "Discount Coupons",
    description: "Create and manage discount codes for events. Track usage and set limits.",
    href: "/admin/coupons",
    icon: TicketPercentIcon,
    color: "success" as const,
    gradient: "from-emerald-500 to-green-400",
  },
  {
    title: "Resources",
    description: "Manage learning resources, slides, videos, code samples, and roadmaps.",
    href: "/admin/resources",
    icon: BookOpenIcon,
    color: "primary" as const,
    gradient: "from-cyan-500 to-blue-400",
  },
];

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({
    blogs: { total: 0, pending: 0, approved: 0, rejected: 0 },
    gallery: { total: 0, pending: 0 },
    events: { total: 0, upcoming: 0 },
    loading: true,
    error: null,
  });

  const isAdmin = !authLoading && user && (
    isUserAdminByEmail(user.email) || user.labels?.includes("admin")
  );

  const fetchStats = useCallback(async () => {
    setStats((prev) => ({ ...prev, loading: true, error: null }));
    try {
      // Fetch blog stats
      const blogRes = await fetch("/api/blog?limit=100", { credentials: "same-origin" });
      let blogData = { total: 0, pending: 0, approved: 0, rejected: 0 };
      if (blogRes.ok) {
        const blogJson = await blogRes.json();
        const blogs = blogJson.data || [];
        blogData = {
          total: blogs.length,
          pending: blogs.filter((b: any) => b.status === "pending").length,
          approved: blogs.filter((b: any) => b.status === "approved").length,
          rejected: blogs.filter((b: any) => b.status === "rejected").length,
        };
      }

      // Fetch gallery stats
      const galleryRes = await fetch("/api/gallery", { credentials: "same-origin" });
      let galleryData = { total: 0, pending: 0 };
      if (galleryRes.ok) {
        const galleryJson = await galleryRes.json();
        const images = galleryJson.images || galleryJson.data || [];
        galleryData = {
          total: images.length,
          pending: images.filter((i: any) => i.status === "pending").length,
        };
      }

      // Fetch event stats
      const eventsRes = await fetch("/api/events/register", { credentials: "same-origin" });
      let eventsData = { total: 0, upcoming: 0 };
      if (eventsRes.ok) {
        const eventsJson = await eventsRes.json();
        const allEvents = eventsJson.events || eventsJson || [];
        const now = new Date();
        eventsData = {
          total: allEvents.length,
          upcoming: allEvents.filter((e: any) => new Date(e.date || e.startDate) >= now).length,
        };
      }

      setStats({
        blogs: blogData,
        gallery: galleryData,
        events: eventsData,
        loading: false,
        error: null,
      });
    } catch (err) {
      setStats((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load some stats. Data may be incomplete.",
      }));
    }
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
        return;
      }
      if (!isUserAdminByEmail(user.email)) {
        router.push("/unauthorized");
        return;
      }
      fetchStats();
    }
  }, [authLoading, user, router, fetchStats]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Spinner size="lg" color="primary" />
          <p className="text-default-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="max-w-7xl mx-auto py-6 md:py-10 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 md:mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
              <LayoutDashboardIcon className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Admin Dashboard
              </h1>
              <p className="text-default-500 text-sm mt-0.5">
                Welcome back, {user?.name || "Admin"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Chip
              startContent={<ShieldCheckIcon className="w-3.5 h-3.5" />}
              variant="flat"
              color="success"
              size="sm"
            >
              Admin Access
            </Chip>
            <Button
              size="sm"
              variant="flat"
              startContent={<RefreshCwIcon className="w-3.5 h-3.5" />}
              onPress={fetchStats}
              isLoading={stats.loading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-10">
        <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-default-500 uppercase tracking-wider font-medium">Total Blogs</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">
                  {stats.loading ? "—" : stats.blogs.total}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-blue-500/20">
                <NewspaperIcon className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            {!stats.loading && stats.blogs.pending > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                <ClockIcon className="w-3 h-3 text-warning" />
                <span className="text-xs text-warning font-medium">{stats.blogs.pending} pending review</span>
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-default-500 uppercase tracking-wider font-medium">Gallery Images</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">
                  {stats.loading ? "—" : stats.gallery.total}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/20">
                <ImageIcon className="w-5 h-5 text-green-500" />
              </div>
            </div>
            {!stats.loading && stats.gallery.pending > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                <ClockIcon className="w-3 h-3 text-warning" />
                <span className="text-xs text-warning font-medium">{stats.gallery.pending} pending approval</span>
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-default-500 uppercase tracking-wider font-medium">Total Events</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">
                  {stats.loading ? "—" : stats.events.total}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/20">
                <CalendarIcon className="w-5 h-5 text-purple-500" />
              </div>
            </div>
            {!stats.loading && stats.events.upcoming > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                <TrendingUpIcon className="w-3 h-3 text-success" />
                <span className="text-xs text-success font-medium">{stats.events.upcoming} upcoming</span>
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border border-red-500/20">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-default-500 uppercase tracking-wider font-medium">Blog Status</p>
                <p className="text-2xl md:text-3xl font-bold text-foreground mt-1">
                  {stats.loading ? "—" : stats.blogs.approved}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-red-500/20">
                <CheckCircleIcon className="w-5 h-5 text-red-500" />
              </div>
            </div>
            {!stats.loading && stats.blogs.rejected > 0 && (
              <div className="mt-2 flex items-center gap-1.5">
                <XCircleIcon className="w-3 h-3 text-danger" />
                <span className="text-xs text-danger font-medium">{stats.blogs.rejected} rejected</span>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {stats.error && (
        <Card className="mb-6 border border-warning/30 bg-warning/5">
          <CardBody className="p-3 flex flex-row items-center gap-2">
            <AlertCircleIcon className="w-4 h-4 text-warning flex-shrink-0" />
            <p className="text-sm text-warning">{stats.error}</p>
          </CardBody>
        </Card>
      )}

      {/* Quick Actions */}
      {!stats.loading && stats.blogs.pending > 0 && (
        <Card className="mb-8 md:mb-10 border border-warning/30 bg-warning/5">
          <CardBody className="p-4 md:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-warning/20">
                  <ActivityIcon className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Action Required</p>
                  <p className="text-sm text-default-500">
                    {stats.blogs.pending} blog{stats.blogs.pending !== 1 ? "s" : ""} waiting for your review
                  </p>
                </div>
              </div>
              <Button
                as={NextLink}
                href="/admin/blog"
                size="sm"
                color="warning"
                variant="flat"
                endContent={<ArrowRightIcon className="w-3.5 h-3.5" />}
              >
                Review Now
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Admin Sections Grid */}
      <div className="mb-6">
        <h2 className="text-lg md:text-xl font-semibold text-foreground mb-1">Management Panels</h2>
        <p className="text-sm text-default-500">Select a section to manage</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
        {adminSections.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.href}
              as={NextLink}
              href={section.href}
              isPressable
              className="group border border-default-200 hover:border-default-300 transition-all duration-200 hover:shadow-lg"
            >
              <CardBody className="p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${section.gradient} text-white shadow-md group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {section.title}
                      </h3>
                      <ArrowRightIcon className="w-4 h-4 text-default-400 group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                    </div>
                    <p className="text-sm text-default-500 line-clamp-2">
                      {section.description}
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>

      {/* Admin Info Footer */}
      <Divider className="my-8 md:my-10" />
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-default-400">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="w-4 h-4" />
          <span>Logged in as <span className="text-default-600 font-medium">{user?.email}</span></span>
        </div>
        <div className="flex items-center gap-2">
          <ClockIcon className="w-4 h-4" />
          <span>Last refreshed: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
