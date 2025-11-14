// app/admin/blogs/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { Tabs, Tab } from "@heroui/tabs";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/modal";
import { Textarea } from "@heroui/input";
import { useAuth } from "@/context/AuthContext";
import { blogService, Blog } from "@/lib/blog";
import AdminPageWrapper from "@/components/AdminPageWrapper";
import { getErrorMessage } from "@/lib/errorHandler";
import {
  CheckIcon,
  XIcon,
  EyeIcon,
  TrashIcon,
  ClockIcon,
  StarIcon,
  AlertCircle,
} from "lucide-react";

export default function AdminBlogsPage() {
  const { user, loading: authLoading } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState("pending");
  const [processingBlog, setProcessingBlog] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Rejection modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingBlog, setRejectingBlog] = useState<Blog | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Toast helper
  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (!authLoading && user) {
      loadBlogs();
    }
  }, [user, authLoading]);

  useEffect(() => {
    filterBlogsByTab();
  }, [selectedTab, blogs]);

  const loadBlogs = async () => {
    try {
      setError(null);
      setLoading(true);
      const allBlogs = await blogService.getAllBlogs();
      setBlogs(allBlogs);
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      console.error("Error loading blogs:", errorMsg);
      setError(`Failed to load blogs: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const filterBlogsByTab = () => {
    let filtered = blogs;

    switch (selectedTab) {
      case "pending":
        filtered = blogs.filter((b) => b.status === "pending");
        break;
      case "approved":
        filtered = blogs.filter((b) => b.status === "approved");
        break;
      case "rejected":
        filtered = blogs.filter((b) => b.status === "rejected");
        break;
      default:
        filtered = blogs;
    }

    setFilteredBlogs(filtered);
  };

  const handleApprove = async (blogId: string) => {
    if (!confirm("Approve this blog for publishing?")) return;

    setProcessingBlog(blogId);
    try {
      await blogService.approveBlog(blogId);
      showToast("Blog approved successfully!", "success");
      await loadBlogs();
    } catch (error) {
      console.error("Error approving blog:", error);
      showToast("Failed to approve blog", "error");
    } finally {
      setProcessingBlog(null);
    }
  };

  const openRejectModal = (blog: Blog) => {
    setRejectingBlog(blog);
    setRejectionReason("");
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectingBlog) return;
    if (!rejectionReason.trim()) {
      showToast("Please provide a reason for rejection", "error");
      return;
    }

    setProcessingBlog(rejectingBlog.$id!);
    try {
      await blogService.rejectBlog(rejectingBlog.$id!, rejectionReason);
      showToast("Blog rejected", "success");
      await loadBlogs();
      setRejectModalOpen(false);
    } catch (error) {
      console.error("Error rejecting blog:", error);
      showToast("Failed to reject blog", "error");
    } finally {
      setProcessingBlog(null);
    }
  };

  const handleDelete = async (blogId: string) => {
    if (!confirm("Permanently delete this blog? This cannot be undone.")) return;

    try {
      await blogService.deleteBlog(blogId);
      showToast("Blog deleted successfully!", "success");
      await loadBlogs();
    } catch (error) {
      console.error("Error deleting blog:", error);
      showToast("Failed to delete blog", "error");
    }
  };

  const toggleFeatured = async (blog: Blog) => {
    try {
      await blogService.updateBlog(blog.$id!, { featured: !blog.featured });
      showToast(`Blog ${!blog.featured ? "featured" : "unfeatured"} successfully!`, "success");
      await loadBlogs();
    } catch (error) {
      console.error("Error toggling featured:", error);
      showToast("Failed to update blog", "error");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <AdminPageWrapper 
        title="Blog Management" 
        description="Loading..."
      >
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
            <p className="mt-4">Loading blogs...</p>
          </div>
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper 
      title="Blog Management" 
      description="Review and manage blog submissions"
    >
      {error && (
        <Card className="mb-6 border-l-4 border-danger">
          <CardBody className="gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-danger">Error</p>
                <p className="text-sm text-default-500">{error}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Tabs */}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
        size="md"
        className="mb-6 md:mb-8 overflow-x-auto"
      >
        <Tab
          key="pending"
          title={
            <div className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />
              <span>Pending ({blogs.filter((b) => b.status === "pending").length})</span>
            </div>
          }
        />
        <Tab
          key="approved"
          title={
            <div className="flex items-center gap-2">
              <CheckIcon className="w-4 h-4" />
              <span>Approved ({blogs.filter((b) => b.status === "approved").length})</span>
            </div>
          }
        />
        <Tab
          key="rejected"
          title={
            <div className="flex items-center gap-2">
              <XIcon className="w-4 h-4" />
              <span>Rejected ({blogs.filter((b) => b.status === "rejected").length})</span>
            </div>
          }
        />
        <Tab
          key="all"
          title={<span>All ({blogs.length})</span>}
        />
      </Tabs>

      {/* Blog List */}
      <div className="space-y-4 md:space-y-6">
        {filteredBlogs.length === 0 ? (
          <Card>
            <CardBody className="text-center py-8 md:py-12 px-4 md:px-6">
              <p className="text-sm md:text-lg text-default-600">
                No blogs in this category
              </p>
            </CardBody>
          </Card>
        ) : (
          filteredBlogs.map((blog) => (
            <Card key={blog.$id} className="border-2">
              <CardBody className="p-4 sm:p-5 md:p-6">
                <div className="grid md:grid-cols-12 gap-4 md:gap-6">
                  {/* Cover Image */}
                  <div className="md:col-span-3">
                    <img
                      src={blog.coverImage}
                      alt={blog.title}
                      className="w-full h-28 sm:h-32 object-cover rounded-lg"
                    />
                  </div>

                  {/* Content */}
                  <div className="md:col-span-6 space-y-2 md:space-y-3">
                    {/* Title & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                      <h3 className="font-bold text-base sm:text-lg md:text-xl flex-1">{blog.title}</h3>
                      <Chip
                        color={
                          blog.status === "approved"
                            ? "success"
                            : blog.status === "rejected"
                            ? "danger"
                            : "warning"
                        }
                        variant="flat"
                        size="sm"
                      >
                        {blog.status}
                      </Chip>
                    </div>

                    {/* Excerpt */}
                    <p className="text-xs sm:text-small text-default-600 line-clamp-2">
                      {blog.excerpt}
                    </p>

                    {/* Meta */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-small text-default-500">
                      <div className="flex items-center gap-2">
                        <Avatar
                          src={blog.authorAvatar}
                          name={blog.authorName}
                          size="sm"
                        />
                        <span className="truncate">{blog.authorName}</span>
                      </div>
                      <div className="hidden sm:block">•</div>
                      <div className="truncate">{blog.category}</div>
                      <div className="hidden sm:block">•</div>
                      <div className="whitespace-nowrap">{blog.readTime} min</div>
                      {blog.featured && (
                        <>
                          <div className="hidden sm:block">•</div>
                          <Chip size="sm" color="warning">
                            <StarIcon className="w-3 h-3" /> Featured
                          </Chip>
                        </>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 md:gap-2">
                      {blog.tags.map((tag, i) => (
                        <Chip key={i} size="sm" variant="flat">
                          #{tag}
                        </Chip>
                      ))}
                    </div>

                    {/* Rejection Reason */}
                    {blog.status === "rejected" && blog.rejectionReason && (
                      <div className="bg-danger/10 border border-danger/20 rounded-lg p-2 md:p-3">
                        <p className="text-xs font-semibold text-danger">
                          Rejection Reason:
                        </p>
                        <p className="text-xs text-default-600">
                          {blog.rejectionReason}
                        </p>
                      </div>
                    )}

                    {/* Dates */}
                    <div className="text-xs text-default-400">
                      Submitted: {blog.$createdAt && formatDate(blog.$createdAt)}
                      {blog.publishedAt && ` • Published: ${formatDate(blog.publishedAt)}`}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="md:col-span-3 flex flex-wrap md:flex-col gap-2">
                    <Button
                      as="a"
                      href={`/Blog/${blog.slug}`}
                      target="_blank"
                      size="sm"
                      variant="flat"
                      startContent={<EyeIcon className="w-4 h-4" />}
                      className="flex-1 md:flex-none"
                    >
                      View
                    </Button>

                    {blog.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          color="success"
                          variant="flat"
                          startContent={<CheckIcon className="w-4 h-4" />}
                          onPress={() => handleApprove(blog.$id!)}
                          isLoading={processingBlog === blog.$id}
                          className="flex-1 md:flex-none"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          variant="flat"
                          startContent={<XIcon className="w-4 h-4" />}
                          onPress={() => openRejectModal(blog)}
                          className="flex-1 md:flex-none"
                        >
                          Reject
                        </Button>
                      </>
                    )}

                    {blog.status === "approved" && (
                      <Button
                        size="sm"
                        color="warning"
                        variant="flat"
                        startContent={<StarIcon className="w-4 h-4" />}
                        onPress={() => toggleFeatured(blog)}
                        className="flex-1 md:flex-none"
                      >
                        {blog.featured ? "Unfeature" : "Feature"}
                      </Button>
                    )}

                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      startContent={<TrashIcon className="w-4 h-4" />}
                      onPress={() => handleDelete(blog.$id!)}
                      className="flex-1 md:flex-none"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </div>

      {/* Rejection Modal */}
      <Modal isOpen={rejectModalOpen} onClose={() => setRejectModalOpen(false)}>
        <ModalContent>
          <ModalHeader>Reject Blog</ModalHeader>
          <ModalBody>
            <p className="mb-4">
              Please provide a reason for rejecting this blog:
            </p>
            <Textarea
              placeholder="E.g., Content doesn't meet quality standards, inappropriate content, etc."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
            />
          </ModalBody>
          <ModalFooter>
            <Button variant="flat" onPress={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button
              color="danger"
              onPress={handleReject}
              isLoading={!!processingBlog}
            >
              Reject Blog
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg text-white flex items-center gap-2 z-50 ${
          toast.type === "success" ? "bg-success" : "bg-danger"
        }`}>
          {toast.type === "success" ? (
            <CheckIcon className="w-5 h-5" />
          ) : (
            <XIcon className="w-5 h-5" />
          )}
          {toast.message}
        </div>
      )}
    </AdminPageWrapper>
  );
}