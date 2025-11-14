// app/Blog/edit/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
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

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id as string;
  const { user, loading: authLoading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    if (!authLoading && !user) {
      showToast("Please login to edit blogs", "error");
      setTimeout(() => router.push("/login"), 1500);
    }
  }, [user, authLoading, router, showToast]);

  useEffect(() => {
    if (user && blogId) {
      loadBlog();
    }
  }, [user, blogId]);

  const loadBlog = async () => {
    try {
      setLoading(true);
      const blog = await blogService.getBlogById(blogId);

      // Verify user owns this blog
      if (blog.authorId !== user?.$id) {
        setError("You can only edit your own blogs");
        setTimeout(() => router.push("/Blog"), 2000);
        return;
      }

      setFormData({
        title: blog.title,
        excerpt: blog.excerpt,
        content: blog.content,
        coverImage: blog.coverImage,
        category: blog.category,
        tags: blog.tags.join(", "),
      });
    } catch (err) {
      const msg = getErrorMessage(err);
      setError(`Failed to load blog: ${msg}`);
      console.error("Error loading blog:", msg);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast("Please select an image file", "error");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast("Image size must be less than 5MB", "error");
      return;
    }

    setUploadingImage(true);
    try {
      const imageUrl = await blogService.uploadBlogImage(file);
      setFormData({ ...formData, coverImage: imageUrl });
      showToast("Image uploaded successfully!", "success");
    } catch (err) {
      console.error("Error uploading image:", err);
      showToast("Failed to upload image", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      showToast("Please login to update a blog", "error");
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
      const readTime = blogService.calculateReadTime(formData.content);
      const tags = formData.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      const updateData = {
        title: formData.title,
        excerpt: formData.excerpt || formData.content.substring(0, 150),
        content: formData.content,
        coverImage: formData.coverImage,
        category: formData.category,
        tags,
        readTime,
      };

      await blogService.updateBlog(blogId, updateData);
      showToast("Blog updated successfully!", "success");
      setTimeout(() => router.push(`/Blog/${blogService.generateSlug(formData.title)}`), 1500);
    } catch (err) {
      const message = getErrorMessage(err);
      console.error("Error updating blog:", message);
      showToast(message || "Failed to update blog", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner label="Loading..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="border-none shadow-lg max-w-md">
          <CardBody className="p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-danger">{error}</h2>
          </CardBody>
        </Card>
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
              You need to be logged in to edit a blog.
            </p>
            <Button
              color="primary"
              onPress={() => router.push("/login")}
            >
              Login
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-default-50 to-default-100 py-8 px-4 sm:px-6 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 md:mb-8 flex items-center gap-4">
          <Button
            isIconOnly
            variant="light"
            onPress={() => router.back()}
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Edit Blog</h1>
            <p className="text-default-500 text-sm">Update your blog post</p>
          </div>
        </div>

        <Card className="border-none shadow-lg">
          <CardBody className="p-6 md:p-8 space-y-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cover Image */}
              <div className="space-y-3">
                <label className="text-sm font-semibold">Cover Image *</label>
                <div className="border-2 border-dashed border-default-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                    id="cover-image"
                  />
                  <label htmlFor="cover-image" className="cursor-pointer flex flex-col items-center gap-2">
                    <ImageIcon className="w-8 h-8 text-default-400" />
                    <p className="text-sm font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-default-500">PNG, JPG, GIF up to 5MB</p>
                  </label>
                </div>
                {formData.coverImage && (
                  <img
                    src={formData.coverImage}
                    alt="Cover"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                )}
              </div>

              {/* Title */}
              <Input
                label="Blog Title *"
                placeholder="Enter your blog title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />

              {/* Category */}
              <Select
                label="Category *"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              >
                {blogCategories.map((cat) => (
                  <SelectItem key={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </Select>

              {/* Excerpt */}
              <Textarea
                label="Excerpt"
                placeholder="Brief summary of your blog (optional)"
                value={formData.excerpt}
                onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                rows={3}
              />

              {/* Content */}
              <Textarea
                label="Blog Content *"
                placeholder="Write your blog content here..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                required
              />

              {/* Tags */}
              <Input
                label="Tags"
                placeholder="Separate tags with commas (e.g., javascript, react, web)"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              />

              {/* Read Time */}
              <div className="bg-default-100 p-4 rounded-lg">
                <p className="text-sm text-default-600">
                  Estimated read time: <span className="font-semibold">{blogService.calculateReadTime(formData.content)} min</span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button
                  variant="flat"
                  onPress={() => router.back()}
                >
                  Cancel
                </Button>
                <Button
                  color="primary"
                  type="submit"
                  isLoading={submitting}
                  startContent={!submitting && <SendIcon className="w-4 h-4" />}
                >
                  Update Blog
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg text-white flex items-center gap-2 z-50 ${
          toast.type === "success" ? "bg-success" : "bg-danger"
        }`}>
          {toast.type === "success" ? (
            <span>✓</span>
          ) : (
            <span>✕</span>
          )}
          {toast.message}
        </div>
      )}
    </div>
  );
}
