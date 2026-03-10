"use client";

import { Card, CardBody, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { Chip } from "@heroui/chip";
import { Avatar } from "@heroui/avatar";
import { Progress } from "@heroui/progress";
import { title, subtitle } from "@/components/Primitives";
import { useState, useEffect } from "react";
import { projectService, Project } from "@/lib/database";
import {
  CodeIcon,
  UsersIcon,
  StarIcon,
  HeartIcon,
  ShareIcon,
  EyeIcon,
  GitBranchIcon,
  CalendarIcon,
  RocketIcon,
  SparklesIcon,
  ZapIcon,
  Loader2Icon
} from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedProjects, setSavedProjects] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch projects from Appwrite
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const data = await projectService.getAllProjects();
        setProjects(data);
      } catch (error) {
        console.error("Error fetching projects:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const categories = [
    { key: "all", label: "All Projects", count: projects.length },
    { key: "ai-ml", label: "AI & ML", count: projects.filter(p => p.category === "ai-ml").length },
    { key: "blockchain", label: "Blockchain", count: projects.filter(p => p.category === "blockchain").length },
    { key: "mobile", label: "Mobile", count: projects.filter(p => p.category === "mobile").length },
    { key: "web", label: "Web", count: projects.filter(p => p.category === "web").length },
    { key: "iot", label: "IoT", count: projects.filter(p => p.category === "iot").length },
    { key: "quantum", label: "Quantum", count: projects.filter(p => p.category === "quantum").length },
  ];

  const filteredProjects = selectedCategory === "all" 
    ? projects 
    : projects.filter(project => project.category === selectedCategory);

  const toggleSaveProject = (projectId: string) => {
    setSavedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "success";
      case "in-progress": return "primary";
      case "planning": return "warning";
      default: return "default";
    }
  };

  // Generate avatar URLs for team members
  const getAvatarUrl = (name: string, index: number) => {
    return `https://i.pravatar.cc/300?img=${(index + 12) * 3}`;
  };

  return (
    <div className="space-y-6 sm:space-y-8 md:space-y-10 lg:space-y-12 pb-10 sm:pb-12 md:pb-16 lg:pb-20 px-3 sm:px-4 md:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 relative py-6 sm:py-8 md:py-10 lg:py-12">
        <div className="absolute top-0 left-1/4 w-64 sm:w-80 md:w-96 h-64 sm:h-80 md:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-8 sm:top-12 md:top-16 lg:top-20 right-1/4 w-64 sm:w-80 md:w-96 h-64 sm:h-80 md:h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 mb-2 sm:mb-3 md:mb-4 lg:mb-6">
          <RocketIcon className="w-3 sm:w-3.5 md:w-4 lg:w-5 h-3 sm:h-3.5 md:h-4 lg:h-5 text-purple-500" />
          <span className="text-xs sm:text-xs md:text-sm font-semibold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Innovative Projects
          </span>
        </div>
        <div className="relative z-10">
          <h1 className={title({ size: "lg" })}>
            Explore{" "}
            <span className={title({ color: "violet", size: "lg" })}>
              Amazing Projects
            </span>
          </h1>
          <p className={subtitle({ class: "mt-3 sm:mt-4 md:mt-5 lg:mt-6 max-w-3xl mx-auto text-xs sm:text-sm md:text-base lg:text-lg" })}>
            Discover cutting-edge projects built by our community. From AI to blockchain, explore the future of technology.
          </p>
        </div>
      </div>

      {/* Category Filters */}
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-3 justify-center">
          {categories.map((category) => (
            <Chip
              key={category.key}
              variant={selectedCategory === category.key ? "solid" : "flat"}
              color={selectedCategory === category.key ? "secondary" : "default"}
              size="sm"
              className={`cursor-pointer transition-all text-xs md:text-small ${
                selectedCategory === category.key 
                  ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg" 
                  : "hover:shadow-md"
              }`}
              onClick={() => setSelectedCategory(category.key)}
            >
              {category.label}
              <span className="ml-1 opacity-80">({category.count})</span>
            </Chip>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20">
          <Loader2Icon className="w-10 sm:w-12 md:w-14 h-10 sm:h-12 md:h-14 animate-spin text-purple-600" />
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm md:text-base text-default-600">Loading amazing projects...</p>
        </div>
      ) : (
        <>
          {/* Projects Grid */}
          <div className="w-full">
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                {filteredProjects.map((project) => (
                  <Card
                    key={project.$id}
                    className="border-none hover:shadow-2xl transition-all duration-300 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl group cursor-pointer"
                    shadow="lg"
                    isPressable
                  >
                    <CardBody className="p-0 overflow-hidden">
                      {/* Project Image */}
                      <div className="relative">
                        <img
                          src={project.image}
                          alt={project.title}
                          className="w-full h-36 sm:h-40 md:h-44 lg:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        
                        {/* Overlay Badges */}
                        <div className="absolute top-2 sm:top-2.5 md:top-3 lg:top-4 left-2 sm:left-2.5 md:left-3 lg:left-4 flex flex-col gap-1.5 sm:gap-2">
                          {project.isFeatured && (
                            <Badge 
                              color="warning" 
                              variant="solid"
                              className="font-bold text-xs"
                            >
                              <StarIcon className="w-2.5 sm:w-3 md:w-3.5 h-2.5 sm:h-3 md:h-3.5 mr-0.5" />
                              Featured
                            </Badge>
                          )}
                        </div>

                        {/* Save Button */}
                        <Button
                          isIconOnly
                          variant="flat"
                          className="absolute top-2 sm:top-2.5 md:top-3 lg:top-4 right-2 sm:right-2.5 md:right-3 lg:right-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm"
                          size="sm"
                          onPress={() => toggleSaveProject(project.$id!)}
                        >
                          <HeartIcon 
                            className={`w-3 sm:w-3.5 md:w-4 lg:w-5 h-3 sm:h-3.5 md:h-4 lg:h-5 ${
                              savedProjects.includes(project.$id!) 
                                ? "text-red-500 fill-red-500" 
                                : "text-default-600"
                            }`} 
                          />
                        </Button>

                        {/* Status Badge */}
                        <div className="absolute bottom-2 sm:bottom-2.5 md:bottom-3 lg:bottom-4 right-2 sm:right-2.5 md:right-3 lg:right-4">
                          <Chip
                            color={getStatusColor(project.status || "planning") as any}
                            variant="solid"
                            size="sm"
                            className="text-xs"
                          >
                            {(project.status || "planning").replace("-", " ")}
                          </Chip>
                        </div>
                      </div>

                    {/* Project Content */}
                    <div className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-2 sm:space-y-2.5 md:space-y-3 lg:space-y-4">
                      {/* Header */}
                      <div className="space-y-1.5 sm:space-y-2">
                        <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold line-clamp-2 group-hover:text-purple-600 transition-colors">
                          {project.title}
                        </h3>
                        
                        <p className="text-default-600 text-xs sm:text-xs md:text-sm line-clamp-2">
                          {project.description}
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1 sm:space-y-1.5">
                        <div className="flex justify-between text-xs sm:text-xs md:text-sm">
                          <span className="text-default-600">Progress</span>
                          <span className="font-semibold">{project.progress}%</span>
                        </div>
                        <Progress 
                          value={project.progress} 
                          color="secondary"
                          size="sm"
                        />
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                        <div className="space-y-0.5 sm:space-y-1">
                          <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                            <StarIcon className="w-3 sm:w-3.5 md:w-4 h-3 sm:h-3.5 md:h-4 text-yellow-500" />
                            <span className="font-bold text-xs sm:text-sm">{project.stars}</span>
                          </div>
                          <p className="text-xs text-default-500">Stars</p>
                        </div>
                        <div className="space-y-0.5 sm:space-y-1">
                          <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                            <GitBranchIcon className="w-3 sm:w-3.5 md:w-4 h-3 sm:h-3.5 md:h-4 text-blue-500" />
                            <span className="font-bold text-xs sm:text-sm">{project.forks}</span>
                          </div>
                          <p className="text-xs text-default-500">Forks</p>
                        </div>
                        <div className="space-y-0.5 sm:space-y-1">
                          <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                            <UsersIcon className="w-4 h-4 text-green-500" />
                            <span className="font-bold text-sm">{project.contributors}</span>
                          </div>
                          <p className="text-xs text-default-500">Team</p>
                        </div>
                      </div>

                      {/* Technologies */}
                      <div className="flex flex-wrap gap-1">
                        {project.technologies.slice(0, 3).map((tech, index) => (
                          <Chip
                            key={index}
                            size="sm"
                            variant="flat"
                            className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-xs"
                          >
                            {tech}
                          </Chip>
                        ))}
                        {project.technologies.length > 3 && (
                          <Chip
                            size="sm"
                            variant="flat"
                            className="text-xs"
                          >
                            +{project.technologies.length - 3}
                          </Chip>
                        )}
                      </div>

                      {/* Team and Duration */}
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {project.teamMembers?.slice(0, 3).map((member, index) => (
                            <Avatar
                              key={index}
                              src={getAvatarUrl(member, index)}
                              size="sm"
                              className="border-2 border-white dark:border-gray-900"
                            />
                          ))}
                          {project.teamMembers && project.teamMembers.length > 3 && (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-gray-900">
                              +{project.teamMembers.length - 3}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-default-500">
                          <CalendarIcon className="w-4 h-4" />
                          <span>{project.duration}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer with Actions */}
                    <CardFooter className="px-6 pb-6 pt-0">
                      <div className="flex gap-2 w-full">
                        <Button
                          isIconOnly
                          variant="light"
                          size="sm"
                        >
                          <ShareIcon className="w-4 h-4" />
                        </Button>
                        
                        {project.demoUrl && (
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            as="a"
                            href={project.demoUrl}
                            target="_blank"
                          >
                            <EyeIcon className="w-4 h-4" />
                          </Button>
                        )}

                        <Button
                          color="primary"
                          className="flex-1 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-semibold"
                          startContent={<CodeIcon className="w-4 h-4" />}
                          as="a"
                          href={project.repoUrl}
                          target="_blank"
                        >
                          View Code
                        </Button>
                      </div>
                    </CardFooter>
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* Empty State */}
            {filteredProjects.length === 0 && (
              <Card className="border-none bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
                <CardBody className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 flex items-center justify-center">
                    <CodeIcon className="w-12 h-12 text-purple-500" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">No projects found</h3>
                  <p className="text-default-600 max-w-md mx-auto">
                    No projects match your selected category. Try choosing a different category or check back later for new projects.
                  </p>
                </CardBody>
              </Card>
            )}
            </div>
          </div>

        </>
      )}
    </div>
  );
}