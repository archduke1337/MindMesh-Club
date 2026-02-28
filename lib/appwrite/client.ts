// lib/appwrite/client.ts
/**
 * Client-side (browser) Appwrite SDK initialisation.
 * Uses the `appwrite` web SDK — safe for "use client" components.
 *
 * This replaces the auth / client parts of the old monolithic lib/appwrite.ts.
 */
import { Client, Account, Databases, Storage, ID, OAuthProvider } from "appwrite";

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export { ID, OAuthProvider };

// ── Auth service ────────────────────────────────────────

export const authService = {
  async createAccount(email: string, password: string, name: string) {
    const userAccount = await account.create(ID.unique(), email, password, name);
    if (userAccount) {
      return this.login(email, password);
    }
    return userAccount;
  },

  async login(email: string, password: string) {
    return await account.createEmailPasswordSession(email, password);
  },

  loginWithGoogle() {
    const successUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : "/auth/callback";
    const failureUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/login`
        : "/login";

    account.createOAuth2Token(OAuthProvider.Google, successUrl, failureUrl);
  },

  loginWithGitHub() {
    const successUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback`
        : "/auth/callback";
    const failureUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/login`
        : "/login";

    account.createOAuth2Token(OAuthProvider.Github, successUrl, failureUrl);
  },

  async getCurrentUser() {
    try {
      return await account.get();
    } catch {
      return null;
    }
  },

  async logout() {
    return await account.deleteSession("current");
  },

  async createPhoneVerification(phone?: string) {
    return await account.createPhoneToken(ID.unique(), phone || "");
  },

  async updatePhoneVerification(userId: string, secret: string) {
    return await account.updatePhoneSession(userId, secret);
  },

  async updatePhone(phone: string, password: string) {
    return await account.updatePhone(phone, password);
  },
};
