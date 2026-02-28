// app/blog/[slug]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Card, CardBody } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { blogService, Blog } from "@/lib/blog";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";
import {
  ArrowLeftIcon,
  ClockIcon,
  EyeIcon,
  CalendarIcon,
  ShareIcon,
} from "lucide-react";

export default function BlogPostPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedBlogs, setRelatedBlogs] = useState<Blog[]>([]);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (slug) {
      loadBlog();
    }
  }, [slug]);

  const loadBlog = async () => {
    try {
      // Always use the public slug lookup — admin preview is done in admin panel
      const blogData = await blogService.getBlogBySlug(slug);
      setBlog(blogData);

      // Increment views (only for approved blogs)
      if (blogData && blogData.status === "approved") {
        blogService.incrementViews(blogData.$id!);
      }

      // Load related blogs
      if (blogData) {
        const related = await blogService.getBlogsByCategory(
          blogData.category,
          4
        );
        setRelatedBlogs(
          related.filter((b) => b.$id !== blogData.$id).slice(0, 3)
        );
      }
    } catch (error) {
      console.error("Error loading blog:", error);
      setToast({ message: "Blog not found", type: "error" });
      setTimeout(() => router.push("/blog"), 2000);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: blog?.title,
        text: blog?.excerpt,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setToast({ message: "Link copied to clipboard!", type: "success" });
      setTimeout(() => setToast(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4">Loading blog...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-xl font-semibold mb-4">Blog not found</p>
          <Button color="primary" onPress={() => router.push("/blog")}>
            Back to Blogs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 sm:pb-16 md:pb-20 lg:pb-24">
      {/* Back Button */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-5 md:py-6 lg:py-8">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="light"
            startContent={<ArrowLeftIcon className="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5" />}
            onPress={() => router.push("/blog")}
            size="lg"
            className="text-xs sm:text-small md:text-base"
          >
            Back to Blogs
          </Button>
        </div>
      </div>

      {/* Hero Section */}
      <div className="relative h-48 sm:h-64 md:h-80 lg:h-96 mb-6 sm:mb-8 md:mb-10 lg:mb-12 w-full overflow-hidden">
        <img
          src={blog.coverImage}
          alt={blog.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <Chip color="primary" variant="solid" className="mb-2 sm:mb-3 md:mb-4 text-[10px] sm:text-xs md:text-small">
                {blog.category}
              </Chip>
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-1.5 sm:mb-2 md:mb-3">
                {blog.title}
              </h1>
              <p className="text-xs sm:text-small md:text-base text-white/90 line-clamp-2">{blog.excerpt}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Container */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Meta Info */}
          <Card className="mb-6 sm:mb-7 md:mb-8 lg:mb-10">
            <CardBody className="p-3 sm:p-4 md:p-6 lg:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 md:gap-6">
                {/* Author */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <Avatar
                    src={blog.authorAvatar}
                    name={blog.authorName}
                    size="lg"
                    className="w-10 sm:w-12 h-10 sm:h-12"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-xs sm:text-small md:text-base truncate">{blog.authorName}</p>
                    <p className="text-[10px] sm:text-xs md:text-small text-default-500 truncate">
                      {blog.publishedAt && formatDate(blog.publishedAt)}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2 sm:gap-3 md:gap-4 lg:gap-6 text-[10px] sm:text-xs md:text-small text-default-600 flex-wrap">
                  <div className="flex items-center gap-1">
                    <ClockIcon className="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5 flex-shrink-0" />
                    <span className="whitespace-nowrap">{blog.readTime} min</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <EyeIcon className="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5 flex-shrink-0" />
                    <span className="whitespace-nowrap">{blog.views} views</span>
                  </div>
                  <Button
                    size="sm"
                    variant="flat"
                    isIconOnly
                    onPress={handleShare}
                    className="min-w-fit"
                  >
                    <ShareIcon className="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5" />
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Blog Content */}
          <Card className="mb-6 sm:mb-7 md:mb-8 lg:mb-10">
            <CardBody className="p-4 sm:p-6 md:p-8 lg:p-12">
              <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                <MarkdownRenderer content={blog.content} />
              </div>
            </CardBody>
          </Card>

          {/* Tags */}
          <Card className="mb-6 sm:mb-7 md:mb-8 lg:mb-10">
            <CardBody className="p-4 sm:p-6 md:p-8">
              <h3 className="font-semibold mb-2 sm:mb-3 md:mb-4 text-xs sm:text-small md:text-base">Tags</h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-3">
                {blog.tags.split(",").map((tag, index) => (
                  <Chip key={index} variant="flat" color="primary" size="sm" className="text-[10px] sm:text-xs md:text-small">
                    #{tag.trim()}
                  </Chip>
                ))}
              </div>
            </CardBody>
          </Card>

          {/* Related Blogs */}
          {relatedBlogs.length > 0 && (
            <div className="mt-8 sm:mt-10 md:mt-12 lg:mt-16">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-4 sm:mb-5 md:mb-6 lg:mb-8">Related Articles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                {relatedBlogs.map((relatedBlog) => (
                  <Card
                    key={relatedBlog.$id}
                    isPressable
                    onPress={() => router.push(`/blog/${relatedBlog.slug}`)}
                    className="hover:shadow-xl transition-all"
                  >
                    <CardBody className="p-0">
                      <img
                        src={relatedBlog.coverImage}
                        alt={relatedBlog.title}
                        className="w-full h-28 sm:h-32 md:h-40 object-cover"
                      />
                      <div className="p-3 sm:p-4 md:p-5">
                        <h3 className="font-bold text-xs sm:text-small md:text-base line-clamp-2 mb-1.5 sm:mb-2">
                          {relatedBlog.title}
                        </h3>
                        <p className="text-[10px] sm:text-xs md:text-small text-default-600 line-clamp-2">
                          {relatedBlog.excerpt}
                        </p>
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
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