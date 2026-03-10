// lib/events/post-event/feedback.ts
// ═══════════════════════════════════════════════════════
// Feedback module that ties the existing feedback system
// to the event type-driven architecture.
// ═══════════════════════════════════════════════════════

import { EventType } from "../types";
import { getFeedbackConfig } from "./configs";
import type { FeedbackConfig, FeedbackExtraQuestion } from "./types";
import {
  DEFAULT_FEEDBACK_QUESTIONS,
  QUICK_FEEDBACK_QUESTIONS,
  ADVANCED_FEEDBACK_QUESTIONS,
  type FeedbackQuestion,
} from "@/lib/eventFeedback";

/**
 * Get the full set of feedback questions for an event type.
 * Combines the base question set with any extra type-specific questions.
 */
export function getFeedbackQuestions(
  eventType: EventType
): FeedbackQuestion[] {
  const config = getFeedbackConfig(eventType);

  // Select base question set
  let baseQuestions: FeedbackQuestion[];
  switch (config.questionSet) {
    case "quick":
      baseQuestions = QUICK_FEEDBACK_QUESTIONS;
      break;
    case "advanced":
      baseQuestions = ADVANCED_FEEDBACK_QUESTIONS;
      break;
    default:
      baseQuestions = DEFAULT_FEEDBACK_QUESTIONS;
  }

  // Append type-specific extra questions
  if (config.extraQuestions && config.extraQuestions.length > 0) {
    const extras: FeedbackQuestion[] = config.extraQuestions.map((eq) => ({
      id: eq.id,
      question: eq.question,
      type: (eq.type === "rating" ? "rating" : eq.type === "select" ? "multiple-choice" : "text") as FeedbackQuestion["type"],
      required: eq.required,
      options: eq.options,
    }));
    return [...baseQuestions, ...extras];
  }

  return baseQuestions;
}

/**
 * Check whether feedback should be auto-emailed for this event type.
 */
export function shouldAutoSendFeedback(eventType: EventType): boolean {
  return getFeedbackConfig(eventType).autoSendEmail;
}

/**
 * Get the delay (in ms) before sending feedback email after event end.
 */
export function getFeedbackEmailDelay(eventType: EventType): number {
  const hours = getFeedbackConfig(eventType).emailDelayHours;
  return hours * 60 * 60 * 1000;
}

/**
 * Check whether anonymous feedback is permitted for this event type.
 */
export function isAnonymousFeedbackAllowed(eventType: EventType): boolean {
  return getFeedbackConfig(eventType).allowAnonymous;
}
