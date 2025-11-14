// app/blog/write/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Spinner } from "@heroui/spinner";
import { blogService, blogCategories } from "@/lib/blog";
import { useAuth } from "@/context/AuthContext";
import { getErrorMessage } from "@/lib/errorHandler";
import { ArrowLeftIcon, SendIcon, ImageIcon } from "lucide-react";

export const dynamic = "force-dynamic";

export default function WriteBlogPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = useCallback((message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    coverImage: "",
    category: "",
    tags: "",
  });

  useEffect(() => {
    // Wait for auth to finish loading before checking
    if (!loading && !user) {
      showToast("Please login to write a blog", "error");
      setTimeout(() => router.push("/login"), 1500);
    }
  }, [user, loading, router, showToast]);

  useEffect(() => {
    // Check if blogs collection exists on mount
    const checkCollection = async () => {
      try {
        await blogService.checkBlogsCollection();
      } catch (error) {
        console.error("Collection check failed:", error);
      }
    };
    
    if (user) {
      checkCollection();
    }
  }, [user]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", "error");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be less than 5MB", "error");
      return;
    }

    setUploadingImage(true);
    try {
      const imageUrl = await blogService.uploadBlogImage(file);
      setFormData({ ...formData, coverImage: imageUrl });
      showToast("Image uploaded successfully!", "success");
    } catch (error) {
      console.error("Error uploading image:", error);
      showToast("Failed to upload image", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast("Please login to submit a blog", "error");
      return;
    }

    // Validation
    if (!formData.title || !formData.content || !formData.category) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    if (!formData.coverImage) {
      showToast("Please add a cover image", "error");
      return;
    }

    setSubmitting(true);

    try {
      // Build payload
      const slug = blogService.generateSlug(formData.title);
      const readTime = blogService.calculateReadTime(formData.content);
      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const payload = {
        title: formData.title,
        excerpt: formData.excerpt || formData.content.substring(0, 150),
        content: formData.content,
        coverImage: formData.coverImage,
        category: formData.category,
        tags,
        authorId: user.$id,
        authorName: user.name,
        authorEmail: user.email,
        authorAvatar: user.prefs?.avatar,
        slug,
        readTime,
      };

      // Use server API to create blog to avoid client-side Appwrite permission issues
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) {
        const errMsg = result?.error || "Failed to submit blog";
        throw new Error(errMsg);
      }

      showToast(result.message || "Blog submitted successfully! It will be reviewed by our team before publishing.", "success");
      setTimeout(() => router.push("/Blog"), 1500);
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("Error submitting blog:", message);
      showToast(message || "Failed to submit blog", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner label="Loading..." size="lg" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="border-none shadow-lg max-w-md">
          <CardBody className="p-8 text-center space-y-4">
            <h2 className="text-xl font-bold">Login Required</h2>
            <p className="text-default-600">
              You need to be logged in to write a blog.
            </p>
            <Button
              color="primary"
              size="lg"
              onPress={() => router.push("/login")}
            >
              Go to Login
            </Button>
            <Button
              variant="light"
              onPress={() => router.push("/Blog")}
            >
              Back to Blog
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <Button
          variant="light"
          startContent={<ArrowLeftIcon className="w-4 h-4" />}
          onPress={() => router.back()}
          className="mb-4"
          size="sm"
        >
          Back
        </Button>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Write a Blog</h1>
        <p className="text-sm md:text-base text-default-600">
          Share your knowledge and insights with the community
        </p>
      </div>

      {/* Form */}
      <Card className="border-none shadow-xl">
        <CardHeader className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-4 sm:px-6 md:px-8 py-4 md:py-6">
          <h2 className="text-lg md:text-2xl font-bold">Blog Details</h2>
        </CardHeader>
        <CardBody className="p-4 sm:p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6 lg:space-y-8">
            {/* Title */}
            <Input
              label="Blog Title"
              placeholder="Enter an engaging title..."
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              required
              isRequired
              size="lg"
              classNames={{
                input: "text-sm md:text-base",
                label: "text-xs md:text-small font-semibold"
              }}
            />

            {/* Excerpt */}
            <Textarea
              label="Excerpt (Optional)"
              placeholder="Brief summary of your blog..."
              value={formData.excerpt}
              onChange={(e) =>
                setFormData({ ...formData, excerpt: e.target.value })
              }
              rows={3}
              description="If not provided, first 150 characters will be used"
              size="lg"
              classNames={{
                input: "text-sm md:text-base",
                label: "text-xs md:text-small font-semibold"
              }}
            />

            {/* Category */}
            <Select
              label="Category"
              placeholder="Select a category"
              selectedKeys={formData.category ? [formData.category] : []}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              required
              isRequired
              size="lg"
              classNames={{
                label: "text-xs md:text-small font-semibold"
              }}
            >
              {blogCategories.map((cat) => (
                <SelectItem key={cat.value}>{cat.label}</SelectItem>
              ))}
            </Select>

            {/* Tags */}
            <Input
              label="Tags"
              placeholder="react, javascript, tutorial (comma separated)"
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
              description="Add relevant tags separated by commas"
              size="lg"
              classNames={{
                input: "text-sm md:text-base",
                label: "text-xs md:text-small font-semibold"
              }}
            />

            {/* Cover Image */}
            <div className="space-y-3 md:space-y-4 pt-2">
              <label className="text-xs md:text-small font-semibold">
                Cover Image <span className="text-danger">*</span>
              </label>

              <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* Upload Button */}
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="sr-only"
                    id="cover-image-upload"
                    title="Upload cover image"
                    aria-label="Upload cover image"
                    placeholder="Upload cover image"
                  />
                  <Button
                    as="label"
                    htmlFor="cover-image-upload"
                    variant="flat"
                    color="primary"
                    startContent={<ImageIcon className="w-4 md:w-5 h-4 md:h-5" />}
                    isLoading={uploadingImage}
                    className="w-full"
                    size="lg"
                  >
                    {uploadingImage ? "Uploading..." : "Upload Image"}
                  </Button>
                  <p className="text-xs text-default-500 mt-2">
                    Max 5MB (JPG, PNG, WebP)
                  </p>
                </div>

                {/* Or URL Input */}
                <Input
                  placeholder="Or paste image URL"
                  value={formData.coverImage}
                  onChange={(e) =>
                    setFormData({ ...formData, coverImage: e.target.value })
                  }
                  size="lg"
                  classNames={{
                    input: "text-sm md:text-base"
                  }}
                />
              </div>

              {/* Image Preview */}
              {formData.coverImage && (
                <div className="border-2 border-dashed border-default-300 rounded-lg p-3 md:p-4">
                  <p className="text-xs md:text-small font-medium mb-3">Preview:</p>
                  <img
                    src={formData.coverImage}
                    alt="Cover preview"
                    className="w-full h-40 sm:h-48 md:h-56 object-cover rounded-lg"
                    onError={() => {
                      alert("Invalid image URL");
                      setFormData({ ...formData, coverImage: "" });
                    }}
                  />
                </div>
              )}
            </div>

            {/* Content */}
            <Textarea
              label="Blog Content"
              placeholder="Write your blog content here... (Markdown supported)"
              value={formData.content}
              onChange={(e) =>
                setFormData({ ...formData, content: e.target.value })
              }
              required
              isRequired
              rows={15}
              description="Write in plain text or Markdown format"
              size="lg"
              classNames={{
                input: "text-sm md:text-base",
                label: "text-xs md:text-small font-semibold"
              }}
            />

            {/* Word Count */}
            <div className="text-xs md:text-small text-default-500 bg-default/40 px-3 md:px-4 py-2 md:py-3 rounded-lg">
              {formData.content.split(/\s+/).filter((w) => w).length} words •{" "}
              {blogService.calculateReadTime(formData.content)} min read
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2 md:pt-4">
              <Button
                variant="flat"
                onPress={() => router.back()}
                className="flex-1"
                size="lg"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                color="primary"
                isLoading={submitting}
                endContent={<SendIcon className="w-4 md:w-5 h-4 md:h-5" />}
                className="flex-1"
                size="lg"
              >
                Submit for Review
              </Button>
            </div>

            {/* Info */}
            <div className="bg-primary/10 rounded-lg p-3 md:p-4 border border-primary/20">
              <p className="text-xs md:text-small">
                <strong>Note:</strong> Your blog will be reviewed by our team
                before being published. You'll be notified once it's approved!
              </p>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg text-white flex items-center gap-2 z-50 shadow-lg ${
          toast.type === "success" ? "bg-success" : "bg-danger"
        }`}>
          {toast.type === "success" ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}