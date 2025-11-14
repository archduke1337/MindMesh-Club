// lib/appwrite.ts
import { Client, Account, Databases, Storage, ID } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const storage = new Storage(client);
export const databases = new Databases(client);

// Server-side admin access via REST API with headers
export const createAdminDatabases = () => {
  // In server-side API routes, we'll make direct REST calls with API key header
  // instead of using the SDK client
  return {
    createDocument: async (databaseId: string, collectionId: string, documentId: string, data: any) => {
      const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
      const apiKey = process.env.APPWRITE_API_KEY;

      if (!endpoint || !projectId || !apiKey) {
        throw new Error("Missing required environment variables: APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, or APPWRITE_API_KEY");
      }

      const url = `${endpoint}/v1/databases/${databaseId}/collections/${collectionId}/documents`;
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Key": apiKey,
          "X-Appwrite-Project": projectId,
        },
        body: JSON.stringify({
          documentId,
          data,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error("Appwrite API Error:", error);
        throw new Error(error.message || "Failed to create document");
      }
      
      return response.json();
    },
  } as any;
};

export const createAdminStorage = () => {
  return {
    createFile: async (bucketId: string, fileId: string, file: File) => {
      const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
      const apiKey = process.env.APPWRITE_API_KEY;

      if (!endpoint || !projectId || !apiKey) {
        throw new Error("Missing required environment variables for admin storage access");
      }

      const formData = new FormData();
      formData.append("fileId", fileId);
      formData.append("file", file);
      
      const url = `${endpoint}/v1/storage/buckets/${bucketId}/files`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "X-Appwrite-Key": apiKey,
          "X-Appwrite-Project": projectId,
        },
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error("Appwrite Storage Error:", error);
        throw new Error(error.message || "Failed to upload file");
      }
      
      return response.json();
    },
  } as any;
};

// Export configuration
export const APPWRITE_CONFIG = {
  endpoint: process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!,
  projectId: process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!,
  databaseId: process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
  projectsCollectionId: "projects", // Make sure this matches your Appwrite collection ID
  eventsCollectionId: "events",
  registrationsCollectionId: "registrations",
  bucketId: process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID!,
};

export { ID };

// Auth service functions
export const authService = {
  // Create a new account
  async createAccount(email: string, password: string, name: string) {
    try {
      const userAccount = await account.create(ID.unique(), email, password, name);
      if (userAccount) {
        return this.login(email, password);
      }
      return userAccount;
    } catch (error) {
      throw error;
    }
  },

  // Login
  async login(email: string, password: string) {
    try {
      return await account.createEmailSession(email, password);
    } catch (error) {
      throw error;
    }
  },

  // Google OAuth Login
  loginWithGoogle() {
    try {
      const successUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback`
        : '/auth/callback';
      
      const failureUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/login`
        : '/login';

      account.createOAuth2Session(
        "google" as any,
        successUrl,
        failureUrl
      );
    } catch (error) {
      console.error("Google OAuth error:", error);
      throw error;
    }
  },

  // GitHub OAuth Login
  loginWithGitHub() {
    try {
      const successUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback`
        : '/auth/callback';
      
      const failureUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/login`
        : '/login';

      account.createOAuth2Session(
        "github" as any,
        successUrl,
        failureUrl
      );
    } catch (error) {
      console.error("GitHub OAuth error:", error);
      throw error;
    }
  },

  // Get current user
  async getCurrentUser() {
    try {
      return await account.get();
    } catch (error) {
      return null;
    }
  },

  // Logout
  async logout() {
    try {
      return await account.deleteSession("current");
    } catch (error) {
      throw error;
    }
  },

  // Phone verification
  async createPhoneVerification() {
    try {
      return await account.createPhoneVerification();
    } catch (error) {
      throw error;
    }
  },

  async updatePhoneVerification(userId: string, secret: string) {
    try {
      return await account.updatePhoneVerification(userId, secret);
    } catch (error) {
      throw error;
    }
  },

  async updatePhone(phone: string, password: string) {
    try {
      return await account.updatePhone(phone, password);
    } catch (error) {
      throw error;
    }
  },
};