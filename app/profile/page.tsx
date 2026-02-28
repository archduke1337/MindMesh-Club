"use client";
import { useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { account, storage, ID } from "@/lib/appwrite";
import { ImageGravity } from "appwrite";
import { logger } from "@/lib/logger";
import { userProfileSchema } from "@/lib/validation/schemas";
import { z } from "zod";
import {
  CameraIcon,
  MailIcon,
  PhoneIcon,
  GraduationCapIcon,
  BuildingIcon,
  CalendarIcon,
  GithubIcon,
  LinkedinIcon,
  GlobeIcon,
  ShieldIcon,
  TicketIcon,
  SettingsIcon,
  EditIcon,
  SparklesIcon,
  BookOpenIcon,
} from "lucide-react";

// Profile pictures bucket ID
const PROFILE_BUCKET_ID = "profile-pictures";

export default function ProfilePage() {
  const { user, profile, loading, profileLoading, isAdmin, isProfileComplete } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profilePicture, setProfilePicture] = useState<string>("");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
      loadProfilePicture();
    }
  }, [user, loading, router]);

  const loadProfilePicture = () => {
    // Try member profile avatar first, then Appwrite prefs
    if (profile?.avatar) {
      setProfilePicture(profile.avatar);
      return;
    }
    const prefs = user?.prefs as Record<string, any> | undefined;
    if (prefs?.profilePictureId) {
      try {
        const fileUrl = storage.getFilePreview(
          PROFILE_BUCKET_ID,
          prefs.profilePictureId,
          400, 400,
          ImageGravity.Center,
          100
        );
        setProfilePicture(fileUrl.toString());
      } catch {
        setProfilePicture(getAvatarUrl(user?.name || "User"));
      }
    } else {
      setProfilePicture(getAvatarUrl(user?.name || "User"));
    }
  };

  const getAvatarUrl = (name: string) =>
    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&bold=true&size=400`;

  const handleFileSelect = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUpdateError("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUpdateError("Image size should be less than 5MB");
      return;
    }

    setUploadingPhoto(true);
    setUpdateError("");

    try {
      const prefs = user?.prefs as Record<string, any> | undefined;
      if (prefs?.profilePictureId) {
        try {
          await storage.deleteFile(PROFILE_BUCKET_ID, prefs.profilePictureId);
        } catch {
          // old pic might not exist
        }
      }

      const response = await storage.createFile(PROFILE_BUCKET_ID, ID.unique(), file);
      await account.updatePrefs({ ...user?.prefs, profilePictureId: response.$id });

      const fileUrl = storage.getFilePreview(PROFILE_BUCKET_ID, response.$id, 400, 400, ImageGravity.Center, 100);
      setProfilePicture(fileUrl.toString());
      setUpdateSuccess(true);
      setUpdateError("Profile picture updated!");
      setTimeout(() => router.refresh(), 2000);
    } catch (err: any) {
      setUpdateError(err.message || "Failed to upload profile picture.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError("");
    setValidationErrors({});
    setUpdateSuccess(false);
    setUpdateLoading(true);

    try {
      const validationResult = userProfileSchema.safeParse({
        name,
        phone: phone || undefined,
      });

      if (!validationResult.success) {
        const errors: { [key: string]: string } = {};
        validationResult.error.issues.forEach((err: z.ZodIssue) => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setValidationErrors(errors);
        setUpdateLoading(false);
        return;
      }

      await account.updateName(name);
      setUpdateSuccess(true);
      setUpdateError("Profile updated successfully!");
      setIsEditing(false);
      setTimeout(() => router.refresh(), 2000);
    } catch (err: any) {
      setUpdateError(err.message || "Failed to update profile");
    } finally {
      setUpdateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-default-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Profile Header Card */}
      <Card className="border-none shadow-xl mb-6">
        <CardBody className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <Avatar
                src={profilePicture}
                className="w-28 h-28 sm:w-32 sm:h-32"
                isBordered
                color="primary"
                showFallback
                name={user.name}
              />
              <Button
                isIconOnly
                size="sm"
                color="primary"
                className="absolute bottom-1 right-1 shadow-lg"
                onPress={handleFileSelect}
                isLoading={uploadingPhoto}
              >
                {!uploadingPhoto && <CameraIcon className="w-4 h-4" />}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
                title="Upload profile picture"
              />
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1">{user.name}</h1>
              <p className="text-default-500 text-sm mb-3">{user.email}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Chip color="success" variant="flat" size="sm">
                  Active Account
                </Chip>
                {isAdmin && (
                  <Chip color="warning" variant="flat" size="sm" startContent={<ShieldIcon className="w-3 h-3" />}>
                    Admin
                  </Chip>
                )}
                {profile && (
                  <Chip
                    color={profile.memberStatus === "approved" ? "primary" : "warning"}
                    variant="flat"
                    size="sm"
                  >
                    {profile.memberStatus === "approved" ? "Verified Member" : profile.memberStatus}
                  </Chip>
                )}
                {!isProfileComplete && (
                  <Chip color="danger" variant="flat" size="sm">
                    Profile Incomplete
                  </Chip>
                )}
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Status/Error Messages */}
      {updateError && (
        <div className={`p-3 rounded-lg text-sm font-medium mb-4 ${
          updateSuccess ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
        }`}>
          {updateError}
        </div>
      )}

      {/* Profile Incomplete Banner */}
      {!isProfileComplete && !profileLoading && (
        <Card className="border-none shadow-md mb-6 bg-gradient-to-r from-warning-50 to-orange-50 dark:from-warning-900/20 dark:to-orange-900/20">
          <CardBody className="p-4 flex flex-col sm:flex-row items-center gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-sm">Complete Your Profile</h3>
              <p className="text-xs text-default-500">
                Add your branch, year, college, and other details to become a verified member.
              </p>
            </div>
            <Button
              as={NextLink}
              href="/complete-profile"
              color="warning"
              size="sm"
            >
              Complete Profile
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Button
          as={NextLink}
          href="/tickets"
          variant="flat"
          className="flex flex-col items-center gap-1 h-auto py-4"
        >
          <TicketIcon className="w-5 h-5" />
          <span className="text-xs">My Tickets</span>
        </Button>
        <Button
          as={NextLink}
          href="/events"
          variant="flat"
          className="flex flex-col items-center gap-1 h-auto py-4"
        >
          <CalendarIcon className="w-5 h-5" />
          <span className="text-xs">Events</span>
        </Button>
        <Button
          as={NextLink}
          href="/resources"
          variant="flat"
          className="flex flex-col items-center gap-1 h-auto py-4"
        >
          <BookOpenIcon className="w-5 h-5" />
          <span className="text-xs">Resources</span>
        </Button>
        <Button
          as={NextLink}
          href="/settings"
          variant="flat"
          className="flex flex-col items-center gap-1 h-auto py-4"
        >
          <SettingsIcon className="w-5 h-5" />
          <span className="text-xs">Settings</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Information */}
        <Card className="border-none shadow-lg">
          <CardHeader className="px-6 pt-6 pb-0">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-lg font-bold">Account Information</h2>
              {!isEditing && (
                <Button
                  size="sm"
                  color="primary"
                  variant="flat"
                  onPress={() => setIsEditing(true)}
                  startContent={<EditIcon className="w-3.5 h-3.5" />}
                >
                  Edit
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody className="px-6 pb-6 space-y-4">
            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <Input
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  isDisabled={updateLoading}
                  variant="bordered"
                  isInvalid={!!validationErrors.name}
                  errorMessage={validationErrors.name}
                />
                <Input
                  label="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  isDisabled={updateLoading}
                  variant="bordered"
                  isInvalid={!!validationErrors.phone}
                  errorMessage={validationErrors.phone}
                />
                <div className="flex gap-2">
                  <Button type="submit" color="primary" isLoading={updateLoading} className="flex-1">
                    Save
                  </Button>
                  <Button
                    variant="flat"
                    onPress={() => {
                      setIsEditing(false);
                      setName(user.name);
                      setPhone(user.phone || "");
                      setUpdateError("");
                      setValidationErrors({});
                    }}
                    isDisabled={updateLoading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <InfoRow icon={<MailIcon className="w-4 h-4" />} label="Email" value={user.email}>
                  <Chip
                    color={user.emailVerification ? "success" : "warning"}
                    variant="flat"
                    size="sm"
                  >
                    {user.emailVerification ? "Verified" : "Not Verified"}
                  </Chip>
                </InfoRow>
                <InfoRow icon={<PhoneIcon className="w-4 h-4" />} label="Phone" value={user.phone || "Not added"}>
                  {user.phone && (
                    <Chip
                      color={user.phoneVerification ? "success" : "warning"}
                      variant="flat"
                      size="sm"
                    >
                      {user.phoneVerification ? "Verified" : "Not Verified"}
                    </Chip>
                  )}
                </InfoRow>
                <InfoRow
                  icon={<CalendarIcon className="w-4 h-4" />}
                  label="Joined"
                  value={new Date(user.$createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                />
                <div className="pt-2">
                  <p className="text-xs text-default-400 font-mono break-all">ID: {user.$id}</p>
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Member Profile Details */}
        <Card className="border-none shadow-lg">
          <CardHeader className="px-6 pt-6 pb-0">
            <div className="flex items-center justify-between w-full">
              <h2 className="text-lg font-bold">Member Details</h2>
              {isProfileComplete && (
                <Button
                  as={NextLink}
                  href="/complete-profile"
                  size="sm"
                  variant="flat"
                  startContent={<EditIcon className="w-3.5 h-3.5" />}
                >
                  Update
                </Button>
              )}
            </div>
          </CardHeader>
          <CardBody className="px-6 pb-6">
            {profileLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
              </div>
            ) : profile ? (
              <div className="space-y-3">
                <InfoRow
                  icon={<GraduationCapIcon className="w-4 h-4" />}
                  label="Program"
                  value={`${profile.program} — ${profile.branch}`}
                />
                <InfoRow
                  icon={<BuildingIcon className="w-4 h-4" />}
                  label="College"
                  value={profile.college}
                />
                <InfoRow
                  icon={<CalendarIcon className="w-4 h-4" />}
                  label="Year"
                  value={profile.year}
                />
                <InfoRow
                  icon={<PhoneIcon className="w-4 h-4" />}
                  label="WhatsApp"
                  value={profile.whatsapp || "Not added"}
                />

                {/* Social Links */}
                <Divider className="my-3" />
                <div className="flex flex-wrap gap-2">
                  {profile.github && (
                    <Button
                      as="a"
                      href={`https://github.com/${profile.github}`}
                      target="_blank"
                      size="sm"
                      variant="flat"
                      startContent={<GithubIcon className="w-3.5 h-3.5" />}
                    >
                      {profile.github}
                    </Button>
                  )}
                  {profile.linkedin && (
                    <Button
                      as="a"
                      href={profile.linkedin}
                      target="_blank"
                      size="sm"
                      variant="flat"
                      startContent={<LinkedinIcon className="w-3.5 h-3.5" />}
                    >
                      LinkedIn
                    </Button>
                  )}
                  {profile.portfolio && (
                    <Button
                      as="a"
                      href={profile.portfolio}
                      target="_blank"
                      size="sm"
                      variant="flat"
                      startContent={<GlobeIcon className="w-3.5 h-3.5" />}
                    >
                      Portfolio
                    </Button>
                  )}
                </div>

                {/* Skills */}
                {profile.skills && profile.skills.length > 0 && (
                  <>
                    <Divider className="my-3" />
                    <div>
                      <p className="text-xs text-default-500 font-medium mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.skills.map((skill: string, i: number) => (
                          <Chip key={i} size="sm" variant="flat" color="primary">
                            {skill}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Stats */}
                <Divider className="my-3" />
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-xl font-bold text-primary">{profile.eventsAttended || 0}</p>
                    <p className="text-xs text-default-400">Events</p>
                  </div>
                  {profile.badges && profile.badges.length > 0 && (
                    <div className="text-center">
                      <p className="text-xl font-bold text-warning">{profile.badges.length}</p>
                      <p className="text-xs text-default-400">Badges</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <SparklesIcon className="w-10 h-10 text-default-300 mx-auto mb-3" />
                <p className="text-sm text-default-500 mb-3">No member profile yet</p>
                <Button
                  as={NextLink}
                  href="/complete-profile"
                  color="primary"
                  size="sm"
                >
                  Complete Profile
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

// Reusable info row component
function InfoRow({
  icon,
  label,
  value,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-default-400 mt-0.5 flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-default-400 mb-0.5">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{value}</p>
          {children}
        </div>
      </div>
    </div>
  );
}