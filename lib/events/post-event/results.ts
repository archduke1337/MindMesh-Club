// lib/events/post-event/results.ts
// ═══════════════════════════════════════════════════════
// Results publishing module.
// Handles result computation from judging scores,
// manual entry, and publishing for each event type.
// ═══════════════════════════════════════════════════════

import { EventType } from "../types";
import { getResultsConfig } from "./configs";
import type { ResultEntry, EventResults } from "./types";

/**
 * Compute rankings from raw judge scores.
 * Used when resultsConfig.sourceFromJudging = true.
 */
export function computeRankingsFromScores(
  scores: Array<{
    participantId: string;
    participantName: string;
    teamId?: string;
    teamName?: string;
    totalScore: number;
    category?: string;
  }>
): ResultEntry[] {
  // Sort by score descending
  const sorted = [...scores].sort((a, b) => b.totalScore - a.totalScore);

  return sorted.map((entry, index) => ({
    rank: index + 1,
    participantId: entry.participantId,
    participantName: entry.participantName,
    teamId: entry.teamId,
    teamName: entry.teamName,
    score: entry.totalScore,
    category: entry.category,
  }));
}

/**
 * Group rankings by category for events with category winners.
 */
export function groupByCategory(
  rankings: ResultEntry[]
): Record<string, ResultEntry[]> {
  const grouped: Record<string, ResultEntry[]> = {};

  for (const entry of rankings) {
    const cat = entry.category || "general";
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(entry);
  }

  // Re-rank within each category
  for (const cat of Object.keys(grouped)) {
    grouped[cat].sort((a, b) => (a.score ?? 0) - (b.score ?? 0) * -1);
    grouped[cat].forEach((e, i) => (e.rank = i + 1));
  }

  return grouped;
}

/**
 * Build a complete EventResults object ready for storage.
 */
export function buildEventResults(
  eventId: string,
  eventType: EventType,
  rankings: ResultEntry[],
  summary?: string
): EventResults {
  const config = getResultsConfig(eventType);

  const results: EventResults = {
    eventId,
    eventType,
    isPublished: false,
    rankings,
    summary,
  };

  if (config.hasCategoryWinners) {
    results.categoryWinners = groupByCategory(rankings);
  }

  return results;
}

/**
 * Mark results as published. Returns updated results object.
 */
export function publishResults(results: EventResults): EventResults {
  return {
    ...results,
    isPublished: true,
    publishedAt: new Date().toISOString(),
  };
}

/**
 * Get display-friendly label for results based on event type.
 */
export function getResultsLabel(eventType: EventType): string {
  return getResultsConfig(eventType).resultLabel;
}
