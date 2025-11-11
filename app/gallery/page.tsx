'use client';

import { useState, useEffect } from "react";
import { Card, CardBody, CardFooter } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Button } from "@heroui/button";
import { Modal, ModalContent, ModalBody } from "@heroui/modal";
import { Spinner } from "@heroui/spinner";
import type { GalleryImage } from "@/lib/database";

interface GalleryCategory {
  id: string;
  label: string;
  icon: string;
}

export default function GalleryPage() {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories: GalleryCategory[] = [
    { id: "all", label: "All", icon: "🎨" },
    { id: "events", label: "Events", icon: "🎉" },
    { id: "workshops", label: "Workshops", icon: "🛠️" },
    { id: "hackathons", label: "Hackathons", icon: "💻" },
    { id: "team", label: "Team", icon: "👥" },
    { id: "projects", label: "Projects", icon: "🚀" },
  ];

  useEffect(() => {
    fetchGalleryImages();
  }, []);

  const fetchGalleryImages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/gallery");

      if (!response.ok) {
        throw new Error("Failed to fetch gallery images");
      }

      const result = await response.json();
      setGalleryImages(result.data || []);
    } catch (err) {
      console.error("Error fetching gallery images:", err);
      setError("Failed to load gallery images");
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = selectedCategory === "all"
    ? galleryImages
    : galleryImages.filter((img) => img.category === selectedCategory);

  if (error && loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="border-none" shadow="lg">
          <CardBody className="p-8 text-center">
            <p className="text-lg text-red-600">{error}</p>
            <Button
              className="mt-4"
              color="primary"
              onPress={() => fetchGalleryImages()}
            >
              Retry
            </Button>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 sm:space-y-10 md:space-y-12 lg:space-y-16 pb-10 sm:pb-12 md:pb-16 lg:pb-20 px-3 sm:px-4 md:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6 relative py-6 sm:py-8">
        <div className="absolute top-0 left-1/4 w-48 sm:w-64 md:w-72 h-48 sm:h-64 md:h-72 bg-pink-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-6 sm:top-10 md:top-16 right-1/4 w-64 sm:w-80 md:w-96 h-64 sm:h-80 md:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-700" />

        <div className="relative z-10">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight">
            Our{" "}
            <span className="bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Gallery
            </span>
          </h1>
          <p className="mt-3 sm:mt-4 md:mt-5 lg:mt-6 max-w-2xl mx-auto text-xs sm:text-sm md:text-base lg:text-lg text-default-600">
            Capturing moments of innovation, collaboration, and growth
          </p>
        </div>
      </div>

      {/* Category Filter */}
      <Card className="border-none bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30 max-w-7xl mx-auto w-full" shadow="lg">
        <CardBody className="p-3 sm:p-4 md:p-5 lg:p-6">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-3 sm:mb-4 text-center">Filter by Category</h3>
          <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 md:gap-3">
            {categories.map((category) => (
              <Button
                key={category.id}
                onPress={() => setSelectedCategory(category.id)}
                variant={selectedCategory === category.id ? "solid" : "bordered"}
                color={selectedCategory === category.id ? "secondary" : "default"}
                className="transition-all text-xs sm:text-sm md:text-base"
                startContent={<span className="text-base sm:text-lg">{category.icon}</span>}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Loading State */}
      {loading ? (
        <div className="flex items-center justify-center py-8 sm:py-10 md:py-12">
          <Spinner label="Loading gallery..." size="lg" />
        </div>
      ) : filteredImages.length === 0 ? (
        <Card className="border-none max-w-7xl mx-auto w-full" shadow="sm">
          <CardBody className="p-6 sm:p-8 md:p-12 text-center space-y-2 sm:space-y-3">
            <p className="text-3xl sm:text-4xl">🔍</p>
            <h3 className="text-base sm:text-lg md:text-xl font-semibold">No images found</h3>
            <p className="text-xs sm:text-sm text-default-500">Try selecting a different category</p>
          </CardBody>
        </Card>
      ) : (
        <>
          {/* Gallery Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6 max-w-7xl mx-auto w-full">
            {filteredImages.map((image) => (
              <Card
                key={image.$id}
                isPressable
                onPress={() => setSelectedImage(image)}
                className="border-none group hover:scale-105 transition-all duration-300"
                shadow="md"
              >
                <CardBody className="p-0 overflow-hidden">
                  <div className="relative aspect-video overflow-hidden">
                    <img
                      src={image.imageUrl}
                      alt={image.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-white text-xs sm:text-sm font-medium">{image.description}</p>
                    </div>
                  </div>
                </CardBody>
                <CardFooter className="flex-col items-start gap-1.5 sm:gap-2 md:gap-2.5 p-3 sm:p-4 md:p-5">
                  <div className="flex justify-between items-center w-full gap-2 min-w-0">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold truncate">{image.title}</h3>
                      <p className="text-xs text-default-500">{image.date}</p>
                    </div>
                    <Chip
                      size="sm"
                      variant="flat"
                      color="secondary"
                      className="flex-shrink-0 text-xs"
                      startContent={<span className="text-xs">👥</span>}
                    >
                      <span className="text-xs">{image.attendees}</span>
                    </Chip>
                  </div>
                  <Chip size="sm" variant="bordered" color="default" className="text-xs">
                    {categories.find((c) => c.id === image.category)?.icon}{" "}
                    {categories.find((c) => c.id === image.category)?.label}
                  </Chip>
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Image Modal */}
      <Modal
        isOpen={selectedImage !== null}
        onClose={() => setSelectedImage(null)}
        size="3xl"
        className="bg-transparent shadow-none"
      >
        <ModalContent>
          {(onClose) => (
            <ModalBody className="p-0">
              {selectedImage && (
                <Card className="border-none">
                  <CardBody className="p-0 overflow-hidden">
                    <img
                      src={selectedImage.imageUrl}
                      alt={selectedImage.title}
                      className="w-full h-auto max-h-[70vh] object-contain"
                    />
                  </CardBody>
                  <CardFooter className="flex-col items-start gap-3 p-6 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/30 dark:to-purple-950/30">
                    <div className="flex justify-between items-start w-full">
                      <div>
                        <h3 className="text-2xl font-bold">{selectedImage.title}</h3>
                        <p className="text-default-600 mt-1">{selectedImage.date}</p>
                      </div>
                      <Chip
                        size="lg"
                        variant="flat"
                        color="secondary"
                        startContent={<span>👥</span>}
                      >
                        {selectedImage.attendees} attendees
                      </Chip>
                    </div>
                    <p className="text-default-700">{selectedImage.description}</p>
                    <div className="flex gap-2 mt-2">
                      <Chip
                        size="md"
                        variant="bordered"
                        color="default"
                        startContent={
                          <span>
                            {categories.find((c) => c.id === selectedImage.category)?.icon}
                          </span>
                        }
                      >
                        {categories.find((c) => c.id === selectedImage.category)?.label}
                      </Chip>
                    </div>
                  </CardFooter>
                </Card>
              )}
            </ModalBody>
          )}
        </ModalContent>
      </Modal>

      {/* Call to Action */}
      <Card className="border-none bg-gradient-to-r from-pink-500 to-purple-600 text-white" shadow="lg">
        <CardBody className="p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold mb-3">Want to be part of our story?</h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Join Mind Mesh and create unforgettable memories while building amazing projects
          </p>
          <Button
            size="lg"
            className="bg-white text-purple-600 font-semibold hover:scale-105 transition-transform"
          >
            Join Our Community
          </Button>
        </CardBody>
      </Card>

      {/* Footer Note */}
      <Card className="border-none bg-gradient-to-r from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30">
        <CardBody className="p-6 text-center">
          <p className="text-default-600">
            📸 All photos are from our community events. If you'd like your photo removed, please contact us.
          </p>
          <p className="text-sm text-default-500 mt-3">
            © 2025 Mind Mesh. All rights reserved.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}