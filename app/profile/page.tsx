// app/profile/page.tsx
"use client";
import { useEffect, useState, useRef } from "react";
import { Card, CardHeader, CardBody } from "@heroui/card";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import NextLink from "next/link";
import { account, storage, ID, APPWRITE_CONFIG } from "@/lib/appwrite";

// Profile pictures bucket ID
const PROFILE_BUCKET_ID = "profile-pictures"; // Make sure this exists in Appwrite

export default function ProfilePage() {
  const { user, loading } = useAuth();
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
    if (user?.prefs?.profilePictureId) {
      try {
        // FIXED: Get the URL string properly
        const fileUrl = storage.getFilePreview(
          PROFILE_BUCKET_ID,
          user.prefs.profilePictureId,
          400, // width
          400, // height
          "center", // gravity
          100 // quality
        );
        
        // Convert URL object to string
        const urlString = fileUrl.toString();
        console.log("Profile picture URL:", urlString);
        setProfilePicture(urlString);
      } catch (error) {
        console.error("Error loading profile picture:", error);
        // Fallback to generated avatar
        setProfilePicture(getAvatarUrl(user.name));
      }
    } else {
      // Use generated avatar if no profile picture
      setProfilePicture(getAvatarUrl(user?.name || "User"));
    }
  };

  const getAvatarUrl = (name: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=400`;
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setUpdateError("Please select an image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUpdateError("Image size should be less than 5MB");
      return;
    }

    setUploadingPhoto(true);
    setUpdateError("");

    try {
      // Delete old profile picture if exists
      if (user?.prefs?.profilePictureId) {
        try {
          await storage.deleteFile(PROFILE_BUCKET_ID, user.prefs.profilePictureId);
          console.log("Old profile picture deleted");
        } catch (error) {
          console.log("No old picture to delete or error:", error);
        }
      }

      // Upload new profile picture
      const response = await storage.createFile(
        PROFILE_BUCKET_ID,
        ID.unique(),
        file
      );

      console.log("File uploaded:", response.$id);

      // Update user preferences with new picture ID
      await account.updatePrefs({
        ...user?.prefs,
        profilePictureId: response.$id,
      });

      // FIXED: Get preview URL properly
      const fileUrl = storage.getFilePreview(
        PROFILE_BUCKET_ID,
        response.$id,
        400,
        400,
        "center",
        100
      );
      
      const urlString = fileUrl.toString();
      console.log("New profile picture URL:", urlString);
      setProfilePicture(urlString);
      
      setUpdateSuccess(true);
      setUpdateError("Profile picture updated successfully!");
      
      // Reload after showing success message
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error("Upload error:", err);
      setUpdateError(err.message || "Failed to upload profile picture. Please check bucket permissions.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateError("");
    setUpdateSuccess(false);
    setUpdateLoading(true);

    try {
      await account.updateName(name);
      setUpdateSuccess(true);
      setUpdateError("Profile updated successfully!");
      setIsEditing(false);
      
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error("Update error:", err);
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

  if (!user) {
    return null;
  }

  return (
    <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-6 sm:py-8 md:py-10 lg:py-12 flex items-center justify-center min-h-[calc(100vh-200px)]">
      <Card className="w-full max-w-2xl md:max-w-3xl">
        <CardHeader className="flex flex-col gap-3 sm:gap-4 items-center pt-6 sm:pt-8 md:pt-10 px-4 sm:px-6 md:px-8">
          <div className="relative">
            <Avatar
              src={profilePicture}
              className="w-24 sm:w-28 md:w-32 h-24 sm:h-28 md:h-32"
              isBordered
              color="primary"
              showFallback
              name={user.name}
            />
            <Button
              isIconOnly
              size="sm"
              color="primary"
              className="absolute bottom-0 right-0 shadow-lg"
              onPress={handleFileSelect}
              isLoading={uploadingPhoto}
            >
              {!uploadingPhoto && (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 sm:w-3.5 md:w-4 h-3 sm:h-3.5 md:h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                </svg>
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
              title="Upload profile picture"
              placeholder="Select an image"
            />
          </div>
          <div className="flex flex-col items-center gap-0.5 sm:gap-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center">{user.name}</h1>
            <p className="text-xs sm:text-small md:text-base text-default-500 text-center break-all">{user.email}</p>
            {user.phone && (
              <p className="text-[10px] sm:text-xs md:text-small text-default-500 text-center">{user.phone}</p>
            )}
            <Chip color="success" variant="flat" size="sm" className="mt-2 text-[10px] sm:text-xs md:text-small">
              Active Account
            </Chip>
          </div>
        </CardHeader>

        <CardBody className="gap-5 sm:gap-6 md:gap-8 px-4 sm:px-6 md:px-8 pb-6 sm:pb-8 md:pb-10">
          {/* Quick Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
            <Button
              as={NextLink}
              href="/tickets"
              variant="flat"
              color="primary"
              className="text-[10px] sm:text-xs md:text-small"
              size="lg"
            >
              📋 My Tickets
            </Button>
            <Button
              as={NextLink}
              href="/events"
              variant="flat"
              className="text-[10px] sm:text-xs md:text-small"
              size="lg"
            >
              🎫 Browse Events
            </Button>
            <Button
              as={NextLink}
              href="/settings"
              variant="flat"
              className="text-[10px] sm:text-xs md:text-small"
              size="lg"
            >
              ⚙️ Settings
            </Button>
          </div>

          {/* Show upload status */}
          {updateError && (
            <div className={`p-2 sm:p-3 md:p-4 rounded-lg text-[10px] sm:text-xs md:text-small font-medium ${
              updateSuccess ? "bg-success/10 text-success-700 dark:text-success-200" : "bg-danger/10 text-danger-700 dark:text-danger-200"
            }`}>
              {updateError}
            </div>
          )}

          <div className="border-t border-divider pt-6 sm:pt-7 md:pt-8">
            <h2 className="text-sm sm:text-base md:text-lg font-semibold mb-4 sm:mb-5 md:mb-6">Account Information</h2>
            
            <div className="space-y-3 sm:space-y-4 md:space-y-5">
              <div className="flex flex-col gap-1.5 sm:gap-2">
                <label className="text-[10px] sm:text-xs md:text-small text-default-500 font-medium">User ID</label>
                <p className="text-[10px] sm:text-xs md:text-small font-mono bg-default-100 p-2 md:p-3 rounded-lg break-all">
                  {user.$id}
                </p>
              </div>

              <div className="flex flex-col gap-1.5 sm:gap-2">
                <label className="text-[10px] sm:text-xs md:text-small text-default-500 font-medium">Email</label>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
                  <p className="text-[10px] sm:text-xs md:text-small p-2 break-all">{user.email}</p>
                  <Chip 
                    color={user.emailVerification ? "success" : "warning"} 
                    variant="flat" 
                    size="sm"
                    className="text-[10px] sm:text-xs md:text-small w-fit"
                  >
                    {user.emailVerification ? "Verified" : "Not Verified"}
                  </Chip>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 sm:gap-2">
                <label className="text-[10px] sm:text-xs md:text-small text-default-500 font-medium">Phone Number</label>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
                  <p className="text-[10px] sm:text-xs md:text-small p-2">{user.phone || "Not added"}</p>
                  <Chip 
                    color={user.phoneVerification ? "success" : "warning"} 
                    variant="flat" 
                    size="sm"
                    className="text-[10px] sm:text-xs md:text-small w-fit"
                  >
                    {user.phoneVerification ? "Verified" : "Not Verified"}
                  </Chip>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 sm:gap-2">
                <label className="text-[10px] sm:text-xs md:text-small text-default-500 font-medium">Account Created</label>
                <p className="text-[10px] sm:text-xs md:text-small p-2">
                  {new Date(user.$createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-divider pt-6 sm:pt-7 md:pt-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-5 md:mb-6">
              <h2 className="text-sm sm:text-base md:text-lg font-semibold">Profile Details</h2>
              {!isEditing && (
                <Button
                  size="lg"
                  color="primary"
                  variant="flat"
                  onPress={() => setIsEditing(true)}
                  className="text-[10px] sm:text-xs md:text-small"
                >
                  Edit Profile
                </Button>
              )}
            </div>

            {isEditing ? (
              <form onSubmit={handleUpdateProfile} className="space-y-3 sm:space-y-4 md:space-y-5">
                <Input
                  label="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  isDisabled={updateLoading}
                  size="lg"
                  classNames={{
                    input: "text-xs sm:text-small md:text-base",
                    label: "text-[10px] sm:text-xs md:text-small font-semibold"
                  }}
                />

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                  <Button
                    type="submit"
                    color="primary"
                    isLoading={updateLoading}
                    size="lg"
                    className="flex-1 text-[10px] sm:text-xs md:text-small"
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="flat"
                    onPress={() => {
                      setIsEditing(false);
                      setName(user.name);
                      setUpdateError("");
                      setUpdateSuccess(false);
                    }}
                    isDisabled={updateLoading}
                    size="lg"
                    className="flex-1 text-[10px] sm:text-xs md:text-small"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-2 sm:space-y-3 md:space-y-4">
                <div className="flex flex-col gap-1.5 sm:gap-2">
                  <label className="text-[10px] sm:text-xs md:text-small text-default-500 font-medium">Name</label>
                  <p className="text-[10px] sm:text-xs md:text-small p-2">{user.name}</p>
                </div>
              </div>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}