// lib/events/features/submissions.ts
// ═══════════════════════════════════════════════════════
// Type-aware submissions module
// Adapts submission behavior based on event type context
// (hackathon project vs bootcamp assignment vs challenge daily)
// ═══════════════════════════════════════════════════════

import { EventType } from "../types";
import { getEventTypeConfig } from "../registry";
import { getFeatureLabel } from "./feature-resolver";

/**
 * Submission context — how submissions work for each event type.
 */
export interface SubmissionContext {
  eventType: EventType;
  label: string;
  isTeamBased: boolean;
  allowMultiple: boolean;       // can submit multiple times?
  hasDeadline: boolean;
  hasFileUpload: boolean;
  hasLinkSubmit: boolean;
  hasCodePaste: boolean;
  requiresReview: boolean;      // admin must review?
  autoScore: boolean;           // auto-graded?
  fields: SubmissionField[];    // extra fields for this type
}

export interface SubmissionField {
  name: string;
  label: string;
  type: "text" | "textarea" | "url" | "file" | "select";
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

/**
 * Get submission context for an event type.
 * Returns how submissions should behave.
 */
export function getSubmissionContext(eventType: EventType): SubmissionContext {
  const config = getEventTypeConfig(eventType);

  if (!config.features.submissions) {
    throw new Error(`${config.label} events do not support submissions`);
  }

  const contexts: Partial<Record<EventType, SubmissionContext>> = {
    hackathon: {
      eventType: "hackathon",
      label: getFeatureLabel("submissions", "hackathon"),
      isTeamBased: true,
      allowMultiple: false,
      hasDeadline: true,
      hasFileUpload: true,
      hasLinkSubmit: true,
      hasCodePaste: false,
      requiresReview: true,
      autoScore: false,
      fields: [
        { name: "projectTitle", label: "Project Title", type: "text", required: true, placeholder: "Name of your project" },
        { name: "description", label: "Description", type: "textarea", required: true, placeholder: "What does your project do?" },
        { name: "repoUrl", label: "GitHub Repository", type: "url", required: true, placeholder: "https://github.com/..." },
        { name: "demoUrl", label: "Demo / Video Link", type: "url", required: false, placeholder: "https://..." },
        { name: "presentationUrl", label: "Presentation / Slides", type: "url", required: false, placeholder: "https://..." },
        { name: "techStack", label: "Tech Stack", type: "text", required: true, placeholder: "React, Node.js, MongoDB..." },
      ],
    },

    competition: {
      eventType: "competition",
      label: getFeatureLabel("submissions", "competition"),
      isTeamBased: false,
      allowMultiple: true,        // multiple rounds
      hasDeadline: true,
      hasFileUpload: true,
      hasLinkSubmit: true,
      hasCodePaste: true,
      requiresReview: false,
      autoScore: true,
      fields: [
        { name: "solutionUrl", label: "Solution Link", type: "url", required: false, placeholder: "https://..." },
      ],
    },

    bootcamp: {
      eventType: "bootcamp",
      label: getFeatureLabel("submissions", "bootcamp"),
      isTeamBased: false,
      allowMultiple: true,        // multiple assignments
      hasDeadline: true,
      hasFileUpload: true,
      hasLinkSubmit: true,
      hasCodePaste: false,
      requiresReview: true,
      autoScore: false,
      fields: [
        { name: "assignmentNumber", label: "Assignment #", type: "text", required: true, placeholder: "1" },
        { name: "repoUrl", label: "Repository / Link", type: "url", required: true, placeholder: "https://..." },
        { name: "notes", label: "Notes for Instructor", type: "textarea", required: false, placeholder: "Any challenges or questions..." },
      ],
    },

    drive: {
      eventType: "drive",
      label: getFeatureLabel("submissions", "drive"),
      isTeamBased: false,
      allowMultiple: false,
      hasDeadline: true,
      hasFileUpload: true,
      hasLinkSubmit: true,
      hasCodePaste: false,
      requiresReview: true,
      autoScore: false,
      fields: [
        { name: "taskUrl", label: "Task Submission Link", type: "url", required: true, placeholder: "https://..." },
        { name: "notes", label: "Additional Notes", type: "textarea", required: false },
      ],
    },

    challenge: {
      eventType: "challenge",
      label: getFeatureLabel("submissions", "challenge"),
      isTeamBased: false,
      allowMultiple: true,        // daily/weekly submissions
      hasDeadline: false,         // rolling
      hasFileUpload: false,
      hasLinkSubmit: true,
      hasCodePaste: true,
      requiresReview: false,
      autoScore: true,
      fields: [
        { name: "problemId", label: "Problem / Day Number", type: "text", required: true, placeholder: "Day 1" },
        { name: "solutionUrl", label: "Solution Link", type: "url", required: true, placeholder: "https://..." },
      ],
    },

    exhibition: {
      eventType: "exhibition",
      label: getFeatureLabel("submissions", "exhibition"),
      isTeamBased: true,
      allowMultiple: false,
      hasDeadline: true,
      hasFileUpload: true,
      hasLinkSubmit: true,
      hasCodePaste: false,
      requiresReview: true,
      autoScore: false,
      fields: [
        { name: "projectTitle", label: "Project Title", type: "text", required: true },
        { name: "abstract", label: "Project Abstract", type: "textarea", required: true },
        { name: "repoUrl", label: "Repository", type: "url", required: false },
        { name: "demoUrl", label: "Demo Link", type: "url", required: false },
        { name: "posterUrl", label: "Poster / Presentation", type: "url", required: false },
      ],
    },
  };

  return (
    contexts[eventType] || {
      eventType,
      label: "Submissions",
      isTeamBased: false,
      allowMultiple: false,
      hasDeadline: true,
      hasFileUpload: true,
      hasLinkSubmit: true,
      hasCodePaste: false,
      requiresReview: true,
      autoScore: false,
      fields: [],
    }
  );
}
