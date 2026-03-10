// lib/events/post-event/index.ts
// ═══════════════════════════════════════════════════════
// Barrel export for post-event modules
// ═══════════════════════════════════════════════════════

export * from "./types";
export {
  getPostEventConfig,
  getResultsConfig,
  getCertificateConfig,
  getFeedbackConfig,
  getGalleryConfig,
  getResourceSharingConfig,
} from "./configs";
export {
  computeRankingsFromScores,
  groupByCategory,
  buildEventResults,
  publishResults,
  getResultsLabel,
} from "./results";
export {
  isEligibleForCertificate,
  buildCertificate,
  buildParticipationCertificates,
  buildWinnerCertificates,
} from "./certificates";
export {
  getFeedbackQuestions,
  shouldAutoSendFeedback,
  getFeedbackEmailDelay,
  isAnonymousFeedbackAllowed,
} from "./feedback";
