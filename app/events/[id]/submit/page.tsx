"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import {
  SendIcon,
  ArrowLeftIcon,
  CodeIcon,
  LinkIcon,
  VideoIcon,
  ImageIcon,
  FileTextIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function SubmitProjectPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [userTeam, setUserTeam] = useState<any>(null);
  const [existingSubmission, setExistingSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    projectTitle: "",
    projectDescription: "",
    techStack: "",
    repoUrl: "",
    demoUrl: "",
    videoUrl: "",
    presentationUrl: "",
    additionalNotes: "",
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    loadData();
  }, [user, eventId]);

  const loadData = async () => {
    if (!user) return;
    try {
      // Check if user has a team
      const teamRes = await fetch(
        `/api/hackathon/teams?eventId=${eventId}&userId=${user.$id}`
      );
      const teamData = await teamRes.json();
      setUserTeam(teamData.team || null);

      // Check existing submission
      if (teamData.team) {
        const subRes = await fetch(
          `/api/hackathon/submissions?teamId=${teamData.team.$id}`
        );
        const subData = await subRes.json();
        if (subData.submissions?.length > 0) {
          setExistingSubmission(subData.submissions[0]);
          // Pre-fill form
          const existing = subData.submissions[0];
          setFormData({
            projectTitle: existing.projectTitle || "",
            projectDescription: existing.projectDescription || "",
            techStack: (existing.techStack || []).join(", "),
            repoUrl: existing.repoUrl || "",
            demoUrl: existing.demoUrl || "",
            videoUrl: existing.videoUrl || "",
            presentationUrl: existing.presentationUrl || "",
            additionalNotes: existing.additionalNotes || "",
          });
        }
      }
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async () => {
    if (!user) return;

    // Validate required
    if (!formData.projectTitle.trim() || !formData.projectDescription.trim()) {
      setError("Project title and description are required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        eventId,
        teamId: userTeam?.$id || null,
        userId: user.$id,
        userName: user.name,
        projectTitle: formData.projectTitle.trim(),
        projectDescription: formData.projectDescription.trim(),
        techStack: formData.techStack
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        repoUrl: formData.repoUrl.trim() || null,
        demoUrl: formData.demoUrl.trim() || null,
        videoUrl: formData.videoUrl.trim() || null,
        presentationUrl: formData.presentationUrl.trim() || null,
        additionalNotes: formData.additionalNotes.trim() || null,
      };

      const url = existingSubmission
        ? "/api/hackathon/submissions"
        : "/api/hackathon/submissions";
      const method = existingSubmission ? "PATCH" : "POST";
      const body = existingSubmission
        ? { submissionId: existingSubmission.$id, ...payload }
        : payload;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || "Submission failed");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-default-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-6">
          <CheckCircleIcon className="w-10 h-10 text-success" />
        </div>
        <h1 className="text-3xl font-bold mb-3">
          {existingSubmission ? "Submission Updated!" : "Project Submitted!"}
        </h1>
        <p className="text-default-500 mb-8 max-w-md mx-auto">
          Your project has been {existingSubmission ? "updated" : "submitted"} successfully.
          The organizers will review it soon.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            color="primary"
            onPress={() => router.push(`/events/${eventId}/teams`)}
          >
            Back to Teams
          </Button>
          <Button
            variant="flat"
            onPress={() => router.push(`/events/${eventId}/results`)}
          >
            View Results
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <Button
        variant="light"
        startContent={<ArrowLeftIcon className="w-4 h-4" />}
        onPress={() => router.back()}
        className="mb-6"
      >
        Back
      </Button>

      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">
          {existingSubmission ? "Update Submission" : "Submit Your Project"}
        </h1>
        <p className="text-default-500">
          {userTeam
            ? `Submitting as team "${userTeam.teamName}"`
            : "Submitting as individual"}
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-danger/10 text-danger rounded-lg text-sm">
            <AlertTriangleIcon className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Project Info */}
        <Card className="border-none shadow-lg">
          <CardHeader className="px-6 pt-6 pb-0">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <CodeIcon className="w-5 h-5 text-primary" />
              Project Details
            </h2>
          </CardHeader>
          <CardBody className="px-6 pb-6 space-y-4">
            <Input
              label="Project Title"
              value={formData.projectTitle}
              onChange={(e) => handleChange("projectTitle", e.target.value)}
              isRequired
              variant="bordered"
              placeholder="e.g. EcoTrack - Carbon Footprint Tracker"
            />
            <Textarea
              label="Project Description"
              value={formData.projectDescription}
              onChange={(e) => handleChange("projectDescription", e.target.value)}
              isRequired
              variant="bordered"
              placeholder="Describe your project, what problem it solves, and how it works..."
              minRows={4}
            />
            <Input
              label="Tech Stack (comma-separated)"
              value={formData.techStack}
              onChange={(e) => handleChange("techStack", e.target.value)}
              variant="bordered"
              placeholder="React, Node.js, MongoDB, Tailwind CSS..."
              startContent={<CodeIcon className="w-4 h-4 text-default-400" />}
            />
          </CardBody>
        </Card>

        {/* Links */}
        <Card className="border-none shadow-lg">
          <CardHeader className="px-6 pt-6 pb-0">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-primary" />
              Links & Resources
            </h2>
          </CardHeader>
          <CardBody className="px-6 pb-6 space-y-4">
            <Input
              label="GitHub / Repository URL"
              value={formData.repoUrl}
              onChange={(e) => handleChange("repoUrl", e.target.value)}
              variant="bordered"
              placeholder="https://github.com/..."
              startContent={<CodeIcon className="w-4 h-4 text-default-400" />}
            />
            <Input
              label="Live Demo URL"
              value={formData.demoUrl}
              onChange={(e) => handleChange("demoUrl", e.target.value)}
              variant="bordered"
              placeholder="https://your-demo.vercel.app"
              startContent={<LinkIcon className="w-4 h-4 text-default-400" />}
            />
            <Input
              label="Video Demo URL (YouTube/Loom)"
              value={formData.videoUrl}
              onChange={(e) => handleChange("videoUrl", e.target.value)}
              variant="bordered"
              placeholder="https://youtube.com/watch?v=..."
              startContent={<VideoIcon className="w-4 h-4 text-default-400" />}
            />
            <Input
              label="Presentation URL (Google Slides/Canva)"
              value={formData.presentationUrl}
              onChange={(e) => handleChange("presentationUrl", e.target.value)}
              variant="bordered"
              placeholder="https://docs.google.com/presentation/..."
              startContent={<FileTextIcon className="w-4 h-4 text-default-400" />}
            />
          </CardBody>
        </Card>

        {/* Additional Notes */}
        <Card className="border-none shadow-lg">
          <CardBody className="px-6 py-6">
            <Textarea
              label="Additional Notes (optional)"
              value={formData.additionalNotes}
              onChange={(e) => handleChange("additionalNotes", e.target.value)}
              variant="bordered"
              placeholder="Any additional information for the judges..."
              minRows={3}
            />
          </CardBody>
        </Card>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            variant="flat"
            size="lg"
            onPress={() => router.back()}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            size="lg"
            onPress={handleSubmit}
            isLoading={submitting}
            startContent={<SendIcon className="w-4 h-4" />}
          >
            {existingSubmission ? "Update Submission" : "Submit Project"}
          </Button>
        </div>
      </div>
    </div>
  );
}
