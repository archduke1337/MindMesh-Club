// lib/events/registration/index.ts
// Barrel export for the registration system

export type {
  BaseRegistrationInput,
  IndividualRegistrationInput,
  TeamRegistrationInput,
  TeamJoinInput,
  ApplicationRegistrationInput,
  RSVPRegistrationInput,
  DualRegistrationInput,
  FestPassRegistrationInput,
  RollingRegistrationInput,
  RegistrationInput,
  RegistrationResult,
  RegistrationHandler,
  EventContext,
} from "./types";

export {
  registerForEvent,
  cancelRegistration,
  getRegistrationHandler,
  getRegistrationModel,
  supportsTeamJoin,
} from "./orchestrator";

export {
  approveApplication,
  rejectApplication,
} from "./handlers/application.handler";

export { REGISTRATION_SCHEMAS } from "./schemas";
