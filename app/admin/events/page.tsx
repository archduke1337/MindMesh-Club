// app/admin/events/page.tsx
"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Switch } from "@heroui/switch";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure } from "@heroui/modal";
import { Table, TableHeader, TableColumn, TableBody, TableRow, TableCell } from "@heroui/table";
import { Chip } from "@heroui/chip";
import { Tabs, Tab } from "@heroui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { eventService, Event, Registration } from "@/lib/database";
import { getErrorMessage } from "@/lib/errorHandler";
import AdminPageWrapper from "@/components/AdminPageWrapper";
import { EVENT_TEMPLATES } from "@/lib/eventTemplates";
import { calculateEventMetrics, getCapacityAlertMessage, estimateFutureRegistrations } from "@/lib/eventAnalytics";
import { generateEventQRCodeUrl, generateEventShareQRCodeUrl } from "@/lib/eventQRCode";
import { downloadEventStatsCSV, downloadRegistrationList } from "@/lib/eventExport";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import { PlusIcon, Pencil, Trash2, Image as ImageIcon, CalendarIcon, MapPinIcon, UsersIcon, DollarSignIcon, TagIcon, StarIcon, CrownIcon, TrendingUpIcon, LinkIcon, AlertCircle, XIcon, QrCode, Download, Share2, RefreshCw, ArrowLeftIcon, SearchIcon, LightbulbIcon, InfoIcon, CheckCircleIcon } from "lucide-react";

