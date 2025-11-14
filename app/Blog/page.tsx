// app/Blog/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { Spinner } from "@heroui/spinner";
import { title, subtitle } from "@/components/primitives";
import { blogService, Blog, blogCategories } from "@/lib/blog";
import { useAuth } from "@/context/AuthContext";
import { 
  SearchIcon, 
  PenIcon, 
  ClockIcon, 
  EyeIcon, 
  HeartIcon,
  SparklesIcon,
  CalendarIcon
} from "lucide-react";

export default function BlogPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    loadBlogs();
  }, []);

  useEffect(() => {
    filterBlogs();
  }, [searchQuery, selectedCategory, blogs]);

  const loadBlogs = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use API instead of direct service call
      const response = await fetch("/api/blog");
      
      if (!response.ok) {
        throw new Error("Failed to fetch blogs");
      }
      
      const result = await response.json();
      setBlogs(result.data || []);
      setFilteredBlogs(result.data || []);
    } catch (err) {
      console.error("Error loading blogs:", err);
      setError("Failed to load blogs. Please try again later.");
      // Fallback to direct service call if API fails
      try {
        const publishedBlogs = await blogService.getPublishedBlogs();
        setBlogs(publishedBlogs);
        setFilteredBlogs(publishedBlogs);
        setError(null);
      } catch (error) {
        console.error("Fallback error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const filterBlogs = () => {
    let filtered = blogs;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((blog) => blog.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (blog) =>
          blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          blog.tags.some((tag) =>
            tag.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    setFilteredBlogs(filtered);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen px-3 sm:px-4 md:px-6">
        <Spinner label="Loading blogs..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen px-3 sm:px-4 md:px-6">
        <Card className="border-none bg-red-50 dark:bg-red-950/30 w-full max-w-md">
          <CardBody className="p-4 sm:p-6 md:p-8 text-center space-y-3 sm:space-y-4">
            <p className="text-sm sm:text-base md:text-lg text-red-600 dark:text-red-400">{error}</p>
            <Button
              color="primary"
              onPress={() => loadBlogs()}
              className="text-xs sm:text-sm md:text-base"
            >
              Try Again
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 pb-10 sm:pb-12 md:pb-16 lg:pb-20 px-3 sm:px-4 md:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 relative py-6 sm:py-8 md:py-10 lg:py-12">
        <div className="absolute top-0 left-1/4 w-64 sm:w-80 md:w-96 h-64 sm:h-80 md:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-8 sm:top-12 md:top-16 lg:top-20 right-1/4 w-64 sm:w-80 md:w-96 h-64 sm:h-80 md:h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />

        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-2 sm:mb-3 md:mb-4 lg:mb-6">
          <SparklesIcon className="w-3 sm:w-3.5 md:w-4 lg:w-5 h-3 sm:h-3.5 md:h-4 lg:h-5 text-purple-500" />
          <span className="text-xs sm:text-xs md:text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Latest Articles
          </span>
        </div>

        <div className="relative z-10">
          <h1 className={title({ size: "lg" })}>
            Our{" "}
            <span className={title({ color: "violet", size: "lg" })}>
              Blog
            </span>
          </h1>
          <p className={subtitle({ class: "mt-3 sm:mt-4 md:mt-5 lg:mt-6 max-w-3xl mx-auto text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl" })}>
            Insights, tutorials, and stories from our community
          </p>
        </div>

        {/* Write Blog Button */}
        {user && (
          <Button
            color="primary"
            size="lg"
            startContent={<PenIcon className="w-3 sm:w-3.5 md:w-4 lg:w-5 h-3 sm:h-3.5 md:h-4 lg:h-5" />}
            onPress={() => router.push("/Blog/write")}
            className="mt-2 sm:mt-3 md:mt-4 lg:mt-5 text-xs sm:text-sm md:text-base"
          >
            Write a Blog
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="w-full max-w-7xl mx-auto">
        <Card className="border-none shadow-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
          <CardBody className="p-3 sm:p-4 md:p-5 lg:p-6">
            <div className="flex flex-col gap-2 sm:gap-2.5 md:gap-3 lg:gap-4">
              <Input
                placeholder="Search blogs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startContent={<SearchIcon className="w-3 sm:w-3.5 md:w-4 lg:w-4.5 h-3 sm:h-3.5 md:h-4 lg:h-4.5" />}
                className="w-full"
                size="lg"
                classNames={{
                  input: "text-xs sm:text-sm md:text-base",
                }}
              />
              <Select
                label="Category"
                selectedKeys={[selectedCategory]}
                onChange={(e) => setSelectedCategory(e.target.value)}
                size="lg"
                classNames={{
                  label: "text-xs sm:text-sm",
                  value: "text-xs sm:text-sm md:text-base",
                }}
              >
                <SelectItem key="all">All Categories</SelectItem>
                {blogCategories.map((cat) => (
                  <SelectItem key={cat.value}>{cat.label}</SelectItem>
                )) as any}
              </Select>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Blog Grid */}
      <div className="w-full">
        <div className="max-w-7xl mx-auto">
          {filteredBlogs.length === 0 ? (
            <div className="text-center py-8 sm:py-10 md:py-12 lg:py-16">
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-3 sm:mb-4 md:mb-5">📝</div>
              <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold mb-2 sm:mb-3">No blogs found</h3>
              <p className="text-xs sm:text-sm md:text-base text-default-500 mb-4 sm:mb-5 md:mb-6">
                {user
                  ? "Be the first to write a blog!"
                  : "Check back later for new content"}
              </p>
              {user && (
                <Button
                  color="primary"
                  startContent={<PenIcon className="w-3 sm:w-3.5 md:w-4 h-3 sm:h-3.5 md:h-4" />}
                  onPress={() => router.push("/Blog/write")}
                  size="lg"
                  className="text-xs sm:text-sm md:text-base"
                >
                  Write a Blog
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
              {filteredBlogs.map((blog) => (
                <Card
                  key={blog.$id}
                  className="border-none hover:shadow-2xl transition-all duration-300 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl group cursor-pointer"
                  shadow="lg"
                  isPressable
                  onPress={() => router.push(`/Blog/${blog.slug}`)}
                >
                  <CardBody className="p-0">
                    {/* Cover Image */}
                    <div className="relative h-36 sm:h-40 md:h-44 lg:h-48 overflow-hidden">
                      <img
                        src={blog.coverImage}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {blog.featured && (
                        <Chip
                          color="warning"
                          size="sm"
                          className="absolute top-2 sm:top-2.5 md:top-3 left-2 sm:left-2.5 md:left-3 text-xs"
                        >
                          Featured
                        </Chip>
                      )}
                      <Chip
                        size="sm"
                        variant="flat"
                        className="absolute top-2 sm:top-2.5 md:top-3 right-2 sm:right-2.5 md:right-3 bg-black/50 text-white text-xs"
                      >
                        {blog.category.replace("-", " ")}
                      </Chip>
                    </div>

                    {/* Content */}
                    <div className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-2 sm:space-y-2.5 md:space-y-3 lg:space-y-4">
                      <h3 className="font-bold text-sm sm:text-base md:text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {blog.title}
                      </h3>

                      <p className="text-xs sm:text-xs md:text-sm text-default-600 line-clamp-3">
                        {blog.excerpt}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 md:gap-1.5">
                        {blog.tags.slice(0, 2).map((tag, index) => (
                          <Chip key={index} size="sm" variant="flat" className="text-xs">
                            #{tag}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  </CardBody>

                  <CardFooter className="px-3 sm:px-4 md:px-5 lg:px-6 pb-3 sm:pb-4 md:pb-5 lg:pb-6 pt-0 flex flex-col gap-2 sm:flex-row justify-between gap-2 sm:gap-3 lg:gap-4">
                    {/* Author */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar
                        src={blog.authorAvatar}
                        name={blog.authorName}
                        size="sm"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-xs md:text-sm font-medium truncate">
                          {blog.authorName}
                        </span>
                        <span className="text-xs text-default-500">
                          {blog.publishedAt && formatDate(blog.publishedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Meta & Actions */}
                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3 text-xs text-default-500 whitespace-nowrap">
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <ClockIcon className="w-2.5 sm:w-3 md:w-3.5 lg:w-4 h-2.5 sm:h-3 md:h-3.5 lg:h-4" />
                        <span className="text-xs">{blog.readTime} min</span>
                      </div>
                      <div className="flex items-center gap-0.5 sm:gap-1">
                        <EyeIcon className="w-2.5 sm:w-3 md:w-3.5 lg:w-4 h-2.5 sm:h-3 md:h-3.5 lg:h-4" />
                        <span className="text-xs">{blog.views}</span>
                      </div>
                      {user && blog.authorId === user.$id && (
                        <Button
                          isIconOnly
                          size="sm"
                          variant="light"
                          onPress={() => {
                            router.push(`/Blog/edit/${blog.$id}`);
                          }}
                          className="text-xs"
                        >
                          ✎
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

