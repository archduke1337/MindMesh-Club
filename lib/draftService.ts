// lib/draftService.ts
import { Blog } from "./blog";

type BlogDraftData = Partial<Omit<Blog, "$id" | "$createdAt" | "$updatedAt">> & {
  savedAt?: string;
};

const DRAFT_KEY_PREFIX = "blog_draft_";
const DRAFT_AUTO_SAVE_INTERVAL = 30000; // 30 seconds

export const draftService = {
  // Save draft to localStorage
  saveDraft(formData: BlogDraftData): void {
    try {
      const timestamp = new Date().toISOString();
      const draft: BlogDraftData = {
        ...formData,
        savedAt: timestamp,
      };
      localStorage.setItem(DRAFT_KEY_PREFIX + "current", JSON.stringify(draft));
    } catch (error) {
      console.error("Error saving draft:", error);
    }
  },

  // Load draft from localStorage
  loadDraft(): BlogDraftData | null {
    try {
      const draft = localStorage.getItem(DRAFT_KEY_PREFIX + "current");
      return draft ? JSON.parse(draft) : null;
    } catch (error) {
      console.error("Error loading draft:", error);
      return null;
    }
  },

  // Check if draft exists
  hasDraft(): boolean {
    try {
      return !!localStorage.getItem(DRAFT_KEY_PREFIX + "current");
    } catch {
      return false;
    }
  },

  // Clear draft
  clearDraft(): void {
    try {
      localStorage.removeItem(DRAFT_KEY_PREFIX + "current");
    } catch (error) {
      console.error("Error clearing draft:", error);
    }
  },

  // Get draft timestamp
  getDraftTimestamp(): string | null {
    try {
      const draft = this.loadDraft();
      return draft?.savedAt || null;
    } catch {
      return null;
    }
  },

  // Get all drafts (for future recovery interface)
  getAllDrafts(): BlogDraftData[] {
    try {
      const drafts = [];
      for (let key in localStorage) {
        if (key.startsWith(DRAFT_KEY_PREFIX) && key !== DRAFT_KEY_PREFIX + "current") {
          const draft = localStorage.getItem(key);
          if (draft) {
            drafts.push(JSON.parse(draft));
          }
        }
      }
      return drafts;
    } catch {
      return [];
    }
  },
};