export default function AdminEventsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { isOpen: isRegistrationsOpen, onOpen: onRegistrationsOpen, onClose: onRegistrationsClose } = useDisclosure();
  const { isOpen: isAnalyticsOpen, onOpen: onAnalyticsOpen, onClose: onAnalyticsClose } = useDisclosure();
  const { isOpen: isQRShareOpen, onOpen: onQRShareOpen, onClose: onQRShareClose } = useDisclosure();

  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [selectedEventForRegistrations, setSelectedEventForRegistrations] = useState<Event | null>(null);
  const [qrEvent, setQrEvent] = useState<Event | null>(null);
  const [selectedEventForAnalytics, setSelectedEventForAnalytics] = useState<Event | null>(null);
  const [analyticsRegistrations, setAnalyticsRegistrations] = useState<Registration[]>([]);
  const [loadingAnalyticsRegistrations, setLoadingAnalyticsRegistrations] = useState(false);
  const [syncingRegistrations, setSyncingRegistrations] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Check-in state
  const [checkinMode, setCheckinMode] = useState(false);
  const [checkinData, setCheckinData] = useState('');
  const [checkinRecords, setCheckinRecords] = useState<Array<{ id: string; name: string; email: string; time: string; status: 'success' | 'duplicate' | 'error'; }>>([]);
  const [checkinStats, setCheckinStats] = useState({ successful: 0, duplicates: 0, errors: 0 });
  const checkinInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Event>>({
    title: "",
    description: "",
    image: "",
    date: "",
    time: "",
    venue: "",
    location: "",
    category: "conference",
    price: 0,
    discountPrice: null,
    capacity: 50,
    registered: 0,
    organizerName: "",
    organizerAvatar: "",
    tags: [],
    isFeatured: false,
    isPremium: false,
    status: "upcoming",
    isRecurring: false,
    recurringPattern: undefined,
    parentEventId: undefined
  });
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadEvents = useCallback(async () => {
    try {
      setError(null);
      setLoadingEvents(true);
      const allEvents = await eventService.getAllEvents();
      setEvents(allEvents);
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      console.error("Error loading events:", errorMsg);
      setError(`Failed to load events: ${errorMsg}`);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && user) {
      loadEvents();
    }
  }, [user, loading, loadEvents]);

  // Focus check-in input when check-in mode is activated
  useEffect(() => {
    if (checkinMode) {
      setTimeout(() => {
        checkinInputRef.current?.focus();
      }, 100);
    }
  }, [checkinMode]);



  const syncRegistrationsCount = async () => {
    try {
      setSyncingRegistrations(true);
      let totalSynced = 0;

      // For each event, get registrations and update the count
      for (const event of events) {
        try {
          const regs = await eventService.getEventRegistrations(event.$id!);
          const registrationCount = regs.length;

          // Update event registered count if it doesn't match
          if (event.registered !== registrationCount) {
            await eventService.updateEvent(event.$id!, {
              ...event,
              registered: registrationCount
            });
            totalSynced++;
            console.log(`✅ Synced ${event.title}: ${registrationCount} registrations`);
          }
        } catch (err) {
          console.warn(`⚠️ Failed to sync ${event.title}:`, err);
        }
      }

      // Reload events to show updated counts
      await loadEvents();
      showToast(`Synced ${totalSynced} events with latest registration counts`, 'success');
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      console.error("Error syncing registrations:", errorMsg);
      showToast(`Failed to sync registrations: ${errorMsg}`, 'error');
    } finally {
      setSyncingRegistrations(false);
    }
  };

  const handleInputChange = (field: keyof Event, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && formData.tags && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(t => t !== tag)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.image || !formData.image.startsWith('http')) {
      showToast("Please enter a valid image URL (must start with http:// or https://)", 'error');
      return;
    }

    if (!formData.organizerAvatar || !formData.organizerAvatar.startsWith('http')) {
      showToast("Please enter a valid organizer avatar URL (must start with http:// or https://)", 'error');
      return;
    }

    setSubmitting(true);

    try {
      if (editingEvent) {
        await eventService.updateEvent(editingEvent.$id!, formData);
      } else {
        const newEvent = await eventService.createEvent(formData as Omit<Event, '$id' | '$createdAt' | '$updatedAt'>);
        
        // Handle recurring events creation
        if (formData.isRecurring && formData.recurringPattern && formData.date) {
          const baseDate = new Date(formData.date);
          const parentId = newEvent.$id;
          const extraEvents = 4; // Generate next 4 instances
          
          for (let i = 1; i <= extraEvents; i++) {
            const nextDate = new Date(baseDate);
            if (formData.recurringPattern === "weekly") {
              nextDate.setDate(nextDate.getDate() + (7 * i));
            } else if (formData.recurringPattern === "biweekly") {
              nextDate.setDate(nextDate.getDate() + (14 * i));
            } else if (formData.recurringPattern === "monthly") {
              nextDate.setMonth(nextDate.getMonth() + i);
            } else if (formData.recurringPattern === "quarterly") {
              nextDate.setMonth(nextDate.getMonth() + (3 * i));
            }
            
            const newDateStr = nextDate.toISOString().split("T")[0];
            const recurData = {
              ...formData,
              date: newDateStr,
              parentEventId: parentId,
              isRecurring: false,
              recurringPattern: undefined
            };
            await eventService.createEvent(recurData as Omit<Event, '$id' | '$createdAt' | '$updatedAt'>);
          }
        }
      }

      await loadEvents();
      handleCloseModal();
      showToast(editingEvent ? "Event updated successfully!" : "Event created successfully!", 'success');
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("Error saving event:", message);
      showToast(message || "Failed to save event", 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData(event);
    onOpen();
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;

    setDeletingId(eventId);
    try {
      const res = await fetch("/api/admin/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete event");
      }
      await loadEvents();
      showToast("Event deleted successfully!", 'success');
    } catch (error) {
      console.error("Error deleting event:", error);
      showToast(getErrorMessage(error), 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewRegistrations = async (event: Event) => {
    setSelectedEventForRegistrations(event);
    setLoadingRegistrations(true);
    setCheckinMode(false);
    setCheckinRecords([]);
    setCheckinStats({ successful: 0, duplicates: 0, errors: 0 });
    try {
      const regs = await eventService.getEventRegistrations(event.$id!);
      setRegistrations(regs);
    } catch (err) {
      console.error("Error loading registrations:", err);
      showToast("Failed to load registrations", 'error');
    } finally {
      setLoadingRegistrations(false);
    }
    onRegistrationsOpen();
  };

  const parseCheckInQR = (data: string) => {
    // Format: TICKET|{registrationId}|{userName}|{eventTitle}
    // Split only on first 3 pipes to allow event titles with pipes
    const parts = data.split('|');
    if (parts[0] === 'TICKET' && parts.length >= 4) {
      const eventTitle = parts.slice(3).join('|'); // Join remaining parts for titles with pipes
      return {
        ticketId: parts[1],
        userName: parts[2],
        eventTitle: eventTitle,
      };
    }
    return null;
  };

  const handleCheckinScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const data = checkinData.trim();
      if (!data) return;

      console.log('🔍 Scanned QR data:', data);
      const parsed = parseCheckInQR(data);
      console.log('📋 Parsed QR:', parsed);

      if (!parsed) {
        console.warn('❌ Failed to parse QR code');
        const record = {
          id: 'INVALID',
          name: 'Invalid QR Code',
          email: 'unknown',
          time: new Date().toLocaleTimeString(),
          status: 'error' as const,
        };
        setCheckinRecords([record, ...checkinRecords]);
        setCheckinStats(prev => ({ ...prev, errors: prev.errors + 1 }));
        setCheckinData('');
        return;
      }

      // Find registration by ticket ID (registration document ID)
      const registration = registrations.find(r => r.$id === parsed.ticketId);
      console.log('🎫 Found registration:', registration);

      if (!registration) {
        console.warn('❌ Registration not found for ticket:', parsed.ticketId);
        const record = {
          id: parsed.ticketId,
          name: parsed.userName,
          email: 'not found',
          time: new Date().toLocaleTimeString(),
          status: 'error' as const,
        };
        setCheckinRecords([record, ...checkinRecords]);
        setCheckinStats(prev => ({ ...prev, errors: prev.errors + 1 }));
        setCheckinData('');
        return;
      }

      // Check for duplicates
      const isDuplicate = checkinRecords.some(
        r => r.id === parsed.ticketId && r.status === 'success'
      ) || registration.status === "checked_in";

      let status: 'duplicate' | 'success' | 'error' = isDuplicate ? 'duplicate' : 'success';
      
      if (!isDuplicate) {
        try {
          // Update DB with check-in timestamp and status
          await eventService.updateRegistrationStatus(registration.$id!, "checked_in");
          
          // Update local state registrations to prevent subsequent scans from passing as "not duplicate"
          // if we reset checkin history
          setRegistrations(prev => prev.map(r => 
            r.$id === registration.$id ? { ...r, status: "checked_in", checkInTime: new Date().toISOString() } : r
          ));
        } catch (err) {
          console.error("Failed to commit checkin to DB", err);
          showToast("Failed to save check-in to database", "error");
          status = 'error';
        }
      }

      const record = {
        id: parsed.ticketId,
        name: registration.userName,
        email: registration.userEmail,
        time: new Date().toLocaleTimeString(),
        status,
      };

      console.log('✅ Check-in record:', record);
      setCheckinRecords([record, ...checkinRecords]);
      if (status === 'duplicate') {
        console.warn('⚠️ Duplicate scan detected');
        setCheckinStats(prev => ({ ...prev, duplicates: prev.duplicates + 1 }));
      } else if (status === 'success') {
        console.log('✓ Successful check-in');
        setCheckinStats(prev => ({ ...prev, successful: prev.successful + 1 }));
      } else {
        setCheckinStats(prev => ({ ...prev, errors: prev.errors + 1 }));
      }

      setCheckinData('');
    }
  };

  const handleResetCheckin = () => {
    setCheckinRecords([]);
    setCheckinStats({ successful: 0, duplicates: 0, errors: 0 });
    setCheckinData('');
    // Focus input after reset
    setTimeout(() => {
      checkinInputRef.current?.focus();
    }, 0);
  };

  const getQRCodeUrl = (registrationId: string) => {
    if (!selectedEventForRegistrations) return '';
    const registration = registrations.find(r => r.$id === registrationId);
    if (!registration) return '';

    // Use stored QR data if available, otherwise generate it
    let ticketData = registration.ticketQRData;
    if (!ticketData) {
      // Fallback to generating on-the-fly if not stored
      ticketData = `TICKET | ${registrationId}| ${registration.userName}| ${selectedEventForRegistrations.title} `;
    }

    const encoded = encodeURIComponent(ticketData);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;
  };

  const downloadTicketQR = async (registrationId: string) => {
    const qrUrl = getQRCodeUrl(registrationId);
    if (!qrUrl) return;

    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const registration = registrations.find(r => r.$id === registrationId);
      a.download = `${registration?.userName || 'ticket'}-qr.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      showToast('Failed to download QR code', 'error');
    }
  };

  const handleDeletePastEvents = async () => {
    if (!confirm("Are you sure you want to delete all past events?")) return;

    try {
      const res = await fetch("/api/admin/events", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deletePast: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to delete past events");
      }
      const data = await res.json();
      await loadEvents();
      showToast(`${data.deleted} past events deleted successfully!`, 'success');
    } catch (error) {
      console.error("Error deleting past events:", error);
      showToast(getErrorMessage(error), 'error');
    }
  };

  const handleCloseModal = () => {
    setEditingEvent(null);
    setFormData({
      title: "",
      description: "",
      image: "",
      date: "",
      time: "",
      venue: "",
      location: "",
      category: "conference",
      price: 0,
      discountPrice: null,
      capacity: 50,
      registered: 0,
      organizerName: "",
      organizerAvatar: "",
      tags: [],
      isFeatured: false,
      isPremium: false,
      status: "upcoming",
      isRecurring: false,
      recurringPattern: undefined,
      parentEventId: undefined
    });
    setTagInput("");
    setShowTemplateSelector(false);
    onClose();
  };

  const handleApplyTemplate = (templateId: string) => {
    const template = EVENT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        ...template.defaultEvent,
        title: prev.title || template.defaultEvent.title, // Keep user's title if already entered
      }));
      setShowTemplateSelector(false);
    }
  };

  const handleViewQRCode = (event: Event) => {
    setQrEvent(event);
    onQRShareOpen();
  };

  const handleViewAnalytics = async (event: Event) => {
    setSelectedEventForAnalytics(event);
    setLoadingAnalyticsRegistrations(true);
    try {
      const regs = await eventService.getEventRegistrations(event.$id!);
      setAnalyticsRegistrations(regs);
    } catch (err) {
      console.error("Error loading analytics registrations:", err);
      setAnalyticsRegistrations([]);
    } finally {
      setLoadingAnalyticsRegistrations(false);
    }
    onAnalyticsOpen();
  };

  if (loading) {
    return (
      <AdminPageWrapper title="Event Management" description="Loading...">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper
      title="Event Management"
      description="Create, edit, and manage all events"
    >
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-right transition-all max-w-sm ${
          toast.type === 'success' ? 'bg-success-50 dark:bg-success-950/80 border border-success-200 dark:border-success-800 text-success-800 dark:text-success-200'
          : toast.type === 'error' ? 'bg-danger-50 dark:bg-danger-950/80 border border-danger-200 dark:border-danger-800 text-danger-800 dark:text-danger-200'
          : 'bg-primary-50 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800 text-primary-800 dark:text-primary-200'
        }`}>
          {toast.type === 'success' && <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 flex-shrink-0" />}
          {toast.type === 'info' && <InfoIcon className="w-4 h-4 flex-shrink-0" />}
          <span className="text-sm font-medium">{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100"><XIcon className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Back Button */}
      <Button
        variant="light"
        startContent={<ArrowLeftIcon className="w-4 h-4" />}
        onPress={() => router.push("/admin")}
        className="mb-4"
      >
        Back to Admin
      </Button>

      {error && (
        <Card className="mb-6 border-none bg-danger-50 dark:bg-danger-950/30">
          <CardBody className="gap-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-danger">Error</p>
                <p className="text-sm text-default-500">{error}</p>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Search & Filter Row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <Input
          placeholder="Search events..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<SearchIcon className="w-4 h-4 text-default-400" />}
          className="w-full sm:max-w-xs"
          size="sm"
          isClearable
          onClear={() => setSearchQuery("")} variant="bordered"
        />
        <div className="flex flex-wrap gap-1.5">
          {["all", "upcoming", "ongoing", "completed", "cancelled"].map((s) => (
            <Button key={s} size="sm" variant={statusFilter === s ? "solid" : "flat"}
              color={statusFilter === s ? "primary" : "default"}
              onPress={() => setStatusFilter(s)} className="capitalize"
            >{s}</Button>
          ))}
        </div>
      </div>

      {/* Controls Section */}
      <div className="flex flex-col sm:flex-row gap-2 w-full mb-6 md:mb-8">
        <Button
          color="warning"
          variant="flat"
          onPress={syncRegistrationsCount}
          isLoading={syncingRegistrations}
          className="w-full sm:w-auto"
          size="sm"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline ml-2">Sync Registrations</span>
          <span className="sm:hidden ml-2">Sync</span>
        </Button>
        <Button
          color="danger"
          variant="flat"
          onPress={handleDeletePastEvents}
          className="w-full sm:w-auto"
          size="sm"
        >
          <Trash2 className="w-4 h-4" />
          <span className="hidden sm:inline ml-2">Delete Past Events</span>
          <span className="sm:hidden ml-2">Delete Past</span>
        </Button>
        <Button
          color="primary"
          onPress={onOpen}
          className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600"
          size="sm"
        >
          <PlusIcon className="w-4 h-4" />
          <span className="ml-2">Add Event</span>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 md:mb-8">
        <Card className="border-none shadow-md">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Total Events</p>
                <p className="text-2xl font-bold">{events.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none shadow-md">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Upcoming</p>
                <p className="text-2xl font-bold">
                  {events.filter(e => e.status === "upcoming").length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <TrendingUpIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none shadow-md">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Total Registered</p>
                <p className="text-2xl font-bold">
                  {events.reduce((sum, e) => sum + e.registered, 0)}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <UsersIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardBody>
        </Card>

        <Card className="border-none shadow-md">
          <CardBody className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-default-500">Featured</p>
                <p className="text-2xl font-bold">
                  {events.filter(e => e.isFeatured).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <StarIcon className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Events Table */}
      <Card className="border-none shadow-lg">
        <CardBody className="p-0">
          {(() => {
            const filteredEvents = events.filter((event) => {
              const matchesSearch = !searchQuery || event.title.toLowerCase().includes(searchQuery.toLowerCase()) || event.category?.toLowerCase().includes(searchQuery.toLowerCase()) || event.location?.toLowerCase().includes(searchQuery.toLowerCase());
              const matchesStatus = statusFilter === "all" || event.status === statusFilter;
              return matchesSearch && matchesStatus;
            });

            if (filteredEvents.length === 0) {
              return (
                <div className="text-center py-16 text-default-400">
                  <CalendarIcon className="w-14 h-14 mx-auto mb-4 opacity-40" />
                  <p className="text-lg font-medium">No events found</p>
                  <p className="text-sm mt-1">
                    {searchQuery || statusFilter !== "all" ? "Try adjusting your search or filters" : "Create your first event to get started"}
                  </p>
                  {!searchQuery && statusFilter === "all" && (
                    <Button color="primary" className="mt-4" onPress={onOpen}>Create Event</Button>
                  )}
                </div>
              );
            }

            return (
              <div className="overflow-x-auto">
                <Table aria-label="Events table" className="min-w-full">
                  <TableHeader>
                    <TableColumn>EVENT</TableColumn>
                    <TableColumn className="hidden md:table-cell">DATE</TableColumn>
                    <TableColumn className="hidden lg:table-cell">LOCATION</TableColumn>
                    <TableColumn className="hidden sm:table-cell">CAPACITY</TableColumn>
                    <TableColumn>STATUS</TableColumn>
                    <TableColumn>ACTIONS</TableColumn>
                  </TableHeader>
                  <TableBody>
                    {filteredEvents.map((event) => (
                      <TableRow key={event.$id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <img
                              src={event.image}
                              alt={event.title}
                              className="w-12 h-12 md:w-16 md:h-16 object-cover rounded-lg flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-sm md:text-base truncate">
                                {event.title}
                              </p>
                              <p className="text-xs md:text-sm text-default-500 truncate capitalize">
                                {event.category}
                              </p>
                              <p className="text-xs text-default-400 md:hidden">
                                {new Date(event.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {new Date(event.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <span className="truncate max-w-xs block">
                            {event.location}
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-1">
                            <UsersIcon className="w-3 h-3 text-default-400" />
                            <span className="text-sm">
                              {event.registered}/{event.capacity}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Chip
                            color={
                              event.status === "upcoming" ? "success"
                              : event.status === "ongoing" ? "primary"
                              : event.status === "completed" ? "default"
                              : event.status === "cancelled" ? "danger"
                              : "default"
                            }
                            variant="flat"
                            size="sm"
                            className="text-xs capitalize"
                          >
                            {event.status}
                          </Chip>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1 md:gap-2">
                            <Button size="sm" variant="light" isIconOnly title="Analytics"
                              onPress={() => handleViewAnalytics(event)}>
                              <TrendingUpIcon className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                            <Button size="sm" variant="light" isIconOnly title="QR Code"
                              onPress={() => handleViewQRCode(event)}>
                              <QrCode className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                            <Button size="sm" variant="light" isIconOnly title="View registrations"
                              onPress={() => handleViewRegistrations(event)}>
                              <UsersIcon className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                            <Button size="sm" variant="light" isIconOnly title="Edit"
                              onPress={() => handleEdit(event)}>
                              <Pencil className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                            <Button size="sm" color="danger" variant="light" isIconOnly
                              onPress={() => handleDelete(event.$id!)} isLoading={deletingId === event.$id}>
                              <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            );
          })()}
        </CardBody>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        size="3xl"
        scrollBehavior="inside"
        classNames={{
          base: "max-h-[95vh]",
          wrapper: "items-center"
        }
        }
      >
        <ModalContent>
          <form onSubmit={handleSubmit}>
            <ModalHeader className="flex flex-col gap-1 border-b pb-4">
              <h2 className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {editingEvent ? "Edit Event" : "Create New Event"}
              </h2>
              <p className="text-xs md:text-sm text-default-500 font-normal">
                Fill in the details below to {editingEvent ? "update" : "create"} an event
              </p>
            </ModalHeader>

            <ModalBody className="py-4 md:py-6">
              {!editingEvent && !showTemplateSelector && (
                <div className="mb-3 md:mb-4 p-3 md:p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg md:rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between gap-2 md:gap-4">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm md:text-base text-foreground">Quick Start with Templates</h3>
                      <p className="text-xs md:text-sm text-default-500 mt-1">Use pre-built templates to create events faster</p>
                    </div>
                    <Button
                      color="primary"
                      size="sm"
                      onPress={() => setShowTemplateSelector(true)}
                      variant="flat"
                      className="flex-shrink-0"
                    >
                      Browse Templates
                    </Button>
                  </div>
                </div>
              )}

              {showTemplateSelector && (
                <div className="mb-3 md:mb-4 p-3 md:p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg md:rounded-xl border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center justify-between mb-3 md:mb-4">
                    <h3 className="font-semibold text-sm md:text-base text-foreground">Select a Template</h3>
                    <Button
                      size="sm"
                      variant="light"
                      onPress={() => setShowTemplateSelector(false)}
                      isIconOnly
                    >
                      <XIcon className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {EVENT_TEMPLATES.map(template => (
                      <Button
                        key={template.id}
                        className="justify-start h-auto py-2 md:py-3 px-3 md:px-4 text-xs md:text-sm"
                        color="primary"
                        variant="flat"
                        onPress={() => handleApplyTemplate(template.id)}
                      >
                        <div className="flex flex-col items-start gap-0.5 md:gap-1">
                          <span className="font-semibold">{template.name}</span>
                          <span className="text-xs text-default-500">{template.description}</span>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              <Tabs aria-label="Event form sections" color="primary" variant="underlined" size="sm">
                <Tab key="basic" title={
                  <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                    <CalendarIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Basic Info</span>
                    <span className="sm:hidden">Basic</span>
                  </div>
                }>
                  <div className="space-y-4 md:space-y-6 pt-3 md:pt-4">
                    {/* Image URL */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-purple-600" />
                        Event Image URL *
                      </label>
                      <Input
                        placeholder="https://example.com/image.jpg"
                        value={formData.image}
                        onChange={(e) => handleInputChange("image", e.target.value)}
                        required
                        startContent={<LinkIcon className="w-4 h-4 text-default-400" />}
                        description="Enter a direct link to the event image"
                        classNames={{
                          input: "text-sm"
                        }} variant="bordered"
                      />
                      {formData.image && formData.image.startsWith('http') && (
                        <div className="relative group w-full">
                          <img
                            src={formData.image}
                            alt="Preview"
                            className="w-full h-48 object-cover rounded-xl border-2 border-purple-200 dark:border-purple-800"
                            onError={(e) => {
                              e.currentTarget.src = "https://via.placeholder.com/400x300?text=Invalid+Image+URL";
                            }}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                            <p className="text-white text-sm">Image Preview</p>
                          </div>
                        </div>
                      )}
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          Tip: Use free image hosting services like Imgur, Cloudinary, or Unsplash for reliable image URLs
                        </p>
                      </div>
                    </div>

                    <Input
                      label="Event Title"
                      placeholder="Enter event title"
                      value={formData.title}
                      onChange={(e) => handleInputChange("title", e.target.value)}
                      required
                      classNames={{
                        label: "font-semibold",
                        input: "text-base"
                      }} variant="bordered"
                    />

                    <div className="space-y-2">
                      <label className="text-sm font-semibold">Description *</label>
                      <MarkdownEditor
                        value={formData.description || ""}
                        onChange={(value) => handleInputChange("description", value)}
                        placeholder="Describe your event in detail (markdown supported)"
                      />
                    </div>

                    <Select
                      label="Category"
                      placeholder="Select event category"
                      selectedKeys={[formData.category!]}
                      onChange={(e) => handleInputChange("category", e.target.value)}
                      required
                      classNames={{
                        label: "font-semibold"
                      }} variant="bordered"
                    >
                      <SelectItem key="conference" variant="bordered">Conference</SelectItem>
                      <SelectItem key="workshop" variant="bordered">Workshop</SelectItem>
                      <SelectItem key="masterclass" variant="bordered">Masterclass</SelectItem>
                      <SelectItem key="competition" variant="bordered">Competition</SelectItem>
                      <SelectItem key="bootcamp" variant="bordered">Bootcamp</SelectItem>
                      <SelectItem key="forum" variant="bordered">Forum</SelectItem>
                    </Select>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <Switch
                        isSelected={formData.isFeatured}
                        onValueChange={(checked) => handleInputChange("isFeatured", checked)}
                        color="warning"
                      >
                        <div className="flex items-center gap-2">
                          <StarIcon className="w-4 h-4 text-yellow-600" />
                          <span className="font-semibold text-sm">Featured</span>
                        </div>
                      </Switch>
                      <Switch
                        isSelected={formData.isPremium}
                        onValueChange={(checked) => handleInputChange("isPremium", checked)}
                        color="secondary"
                      >
                        <div className="flex items-center gap-2">
                          <CrownIcon className="w-4 h-4 text-purple-600" />
                          <span className="font-semibold text-sm">Premium</span>
                        </div>
                      </Switch>
                    </div>
                  </div>
                </Tab>

                <Tab key="details" title={
                  <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                    <MapPinIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Date & Location</span>
                    <span className="sm:hidden">Location</span>
                  </div>
                }>
                  <div className="space-y-4 md:space-y-6 pt-3 md:pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                      <Input
                        label="Date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange("date", e.target.value)}
                        required
                        classNames={{
                          label: "font-semibold"
                        }} variant="bordered"
                      />
                      <Input
                        label="Time"
                        type="text"
                        placeholder="e.g., 09:00 AM - 06:00 PM"
                        value={formData.time}
                        onChange={(e) => handleInputChange("time", e.target.value)}
                        required
                        classNames={{
                          label: "font-semibold"
                        }} variant="bordered"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Input
                        label="Venue"
                        placeholder="e.g., Grand Convention Center"
                        value={formData.venue}
                        onChange={(e) => handleInputChange("venue", e.target.value)}
                        required
                        classNames={{
                          label: "font-semibold"
                        }} variant="bordered"
                      />
                      <Input
                        label="Location"
                        placeholder="e.g., New York, NY"
                        value={formData.location}
                        onChange={(e) => handleInputChange("location", e.target.value)}
                        required
                        classNames={{
                          label: "font-semibold"
                        }} variant="bordered"
                      />
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                        Location Tips
                      </p>
                      <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                        <li>• Be specific about the venue name</li>
                        <li>• Include city and state/country</li>
                        <li>• Add nearby landmarks if helpful</li>
                      </ul>
                    </div>
                  </div>
                </Tab>

                <Tab key="pricing" title={
                  <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                    <DollarSignIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Pricing & Capacity</span>
                    <span className="sm:hidden">Pricing</span>
                  </div>
                }>
                  <div className="space-y-4 md:space-y-6 pt-3 md:pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                      <Input
                        label="Regular Price (₹)"
                        type="number"
                        placeholder="0"
                        value={formData.price?.toString()}
                        onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                        required
                        startContent={<span className="text-default-400">₹</span>}
                        classNames={{
                          label: "font-semibold"
                        }} variant="bordered"
                      />
                      <Input
                        label="Discount Price (₹)"
                        type="number"
                        placeholder="Optional"
                        value={formData.discountPrice?.toString() || ""}
                        onChange={(e) => handleInputChange("discountPrice", e.target.value ? parseFloat(e.target.value) : null)}
                        startContent={<span className="text-default-400">₹</span>}
                        classNames={{
                          label: "font-semibold"
                        }} variant="bordered"
                      />
                      <Input
                        label="Capacity"
                        type="number"
                        placeholder="50"
                        value={formData.capacity?.toString()}
                        onChange={(e) => handleInputChange("capacity", parseInt(e.target.value) || 50)}
                        required
                        startContent={<UsersIcon className="w-4 h-4 text-default-400" />}
                        classNames={{
                          label: "font-semibold"
                        }} variant="bordered"
                      />
                    </div>

                    {formData.price && formData.discountPrice && formData.discountPrice < formData.price && (
                      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                        <p className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                          Discount Applied!
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300">
                          Attendees save ₹{formData.price - formData.discountPrice} ({Math.round(((formData.price - formData.discountPrice) / formData.price) * 100)}% off)
                        </p>
                      </div>
                    )}

                    <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                      <p className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2">
                        Pricing Tips
                      </p>
                      <ul className="text-sm text-purple-700 dark:text-purple-300 space-y-1">
                        <li>• Set price to ₹0 for free events</li>
                        <li>• Add discount price for early bird offers</li>
                        <li>• Consider your target audience's budget</li>
                        <li>• Capacity helps manage registrations</li>
                      </ul>
                    </div>
                  </div>
                </Tab>

                <Tab key="organizer" title={
                  <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
                    <UsersIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">Organizer & Recurring</span>
                    <span className="sm:hidden">More</span>
                  </div>
                }>
                  <div className="space-y-4 md:space-y-6 pt-3 md:pt-4">
                    {/* Recurring Events Section */}
                    <div className="p-3 md:p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg md:rounded-xl border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start justify-between mb-3 md:mb-4">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-foreground text-sm md:text-base flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            Recurring Events
                          </h3>
                          <p className="text-xs md:text-sm text-default-500 mt-1">Set up recurring events for regular meetups</p>
                        </div>
                      </div>

                      <Switch
                        isSelected={formData.isRecurring}
                        onValueChange={(checked) => handleInputChange("isRecurring", checked)}
                        color="primary"
                        size="sm"
                      >
                        <span className="text-xs md:text-sm font-medium">Enable recurring</span>
                      </Switch>

                      {formData.isRecurring && (
                        <div className="mt-3 md:mt-4 space-y-3">
                          <Select
                            label="Repeat Pattern"
                            placeholder="Select a pattern"
                            selectedKeys={formData.recurringPattern ? [formData.recurringPattern] : []}
                            onChange={(e) => handleInputChange("recurringPattern", e.target.value)}
                            classNames={{
                              label: "font-semibold text-sm"
                            }} variant="bordered"
                          >
                            <SelectItem key="weekly" variant="bordered">Every Week</SelectItem>
                            <SelectItem key="biweekly" variant="bordered">Every 2 Weeks</SelectItem>
                            <SelectItem key="monthly" variant="bordered">Every Month</SelectItem>
                            <SelectItem key="quarterly" variant="bordered">Every Quarter</SelectItem>
                          </Select>
                          <div className="p-3 bg-blue-100/50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                              Recurring events will be automatically created based on the pattern. You can edit individual events later.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <hr className="my-2" />

                    <Input
                      label="Organizer Name"
                      placeholder="e.g., John Doe"
                      value={formData.organizerName}
                      onChange={(e) => handleInputChange("organizerName", e.target.value)}
                      required
                      size="sm"
                      classNames={{
                        label: "font-semibold text-xs md:text-sm"
                      }} variant="bordered"
                    />

                    <div className="space-y-3">
                      <label className="text-sm font-semibold flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-purple-600" />
                        Organizer Avatar URL *
                      </label>
                      <Input
                        placeholder="https://example.com/avatar.jpg"
                        value={formData.organizerAvatar}
                        onChange={(e) => handleInputChange("organizerAvatar", e.target.value)}
                        required
                        startContent={<LinkIcon className="w-4 h-4 text-default-400" />}
                        description="Enter a direct link to the organizer's avatar"
                        classNames={{
                          input: "text-sm"
                        }} variant="bordered"
                      />
                      {formData.organizerAvatar && formData.organizerAvatar.startsWith('http') && (
                        <div className="flex items-center gap-3 p-3 bg-default-100 dark:bg-default-50/10 rounded-lg">
                          <img
                            src={formData.organizerAvatar}
                            alt="Avatar preview"
                            className="w-12 h-12 rounded-full object-cover border-2 border-purple-200 dark:border-purple-800"
                            onError={(e) => {
                              e.currentTarget.src = "https://via.placeholder.com/100?text=Invalid";
                            }}
                          />
                          <span className="text-sm text-default-600">Avatar Preview</span>
                        </div>
                      )}
                    </div>

                    {/* Tags Section */}
                    <div className="space-y-3">
                      <label className="text-sm font-semibold flex items-center gap-2">
                        <TagIcon className="w-4 h-4 text-purple-600" />
                        Event Tags
                      </label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a tag (e.g., AI, Networking)"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTag();
                            }
                          }} variant="bordered"
                        />
                        <Button
                          type="button"
                          onPress={handleAddTag}
                          color="primary"
                          variant="flat"
                        >
                          Add
                        </Button>
                      </div>
                      {formData.tags && formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-4 bg-default-100 dark:bg-default-50/10 rounded-xl">
                          {formData.tags.map((tag, index) => (
                            <Chip
                              key={index}
                              onClose={() => handleRemoveTag(tag)}
                              variant="flat"
                              color="secondary"
                              className="font-medium"
                            >
                              {tag}
                            </Chip>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                      <p className="text-sm font-semibold text-orange-900 dark:text-orange-100 mb-2">
                        Tag Best Practices
                      </p>
                      <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                        <li>• Use 3-5 relevant tags</li>
                        <li>• Include topics, skills, or themes</li>
                        <li>• Make tags searchable and specific</li>
                        <li>• Examples: "Machine Learning", "Beginner Friendly"</li>
                      </ul>
                    </div>
                  </div>
                </Tab>
              </Tabs>
            </ModalBody>

            <ModalFooter className="border-t pt-3 md:pt-4 gap-2 md:gap-3">
              <Button
                variant="flat"
                onPress={handleCloseModal}
                className="w-full sm:w-auto text-xs md:text-sm"
              >
                Cancel
              </Button>
              <Button
                color="primary"
                type="submit"
                isLoading={submitting}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-xs md:text-sm"
              >
                {editingEvent ? "Update Event" : "Create Event"}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal >

      {/* Registrations Modal */}
      <Modal
        isOpen={isRegistrationsOpen}
        onClose={onRegistrationsClose}
        size="4xl"
        scrollBehavior="inside"
        classNames={{
          base: "max-h-[95vh]",
          wrapper: "items-center"
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UsersIcon className="w-5 h-5" />
                <span>Event Registrations</span>
              </div>
              {!checkinMode && registrations.length > 0 && (
                <Button
                  size="sm"
                  color="success"
                  variant="flat"
                  onPress={() => setCheckinMode(true)}
                >
                  <QrCode className="w-4 h-4" />
                  <span className="ml-2 hidden sm:inline">Start Check-In</span>
                  <span className="ml-2 sm:hidden">Check-In</span>
                </Button>
              )}
            </div>
            {selectedEventForRegistrations && (
              <p className="text-sm text-default-500 font-normal">
                {selectedEventForRegistrations.title}
              </p>
            )}
          </ModalHeader>

          <ModalBody>
            {loadingRegistrations ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : checkinMode ? (
              // Check-in View
              <div className="space-y-6">
                {/* Check-in Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <Card className="bg-success/10 border border-success/20">
                    <CardBody className="p-3">
                      <p className="text-xs text-default-600">Checked In</p>
                      <p className="text-2xl font-bold text-success">{checkinStats.successful}</p>
                    </CardBody>
                  </Card>
                  <Card className="bg-warning/10 border border-warning/20">
                    <CardBody className="p-3">
                      <p className="text-xs text-default-600">Duplicates</p>
                      <p className="text-2xl font-bold text-warning">{checkinStats.duplicates}</p>
                    </CardBody>
                  </Card>
                  <Card className="bg-danger/10 border border-danger/20">
                    <CardBody className="p-3">
                      <p className="text-xs text-default-600">Errors</p>
                      <p className="text-2xl font-bold text-danger">{checkinStats.errors}</p>
                    </CardBody>
                  </Card>
                </div>

                {/* QR Input */}
                <div>
                  <Input
                    ref={checkinInputRef}
                    placeholder="Scan QR code here..."
                    value={checkinData}
                    onKeyDown={handleCheckinScan}
                    onChange={(e) => setCheckinData(e.target.value)}
                    className="text-lg"
                    autoFocus variant="bordered"
                  />
                  <p className="text-xs text-default-500 mt-2">Point scanner at QR codes to check-in attendees</p>
                </div>

                {/* Check-in Records */}
                {checkinRecords.length > 0 && (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    <p className="text-sm font-semibold">Recent Scans</p>
                    {checkinRecords.map((record, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-default-100 dark:bg-default-50/10 rounded-lg">
                        {record.status === 'success' && <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />}
                        {record.status === 'duplicate' && <div className="w-2 h-2 rounded-full bg-warning flex-shrink-0" />}
                        {record.status === 'error' && <div className="w-2 h-2 rounded-full bg-danger flex-shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{record.name}</p>
                          <p className="text-xs text-default-500 truncate">{record.email}</p>
                        </div>
                        <div className="text-xs text-default-400 flex-shrink-0">{record.time}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : registrations.length > 0 ? (
              // Normal Registration View with QR Codes
              <div className="max-h-[60vh] overflow-y-auto">
                <div className="space-y-4">
                  {registrations.map((reg) => (
                    <Card key={reg.$id} className="border-default-200">
                      <CardBody className="p-4">
                        <div className="flex flex-col gap-4">
                          {/* Registration Info */}
                          <div>
                            <p className="text-sm font-semibold text-default-700">{reg.userName}</p>
                            <p className="text-xs text-default-500">{reg.userEmail}</p>
                            <p className="text-xs text-default-400 mt-1">
                              Registered: {new Date(reg.registeredAt).toLocaleDateString()}
                            </p>
                          </div>

                          {/* QR Code and Data Side-by-Side */}
                          {reg.$id && (
                            <>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* QR Code */}
                                <div className="flex justify-center md:justify-start">
                                  <div className="p-3 bg-default-100 rounded-lg border border-default-200">
                                    <img
                                      src={getQRCodeUrl(reg.$id)}
                                      alt={`QR for ${reg.userName}`}
                                      className="w-32 h-32"
                                    />
                                  </div>
                                </div>

                                {/* QR Data */}
                                {(() => {
                                  const qrData = (reg as any).ticketQRData || `TICKET|${reg.$id}|${reg.userName}|${selectedEventForRegistrations?.title}`;
                                  return (
                                    <div className="bg-white dark:bg-default-900 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                                      <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-2">QR Data:</p>
                                      <p className="text-xs font-mono text-purple-600 dark:text-purple-400 break-all leading-relaxed bg-purple-50 dark:bg-purple-950/50 p-2 rounded border border-purple-200 dark:border-purple-800">
                                        {qrData}
                                      </p>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Download QR Button */}
                              <Button
                                size="sm"
                                variant="flat"
                                color="primary"
                                fullWidth
                                onPress={() => downloadTicketQR(reg.$id!)}
                              >
                                <Download className="w-4 h-4" />
                                <span className="ml-2">Download QR</span>
                              </Button>
                            </>
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex justify-center items-center py-8 text-default-500">
                <p>No registrations yet</p>
              </div>
            )}
          </ModalBody>

          <ModalFooter className="border-t pt-4">
            {checkinMode ? (
              <>
                <Button
                  variant="flat"
                  onPress={() => {
                    setCheckinMode(false);
                    handleResetCheckin();
                  }}
                >
                  Back
                </Button>
                <Button
                  color="danger"
                  variant="flat"
                  onPress={handleResetCheckin}
                >
                  Reset
                </Button>
              </>
            ) : (
              <Button
                variant="light"
                onPress={onRegistrationsClose}
              >
                Close
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Analytics Modal */}
      <Modal
        isOpen={isAnalyticsOpen}
        onClose={onAnalyticsClose}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          <ModalHeader className="flex items-center gap-2">
            <TrendingUpIcon className="w-5 h-5" />
            <span>Event Analytics - {selectedEventForAnalytics?.title}</span>
          </ModalHeader>

          <ModalBody className="py-6">
            {selectedEventForAnalytics && (
              <div className="space-y-6">
                {(() => {
                  const metrics = calculateEventMetrics(selectedEventForAnalytics);
                  const estimatedFuture = estimateFutureRegistrations(selectedEventForAnalytics.registered, 7);
                  const alertMsg = getCapacityAlertMessage(metrics);

                  return (
                    <>
                      {/* Capacity Alert */}
                      {alertMsg && (
                        <div className="p-4 bg-warning-50 dark:bg-warning-900/20 rounded-xl border border-warning-200 dark:border-warning-800">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-5 h-5 text-warning-600" />
                            <span className="font-semibold text-warning-900 dark:text-warning-100">Capacity Alert</span>
                          </div>
                          <p className="text-sm text-warning-700 dark:text-warning-300">{alertMsg}</p>
                        </div>
                      )}

                      {/* Metrics Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        <Card className="border-none shadow-sm">
                          <CardBody className="p-4">
                            <p className="text-xs text-default-500 uppercase tracking-wide font-semibold">Registered</p>
                            <p className="text-2xl font-bold mt-1">{selectedEventForAnalytics.registered}</p>
                            <p className="text-xs text-default-400 mt-1">{metrics.registrationPercentage}% full</p>
                          </CardBody>
                        </Card>

                        <Card className="border-none shadow-sm">
                          <CardBody className="p-4">
                            <p className="text-xs text-default-500 uppercase tracking-wide font-semibold">Capacity</p>
                            <p className="text-2xl font-bold mt-1">{selectedEventForAnalytics.capacity}</p>
                            <p className="text-xs text-default-400 mt-1">{metrics.spotsRemaining} spots left</p>
                          </CardBody>
                        </Card>

                        <Card className="border-none shadow-sm">
                          <CardBody className="p-4">
                            <p className="text-xs text-default-500 uppercase tracking-wide font-semibold">Estimated (7d)</p>
                            <p className="text-2xl font-bold mt-1">{estimatedFuture}</p>
                            <p className="text-xs text-default-400 mt-1">
                              +{Math.round(estimatedFuture - selectedEventForAnalytics.registered)} projected
                            </p>
                          </CardBody>
                        </Card>

                        <Card className="border-none shadow-sm">
                          <CardBody className="p-4">
                            <p className="text-xs text-default-500 uppercase tracking-wide font-semibold">Status</p>
                            <p className="text-2xl font-bold mt-1">
                              <Chip
                                color={metrics.isFull ? "danger" : metrics.isNearFull ? "warning" : "success"}
                                variant="flat"
                                size="sm"
                              >
                                {metrics.isFull ? "Full" : metrics.isNearFull ? "Filling" : "Open"}
                              </Chip>
                            </p>
                          </CardBody>
                        </Card>
                      </div>

                      {/* Export Options */}
                      <div className="space-y-2">
                        <p className="text-sm font-semibold text-default-600">Export Data</p>
                        <div className="flex gap-2">
                          <Button
                            fullWidth
                            color="primary"
                            variant="flat"
                            size="sm"
                            isLoading={loadingAnalyticsRegistrations}
                            onPress={() => {
                              if (selectedEventForAnalytics) {
                                downloadEventStatsCSV(selectedEventForAnalytics, metrics, analyticsRegistrations);
                              }
                            }}
                          >
                            <Download className="w-4 h-4" />
                            Stats CSV
                          </Button>
                          <Button
                            fullWidth
                            color="secondary"
                            variant="flat"
                            size="sm"
                            isLoading={loadingAnalyticsRegistrations}
                            onPress={() => {
                              if (selectedEventForAnalytics) {
                                downloadRegistrationList(selectedEventForAnalytics.title, analyticsRegistrations);
                              }
                            }}
                          >
                            <Download className="w-4 h-4" />
                            Registrations
                          </Button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="light" onPress={onAnalyticsClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* QR Share Modal */}
      <Modal
        isOpen={isQRShareOpen}
        onClose={onQRShareClose}
        size="md"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 border-b pb-4">
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              <span>Event QR Code</span>
            </div>
            {qrEvent && (
              <p className="text-sm text-default-500 font-normal">
                {qrEvent.title}
              </p>
            )}
          </ModalHeader>

          <ModalBody className="py-6 space-y-4">
            {qrEvent && (
              <>
                {/* QR Code Display */}
                <div className="flex justify-center p-4 bg-default-100 rounded-lg">
                  <img
                    src={generateEventQRCodeUrl(qrEvent.$id!, qrEvent.title)}
                    alt={`QR for ${qrEvent.title}`}
                    className="w-48 h-48"
                  />
                </div>

                {/* Event Info */}
                <div className="space-y-2">
                  <p className="text-sm text-default-600">
                    <span className="font-semibold">Event:</span> {qrEvent.title}
                  </p>
                  <p className="text-sm text-default-600">
                    <span className="font-semibold">Date:</span> {new Date(qrEvent.date).toLocaleDateString()}
                  </p>
                </div>

                {/* Share Link Section */}
                <div className="space-y-2 border-t pt-4">
                  <p className="text-sm font-semibold text-default-700">Share QR Code</p>
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <p className="text-xs text-default-600 mb-2">Shareable Link:</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={generateEventShareQRCodeUrl(qrEvent.$id!)}
                        readOnly
                        className="flex-1 text-xs p-2 bg-white dark:bg-default-900 border border-default-200 dark:border-default-700 rounded px-3 py-2 font-mono"
                      />
                      <Button
                        size="sm"
                        variant="flat"
                        color="primary"
                        isIconOnly
                        onPress={() => {
                          const url = generateEventShareQRCodeUrl(qrEvent.$id!);
                          navigator.clipboard.writeText(url);
                        }}
                        title="Copy to clipboard"
                      >
                        <LinkIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </ModalBody>

          <ModalFooter>
            <Button variant="light" onPress={onQRShareClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </AdminPageWrapper>
  );
}
