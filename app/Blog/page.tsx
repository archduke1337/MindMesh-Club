// app/blog/page.tsx
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
      <div className="flex items-center justify-center min-h-screen">
        <Spinner label="Loading blogs..." size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="border-none bg-red-50 dark:bg-red-950/30">
          <CardBody className="p-8 text-center">
            <p className="text-lg text-red-600 dark:text-red-400">{error}</p>
            <Button
              className="mt-4"
              color="primary"
              onPress={() => loadBlogs()}
            >
              Try Again
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 md:space-y-12 pb-12 md:pb-20 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 md:space-y-6 relative py-8 md:py-12">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />

        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-4 md:mb-6">
          <SparklesIcon className="w-4 sm:w-5 h-4 sm:h-5 text-purple-500" />
          <span className="text-xs sm:text-small font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
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
          <p className={subtitle({ class: "mt-4 md:mt-6 max-w-3xl mx-auto text-base md:text-xl" })}>
            Insights, tutorials, and stories from our community
          </p>
        </div>

        {/* Write Blog Button */}
        {user && (
          <Button
            color="primary"
            size="lg"
            startContent={<PenIcon className="w-4 sm:w-5 h-4 sm:h-5" />}
            onPress={() => router.push("/blog/write")}
            className="mt-3 md:mt-4"
          >
            Write a Blog
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Card className="border-none shadow-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
            <CardBody className="p-4 sm:p-6">
              <div className="flex flex-col gap-3 md:gap-4">
                <Input
                  placeholder="Search blogs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  startContent={<SearchIcon className="w-4 h-4" />}
                  className="w-full"
                  size="lg"
                />
                <Select
                  label="Category"
                  selectedKeys={[selectedCategory]}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  size="lg"
                >
                  <SelectItem key="all">All Categories</SelectItem>
                  <SelectItem key="tutorial">Tutorial</SelectItem>
                  <SelectItem key="news">News</SelectItem>
                  <SelectItem key="event">Event</SelectItem>
                  <SelectItem key="project">Project</SelectItem>
                  <SelectItem key="technology">Technology</SelectItem>
                </Select>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {filteredBlogs.length === 0 ? (
            <div className="text-center py-8 md:py-12">
              <div className="text-4xl md:text-6xl mb-4">📝</div>
              <h3 className="text-lg md:text-xl font-semibold mb-2">No blogs found</h3>
              <p className="text-sm md:text-base text-default-500 mb-6">
                {user
                  ? "Be the first to write a blog!"
                  : "Check back later for new content"}
              </p>
              {user && (
                <Button
                  color="primary"
                  startContent={<PenIcon className="w-4 h-4" />}
                  onPress={() => router.push("/blog/write")}
                  size="lg"
                >
                  Write a Blog
                </Button>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
              {filteredBlogs.map((blog) => (
                <Card
                  key={blog.$id}
                  className="border-none hover:shadow-2xl transition-all duration-300 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl group cursor-pointer"
                  shadow="lg"
                  isPressable
                  onPress={() => router.push(`/blog/${blog.slug}`)}
                >
                  <CardBody className="p-0">
                    {/* Cover Image */}
                    <div className="relative h-40 sm:h-44 md:h-48 overflow-hidden">
                      <img
                        src={blog.coverImage}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {blog.featured && (
                        <Chip
                          color="warning"
                          size="sm"
                          className="absolute top-3 left-3"
                        >
                          Featured
                        </Chip>
                      )}
                      <Chip
                        size="sm"
                        variant="flat"
                        className="absolute top-3 right-3 bg-black/50 text-white"
                      >
                        {blog.category.replace("-", " ")}
                      </Chip>
                    </div>

                    {/* Content */}
                    <div className="p-4 md:p-6 space-y-3 md:space-y-4">
                      <h3 className="font-bold text-base sm:text-lg line-clamp-2 group-hover:text-primary transition-colors">
                        {blog.title}
                      </h3>

                      <p className="text-xs sm:text-small text-default-600 line-clamp-3">
                        {blog.excerpt}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 md:gap-2">
                        {blog.tags.slice(0, 3).map((tag, index) => (
                          <Chip key={index} size="sm" variant="flat">
                            #{tag}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  </CardBody>

                  <CardFooter className="px-4 md:px-6 pb-4 md:pb-6 pt-0 flex-col sm:flex-row justify-between gap-3">
                    {/* Author */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Avatar
                        src={blog.authorAvatar}
                        name={blog.authorName}
                        size="sm"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs sm:text-small font-medium truncate">
                          {blog.authorName}
                        </span>
                        <span className="text-xs text-default-500">
                          {blog.publishedAt && formatDate(blog.publishedAt)}
                        </span>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-2 md:gap-3 text-xs md:text-small text-default-500">
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <ClockIcon className="w-3 h-3 md:w-4 md:h-4" />
                        <span>{blog.readTime} min</span>
                      </div>
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <EyeIcon className="w-3 h-3 md:w-4 md:h-4" />
                        <span>{blog.views}</span>
                      </div>
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

