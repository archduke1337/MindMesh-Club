// lib/events/features/types.ts
// ═══════════════════════════════════════════════════════
// Feature module types
// Features are reusable capabilities that event types
// can enable/disable via their config
// ═══════════════════════════════════════════════════════

import { EventType, EventFeatureFlags } from "../types";

/**
 * Feature module interface — each feature implements this
 */
export interface FeatureModule {
  name: keyof EventFeatureFlags;
  label: string;
  description: string;

  /**
   * Check if this feature is available for an event type.
   */
  isEnabled(eventType: EventType): boolean;

  /**
   * Get config/settings specific to this feature for an event type.
   */
  getSettings(eventType: EventType): FeatureSettings;
}

/**
 * Per-event-type feature settings
 */
export interface FeatureSettings {
  enabled: boolean;
  label: string;           // display label for this feature in this context
  adminTab?: string;       // which admin tab shows this feature
  detailSection?: string;  // which detail page section shows this feature
  capabilities: string[];  // what this feature can do for this event type
}

/**
 * Check-in record
 */
export interface CheckInRecord {
  registrationId: string;
  userId: string;
  userName: string;
  checkInTime: string;
  checkInDay?: number;     // for daily check-in (bootcamp)
  checkInType: "individual" | "team" | "daily" | "gate";
}

/**
 * Attendance record
 */
export interface AttendanceRecord {
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  date: string;
  present: boolean;
  checkInTime?: string;
  checkOutTime?: string;
  source: "qr-scan" | "manual" | "auto";
}
