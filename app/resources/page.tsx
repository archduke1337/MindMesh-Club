"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Tabs, Tab } from "@heroui/tabs";
import {
  BookOpenIcon,
  FileTextIcon,
  LinkIcon,
  SearchIcon,
  DownloadIcon,
  MapIcon,
  FolderOpenIcon,
  ExternalLinkIcon,
} from "lucide-react";

interface Resource {
  $id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  url: string | null;
  fileId: string | null;
  tags: string[];
  author: string;
  difficulty: string;
  eventId: string | null;
  isPublished: boolean;
  $createdAt: string;
}

interface Roadmap {
  $id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  fileId: string | null;
  url: string | null;
  thumbnail: string | null;
  author: string;
  estimatedDuration: string | null;
  isPublished: boolean;
  $createdAt: string;
}

const CATEGORY_COLORS: Record<string, "primary" | "secondary" | "success" | "warning" | "danger"> = {
  frontend: "primary",
  backend: "secondary",
  devops: "success",
  mobile: "warning",
  "data-science": "danger",
  ai: "danger",
  cybersecurity: "warning",
  design: "secondary",
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Fetch resources
      const resRes = await fetch("/api/resources");
      if (resRes.ok) {
        const data = await resRes.json();
        setResources(data.resources || []);
      }

      const roadRes = await fetch("/api/resources/roadmaps");
      if (roadRes.ok) {
        const data = await roadRes.json();
        setRoadmaps(data.roadmaps || []);
      }
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  };

  const filteredResources = resources.filter(
    (r) =>
      r.isPublished &&
      (!search ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.category.toLowerCase().includes(search.toLowerCase()) ||
        r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())))
  );

  const filteredRoadmaps = roadmaps.filter(
    (r) =>
      r.isPublished &&
      (!search ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.category.toLowerCase().includes(search.toLowerCase()))
  );

  const getDifficultyColor = (d: string) => {
    switch (d) {
      case "beginner": return "success";
      case "intermediate": return "warning";
      case "advanced": return "danger";
      default: return "default";
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">
          <BookOpenIcon className="w-8 h-8 inline mr-3 text-primary" />
          Resources & Roadmaps
        </h1>
        <p className="text-default-500 max-w-lg mx-auto">
          Curated learning resources, tutorials, and career roadmaps to help you
          grow as a developer.
        </p>
      </div>

      {/* Search */}
      <div className="max-w-md mx-auto mb-8">
        <Input
          placeholder="Search resources..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          startContent={<SearchIcon className="w-4 h-4 text-default-400" />}
          variant="bordered"
          size="lg"
        />
      </div>

      <Tabs aria-label="Resource tabs" className="mb-6" fullWidth>
        {/* ── RESOURCES TAB ── */}
        <Tab
          key="resources"
          title={
            <div className="flex items-center gap-2">
              <FolderOpenIcon className="w-4 h-4" />
              Resources ({filteredResources.length})
            </div>
          }
        >
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
            </div>
          ) : filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
              {filteredResources.map((res) => (
                <Card key={res.$id} className="border-none shadow-md hover:shadow-lg transition-shadow">
                  <CardBody className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {res.type === "pdf" ? (
                          <FileTextIcon className="w-5 h-5 text-primary" />
                        ) : res.type === "link" ? (
                          <LinkIcon className="w-5 h-5 text-primary" />
                        ) : (
                          <FolderOpenIcon className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm line-clamp-2">{res.title}</h3>
                        <p className="text-xs text-default-400">by {res.author}</p>
                      </div>
                    </div>
                    <p className="text-sm text-default-600 line-clamp-2 mb-3">
                      {res.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      <Chip
                        size="sm"
                        color={CATEGORY_COLORS[res.category] || "default"}
                        variant="flat"
                        className="text-xs"
                      >
                        {res.category}
                      </Chip>
                      <Chip
                        size="sm"
                        color={getDifficultyColor(res.difficulty) as any}
                        variant="flat"
                        className="text-xs"
                      >
                        {res.difficulty}
                      </Chip>
                    </div>
                    {res.url && (
                      <Button
                        as="a"
                        href={res.url}
                        target="_blank"
                        size="sm"
                        color="primary"
                        variant="flat"
                        className="w-full"
                        endContent={<ExternalLinkIcon className="w-3.5 h-3.5" />}
                      >
                        View Resource
                      </Button>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <FolderOpenIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Resources Yet</h3>
              <p className="text-default-500">
                Resources will be added by the team soon. Stay tuned!
              </p>
            </div>
          )}
        </Tab>

        {/* ── ROADMAPS TAB ── */}
        <Tab
          key="roadmaps"
          title={
            <div className="flex items-center gap-2">
              <MapIcon className="w-4 h-4" />
              Roadmaps ({filteredRoadmaps.length})
            </div>
          }
        >
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto" />
            </div>
          ) : filteredRoadmaps.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
              {filteredRoadmaps.map((roadmap) => (
                <Card key={roadmap.$id} className="border-none shadow-md hover:shadow-lg transition-shadow">
                  <CardBody className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                        <MapIcon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-1">{roadmap.title}</h3>
                        <p className="text-sm text-default-600 mb-3 line-clamp-2">
                          {roadmap.description}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          <Chip
                            size="sm"
                            color={CATEGORY_COLORS[roadmap.category] || "default"}
                            variant="flat"
                          >
                            {roadmap.category}
                          </Chip>
                          <Chip
                            size="sm"
                            color={getDifficultyColor(roadmap.difficulty) as any}
                            variant="flat"
                          >
                            {roadmap.difficulty}
                          </Chip>
                          {roadmap.estimatedDuration && (
                            <Chip size="sm" variant="flat">
                              ⏱ {roadmap.estimatedDuration}
                            </Chip>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {roadmap.url && (
                            <Button
                              as="a"
                              href={roadmap.url}
                              target="_blank"
                              size="sm"
                              color="primary"
                              variant="flat"
                              endContent={<ExternalLinkIcon className="w-3.5 h-3.5" />}
                            >
                              View Roadmap
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <MapIcon className="w-16 h-16 text-default-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Roadmaps Yet</h3>
              <p className="text-default-500">
                Career and learning roadmaps will be published soon.
              </p>
            </div>
          )}
        </Tab>
      </Tabs>
    </div>
  );
}
