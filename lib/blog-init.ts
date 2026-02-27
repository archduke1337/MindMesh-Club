/**
 * Blog Collection Initialization
 * 
 * This file contains helpers to set up the blogs collection in Appwrite.
 * Run this once during application setup.
 */

import { databases } from "./appwrite";
import { DATABASE_ID, BLOGS_COLLECTION_ID } from "./database";
import { ID, Permission, Role } from "appwrite";

export const blogCollectionInit = {
  /**
   * Print setup instructions for the blogs collection.
   * NOTE: This does NOT actually create the collection — Appwrite admin console is required.
   */
  async printSetupInstructions() {
    try {
      console.log("🔄 Creating blogs collection...");
      
      // Note: This would need admin access to execute
      // Currently this is a reference for manual setup
      
      console.log("📋 Manual Setup Instructions:");
      console.log("1. Go to: https://cloud.appwrite.io/console/databases");
      console.log(`2. Select database: ${DATABASE_ID}`);
      console.log("3. Create new collection:");
      console.log(`   - Collection ID: ${BLOGS_COLLECTION_ID}`);
      console.log("4. Add these attributes:");
      console.log("   - title (String, required)");
      console.log("   - slug (String, required, unique)");
      console.log("   - excerpt (String, required)");
      console.log("   - content (String, required)");
      console.log("   - coverImage (String, required)");
      console.log("   - category (String, required)");
      console.log("   - tags (String array)");
      console.log("   - authorId (String, required)");
      console.log("   - authorName (String, required)");
      console.log("   - authorEmail (String, required)");
      console.log("   - authorAvatar (String)");
      console.log("   - status (String, default: 'pending', options: draft|pending|approved|rejected)");
      console.log("   - rejectionReason (String)");
      console.log("   - publishedAt (DateTime)");
      console.log("   - views (Integer, default: 0)");
      console.log("   - likes (Integer, default: 0)");
      console.log("   - featured (Boolean, default: false)");
      console.log("   - readTime (Integer)");
      console.log("5. Create indexes on: status, featured, publishedAt, slug, category");
      
      return true;
    } catch (error) {
      console.error("Error creating blogs collection:", error);
      return false;
    }
  },

  /**
   * Verify if blogs collection exists
   */
  async verifyBlogsCollection() {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        BLOGS_COLLECTION_ID,
        []
      );
      console.log("✅ Blogs collection exists and is accessible");
      return true;
    } catch (error: any) {
      if (error?.message?.includes("Collection with the requested ID could not be found")) {
        console.error("❌ Blogs collection not found!");
        console.error("💡 Run: await blogCollectionInit.printSetupInstructions() in browser console");
        return false;
      }
      console.error("❌ Error accessing blogs collection:", error);
      return false;
    }
  },

  /**
   * Get setup instructions
   */
  getSetupInstructions() {
    return `
BLOG SYSTEM SETUP INSTRUCTIONS
===============================

1. Create Database Collection in Appwrite Console:
   - Go to: https://cloud.appwrite.io/console/databases
   - Select database ID: ${DATABASE_ID}
   - Click "Create Collection"
   - Set Collection ID: ${BLOGS_COLLECTION_ID}

2. Add Collection Attributes (in order):
   ✓ title (String, required)
   ✓ slug (String, required, unique index)
   ✓ excerpt (String, required)
   ✓ content (String, required)
   ✓ coverImage (String, required)
   ✓ category (String, required)
   ✓ tags (String array)
   ✓ authorId (String, required)
   ✓ authorName (String, required)
   ✓ authorEmail (String, required)
   ✓ authorAvatar (String)
   ✓ status (String, default: 'pending')
   ✓ rejectionReason (String)
   ✓ publishedAt (DateTime)
   ✓ views (Integer, default: 0)
   ✓ likes (Integer, default: 0)
   ✓ featured (Boolean, default: false)
   ✓ readTime (Integer)

3. Create Indexes on:
   ✓ status
   ✓ featured
   ✓ publishedAt
   ✓ slug (unique)
   ✓ category

4. Set Permissions:
   ✓ Read: Users can read approved blogs
   ✓ Write: Only authenticated users and admins
   ✓ Delete: Only admins

5. Verify Setup:
   - Open browser console (F12)
   - Run: await blogCollectionInit.verifyBlogsCollection()
   - You should see "✅ Blogs collection exists and is accessible"

Done! Your blog system is ready.
    `;
  }
};

// For browser console debugging (development only)
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  (window as any).blogCollectionInit = blogCollectionInit;
}
