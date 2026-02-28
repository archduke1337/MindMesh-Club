// lib/services/gallery.service.ts
// Gallery Service -- CRUD for gallery collection
import { ID, Query } from "appwrite";
import { databases } from "../appwrite";
import {
  DATABASE_ID,
  COLLECTION_IDS,
  type GalleryImage,
} from "../types/appwrite";
export const galleryService = {
  async getAllImages(queries: string[] = []): Promise<GalleryImage[]> {
    const res = await databases.listDocuments(DATABASE_ID, COLLECTION_IDS.GALLERY, queries);
    return res.documents as unknown as GalleryImage[];
  },
  async getApprovedImages(): Promise<GalleryImage[]> {
    return this.getAllImages([
      Query.equal("isApproved", true),
      Query.orderDesc("$createdAt"),
      Query.limit(100),
    ]);
  },
  async getFeaturedImages(): Promise<GalleryImage[]> {
    return this.getAllImages([
      Query.equal("isApproved", true),
      Query.equal("isFeatured", true),
      Query.orderDesc("$createdAt"),
      Query.limit(20),
    ]);
  },
  async getImagesByCategory(category: string): Promise<GalleryImage[]> {
    return this.getAllImages([
      Query.equal("isApproved", true),
      Query.equal("category", category),
      Query.orderDesc("$createdAt"),
      Query.limit(50),
    ]);
  },
  async getImageById(imageId: string): Promise<GalleryImage> {
    const res = await databases.getDocument(DATABASE_ID, COLLECTION_IDS.GALLERY, imageId);
    return res as unknown as GalleryImage;
  },
  async createImage(
    imageData: Omit<GalleryImage, "$id" | "$createdAt" | "$updatedAt" | "$permissions" | "$databaseId" | "$collectionId">
  ): Promise<GalleryImage> {
    const data = {
      ...imageData,
      isApproved: imageData.isApproved ?? false,
      isFeatured: imageData.isFeatured ?? false,
    };
    const res = await databases.createDocument(DATABASE_ID, COLLECTION_IDS.GALLERY, ID.unique(), data);
    return res as unknown as GalleryImage;
  },
  async updateImage(imageId: string, imageData: Partial<GalleryImage>): Promise<GalleryImage> {
    const res = await databases.updateDocument(DATABASE_ID, COLLECTION_IDS.GALLERY, imageId, imageData);
    return res as unknown as GalleryImage;
  },
  async approveImage(imageId: string): Promise<GalleryImage> {
    return this.updateImage(imageId, { isApproved: true } as Partial<GalleryImage>);
  },
  async deleteImage(imageId: string): Promise<boolean> {
    await databases.deleteDocument(DATABASE_ID, COLLECTION_IDS.GALLERY, imageId);
    return true;
  },
  async toggleFeatured(imageId: string, isFeatured: boolean): Promise<GalleryImage> {
    return this.updateImage(imageId, { isFeatured } as Partial<GalleryImage>);
  },
};