// lib/eventStorageManager.ts
// Centralized localStorage management for events

const SAVED_EVENTS_KEY = 'savedEvents';
const REGISTERED_EVENTS_KEY = 'registeredEvents';
const TICKET_PREFIX = 'ticket_';

export interface StoredTicket {
  ticketId: string;
  eventId: string;
  eventTitle: string;
  userName: string;
  userEmail: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  registeredAt: string;
}

/**
 * Event Storage Manager - centralized localStorage management
 * Handles saving/loading events and tickets to/from browser storage
 */
export const eventStorageManager = {
  // ============ Saved Events ============
  getSavedEvents(): string[] {
    try {
      const saved = localStorage.getItem(SAVED_EVENTS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.warn('Error reading saved events from localStorage:', error);
      return [];
    }
  },

  setSavedEvents(eventIds: string[]): void {
    try {
      localStorage.setItem(SAVED_EVENTS_KEY, JSON.stringify(eventIds));
    } catch (error) {
      console.warn('Error writing saved events to localStorage:', error);
    }
  },

  toggleSavedEvent(eventId: string): boolean {
    const saved = this.getSavedEvents();
    const isSaved = saved.includes(eventId);
    
    const updated = isSaved
      ? saved.filter(id => id !== eventId)
      : [...saved, eventId];
    
    this.setSavedEvents(updated);
    return !isSaved;
  },

  isSaved(eventId: string): boolean {
    const saved = this.getSavedEvents();
    return saved.includes(eventId);
  },

  // ============ Registered Events ============
  getRegisteredEvents(): string[] {
    try {
      const registered = localStorage.getItem(REGISTERED_EVENTS_KEY);
      return registered ? JSON.parse(registered) : [];
    } catch (error) {
      console.warn('Error reading registered events from localStorage:', error);
      return [];
    }
  },

  setRegisteredEvents(eventIds: string[]): void {
    try {
      localStorage.setItem(REGISTERED_EVENTS_KEY, JSON.stringify(eventIds));
    } catch (error) {
      console.warn('Error writing registered events to localStorage:', error);
    }
  },

  addRegisteredEvent(eventId: string): void {
    const registered = this.getRegisteredEvents();
    if (!registered.includes(eventId)) {
      this.setRegisteredEvents([...registered, eventId]);
    }
  },

  removeRegisteredEvent(eventId: string): void {
    const registered = this.getRegisteredEvents();
    this.setRegisteredEvents(registered.filter(id => id !== eventId));
  },

  isRegistered(eventId: string): boolean {
    const registered = this.getRegisteredEvents();
    return registered.includes(eventId);
  },

  // ============ Tickets ============
  getTicket(eventId: string): StoredTicket | null {
    try {
      const ticket = localStorage.getItem(`${TICKET_PREFIX}${eventId}`);
      return ticket ? JSON.parse(ticket) : null;
    } catch (error) {
      console.warn(`Error reading ticket for event ${eventId}:`, error);
      return null;
    }
  },

  setTicket(eventId: string, ticket: StoredTicket): void {
    try {
      localStorage.setItem(`${TICKET_PREFIX}${eventId}`, JSON.stringify(ticket));
    } catch (error) {
      console.warn(`Error writing ticket for event ${eventId}:`, error);
    }
  },

  deleteTicket(eventId: string): void {
    try {
      localStorage.removeItem(`${TICKET_PREFIX}${eventId}`);
    } catch (error) {
      console.warn(`Error deleting ticket for event ${eventId}:`, error);
    }
  },

  // ============ Batch Operations ============
  clearAllEventData(): void {
    try {
      localStorage.removeItem(SAVED_EVENTS_KEY);
      localStorage.removeItem(REGISTERED_EVENTS_KEY);
      
      // Clear all tickets
      const registered = this.getRegisteredEvents();
      registered.forEach(eventId => {
        this.deleteTicket(eventId);
      });
    } catch (error) {
      console.warn('Error clearing event data:', error);
    }
  },

  // ============ Sync Operations ============
  /**
   * Merge database registrations with localStorage
   * Returns deduplicated list of registered event IDs
   */
  syncRegistrations(dbRegistrations: string[]): string[] {
    const localRegistrations = this.getRegisteredEvents();
    const merged = Array.from(new Set([...localRegistrations, ...dbRegistrations]));
    this.setRegisteredEvents(merged);
    return merged;
  },
};
