"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardBody, CardFooter } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import { Button } from "@heroui/button";
import { Select, SelectItem } from "@heroui/select";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const YEAR_OPTIONS = [
  { value: "1st Year", label: "1st Year" },
  { value: "2nd Year", label: "2nd Year" },
  { value: "3rd Year", label: "3rd Year" },
  { value: "4th Year", label: "4th Year" },
  { value: "Alumni", label: "Alumni" },
  { value: "Faculty", label: "Faculty" },
];

export default function CompleteProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    whatsapp: "",
    branch: "",
    year: "",
    college: "",
    program: "",
    rollNumber: "",
    skills: "",
    interests: "",
    bio: "",
    linkedin: "",
    github: "",
    twitter: "",
    portfolio: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1); // 1 = required info, 2 = optional info

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
      }));

      // Check if profile already exists
      checkExistingProfile();
    }
  }, [user, loading]);

  const checkExistingProfile = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/members/profile?userId=${user.$id}`);
      const data = await res.json();
      if (data.profile) {
        // Profile already exists, redirect to profile page
        router.push("/profile");
      }
    } catch {
      // Ignore — profile doesn't exist yet
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleSubmit = async () => {
    if (!user) return;
    setSubmitting(true);
    setError("");

    // Validate required fields
    const required = ["name", "email", "phone", "whatsapp", "branch", "year", "college", "program"];
    const missing = required.filter((f) => !formData[f as keyof typeof formData]);
    if (missing.length > 0) {
      setError(`Please fill in: ${missing.join(", ")}`);
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        userId: user.$id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        whatsapp: formData.whatsapp,
        branch: formData.branch,
        year: formData.year,
        college: formData.college,
        program: formData.program,
        rollNumber: formData.rollNumber || null,
        skills: formData.skills ? formData.skills.split(",").map((s) => s.trim()).filter(Boolean) : [],
        interests: formData.interests ? formData.interests.split(",").map((s) => s.trim()).filter(Boolean) : [],
        bio: formData.bio || null,
        linkedin: formData.linkedin || null,
        github: formData.github || null,
        twitter: formData.twitter || null,
        portfolio: formData.portfolio || null,
      };

      const res = await fetch("/api/members/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create profile");
        setSubmitting(false);
        return;
      }

      // Success — redirect to profile
      router.push("/profile?welcome=true");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-default-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-2xl">
        <CardHeader className="flex flex-col gap-2 pt-8 px-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-xl font-bold">
              {user.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div>
              <h1 className="text-2xl font-bold">Complete Your Profile</h1>
              <p className="text-sm text-default-500">
                Welcome to MindMesh! Tell us about yourself.
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-4 w-full">
            <div className={`flex-1 h-1.5 rounded-full ${step >= 1 ? "bg-primary" : "bg-default-200"}`} />
            <div className={`flex-1 h-1.5 rounded-full ${step >= 2 ? "bg-primary" : "bg-default-200"}`} />
          </div>
          <div className="flex justify-between w-full text-xs text-default-500">
            <span className={step === 1 ? "text-primary font-semibold" : ""}>
              Required Info
            </span>
            <span className={step === 2 ? "text-primary font-semibold" : ""}>
              Optional Details
            </span>
          </div>
        </CardHeader>

        <Divider />

        <CardBody className="gap-4 px-6 py-6">
          {error && (
            <div className="p-3 rounded-lg bg-danger/10 text-danger text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-default-600 uppercase tracking-wide">
                Contact Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  isRequired
                  variant="bordered"
                />
                <Input
                  label="Email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  isRequired
                  isReadOnly
                  variant="bordered"
                  description="From your account"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  isRequired
                  variant="bordered"
                  placeholder="+91 98765 43210"
                />
                <Input
                  label="WhatsApp Number"
                  value={formData.whatsapp}
                  onChange={(e) => handleChange("whatsapp", e.target.value)}
                  isRequired
                  variant="bordered"
                  placeholder="+91 98765 43210"
                />
              </div>

              <Divider className="my-4" />

              <h3 className="text-sm font-semibold text-default-600 uppercase tracking-wide">
                Academic Information
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="College / Institution"
                  value={formData.college}
                  onChange={(e) => handleChange("college", e.target.value)}
                  isRequired
                  variant="bordered"
                />
                <Input
                  label="Program (e.g. B.Tech, MCA)"
                  value={formData.program}
                  onChange={(e) => handleChange("program", e.target.value)}
                  isRequired
                  variant="bordered"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Branch / Department"
                  value={formData.branch}
                  onChange={(e) => handleChange("branch", e.target.value)}
                  isRequired
                  variant="bordered"
                  placeholder="e.g. Computer Science"
                />
                <Select
                  label="Year"
                  selectedKeys={formData.year ? [formData.year] : []}
                  onChange={(e) => handleChange("year", e.target.value)}
                  isRequired
                  variant="bordered"
                >
                  {YEAR_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <Input
                label="Roll Number (optional)"
                value={formData.rollNumber}
                onChange={(e) => handleChange("rollNumber", e.target.value)}
                variant="bordered"
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-default-600 uppercase tracking-wide">
                About You
              </h3>

              <Textarea
                label="Bio"
                value={formData.bio}
                onChange={(e) => handleChange("bio", e.target.value)}
                variant="bordered"
                placeholder="Tell us about yourself, your interests, what you're working on..."
                minRows={3}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Skills (comma-separated)"
                  value={formData.skills}
                  onChange={(e) => handleChange("skills", e.target.value)}
                  variant="bordered"
                  placeholder="React, Python, UI/UX..."
                />
                <Input
                  label="Interests (comma-separated)"
                  value={formData.interests}
                  onChange={(e) => handleChange("interests", e.target.value)}
                  variant="bordered"
                  placeholder="AI, Web Dev, Blockchain..."
                />
              </div>

              <Divider className="my-4" />

              <h3 className="text-sm font-semibold text-default-600 uppercase tracking-wide">
                Social Links
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="LinkedIn"
                  value={formData.linkedin}
                  onChange={(e) => handleChange("linkedin", e.target.value)}
                  variant="bordered"
                  placeholder="https://linkedin.com/in/..."
                  startContent={
                    <span className="text-default-400 text-sm">🔗</span>
                  }
                />
                <Input
                  label="GitHub Username"
                  value={formData.github}
                  onChange={(e) => handleChange("github", e.target.value)}
                  variant="bordered"
                  placeholder="username"
                  startContent={
                    <span className="text-default-400 text-sm">🐙</span>
                  }
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Twitter/X Handle"
                  value={formData.twitter}
                  onChange={(e) => handleChange("twitter", e.target.value)}
                  variant="bordered"
                  placeholder="@handle"
                />
                <Input
                  label="Portfolio URL"
                  value={formData.portfolio}
                  onChange={(e) => handleChange("portfolio", e.target.value)}
                  variant="bordered"
                  placeholder="https://..."
                />
              </div>
            </div>
          )}
        </CardBody>

        <Divider />

        <CardFooter className="flex justify-between px-6 py-4">
          {step === 1 ? (
            <>
              <div /> {/* spacer */}
              <Button
                color="primary"
                size="lg"
                onPress={() => {
                  // Validate required before moving
                  const required = ["name", "email", "phone", "whatsapp", "branch", "year", "college", "program"];
                  const missing = required.filter((f) => !formData[f as keyof typeof formData]);
                  if (missing.length > 0) {
                    setError(`Please fill in: ${missing.join(", ")}`);
                    return;
                  }
                  setError("");
                  setStep(2);
                }}
              >
                Next →
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="flat"
                size="lg"
                onPress={() => setStep(1)}
              >
                ← Back
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="flat"
                  size="lg"
                  onPress={handleSubmit}
                  isLoading={submitting}
                >
                  Skip & Submit
                </Button>
                <Button
                  color="primary"
                  size="lg"
                  onPress={handleSubmit}
                  isLoading={submitting}
                >
                  Complete Profile ✓
                </Button>
              </div>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
