// lib/events/features/index.ts
// Barrel export for the feature modules

export type {
  FeatureModule,
  FeatureSettings,
  CheckInRecord,
  AttendanceRecord,
} from "./types";

export {
  getFeatureLabel,
  getFeatureSettings,
  getActiveFeatures,
} from "./feature-resolver";

export {
  processCheckIn,
  getCheckInStats,
} from "./checkIn";

export type {
  SubmissionContext,
  SubmissionField,
} from "./submissions";

export {
  getSubmissionContext,
} from "./submissions";
