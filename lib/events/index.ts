// lib/events/index.ts
// Barrel export for the event type-driven architecture

// Core types
export * from "./types";

// Registry & helpers
export {
  getEventTypeConfig,
  getAllEventTypeConfigs,
  getAllEventTypes,
  isValidEventType,
  getEventTypesByFeature,
  eventTypeHasFeature,
  getEnabledFeatures,
  getEventTypesByRegistrationModel,
  getApprovalRequiredTypes,
  getTeamEnabledTypes,
  getEventTypesByTicketTemplate,
  getEventTypeOptions,
  getDetailSections,
  getAdminTabs,
  getRegistrationFields,
  getExtraEventFields,
} from "./registry";

// Individual configs (for direct access when needed)
export { hackathonConfig } from "./types/hackathon.config";
export { competitionConfig } from "./types/competition.config";
export { workshopConfig } from "./types/workshop.config";
export { talkConfig } from "./types/talk.config";
export { bootcampConfig } from "./types/bootcamp.config";
export { exhibitionConfig } from "./types/exhibition.config";
export { socialConfig } from "./types/social.config";
export { festConfig } from "./types/fest.config";
export { webinarConfig } from "./types/webinar.config";
export { driveConfig } from "./types/drive.config";
export { challengeConfig } from "./types/challenge.config";

// Post-event modules
export {
  getPostEventConfig,
  getResultsConfig,
  getCertificateConfig,
  getFeedbackConfig,
  getGalleryConfig,
  getResourceSharingConfig,
  computeRankingsFromScores,
  buildEventResults,
  publishResults,
  getResultsLabel,
  isEligibleForCertificate,
  buildCertificate,
  buildParticipationCertificates,
  buildWinnerCertificates,
  getFeedbackQuestions,
  shouldAutoSendFeedback,
  getFeedbackEmailDelay,
  isAnonymousFeedbackAllowed,
} from "./post-event";
