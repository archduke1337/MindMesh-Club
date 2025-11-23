"use client";

import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Badge } from "@heroui/badge";
import { Avatar } from "@heroui/avatar";
import { Chip } from "@heroui/chip";
import { Progress } from "@heroui/progress";
import { Divider } from "@heroui/divider";
import {
  StarIcon,
  HeartIcon,
  ShareIcon,
  TicketIcon,
  CrownIcon,
  ArrowLeftIcon,
  BuildingIcon,
  TagIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrendingUpIcon,
  MailIcon,
  CalendarIcon,
  ClockIcon,
  MapPinIcon,
  UsersIcon
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { eventService, Event as EventType } from "@/lib/database";
import { eventStorageManager } from "@/lib/eventStorageManager";
import { getErrorMessage } from "@/lib/errorHandler";
import { MarkdownRenderer } from "@/components/MarkdownRenderer";

export default function EventDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;

  const [event, setEvent] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [ticketId, setTicketId] = useState<string>("");
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    loadEvent();
    checkSavedStatus();
    checkRegistrationStatus();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const eventData = await eventService.getEventById(eventId);
      setEvent(eventData);
    } catch (error) {
      console.error("Error loading event:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkSavedStatus = () => {
    setIsSaved(eventStorageManager.isSaved(eventId));
  };

  const checkRegistrationStatus = () => {
    const isReg = eventStorageManager.isRegistered(eventId);
    setIsRegistered(isReg);

    // Check if we have ticket info
    const ticketInfo = eventStorageManager.getTicket(eventId);
    if (ticketInfo) {
      setTicketId(ticketInfo.ticketId);
      setEmailSent(true);
    }
  };

  const toggleSave = () => {
    const isSaved = eventStorageManager.toggleSavedEvent(eventId);
    setIsSaved(isSaved);
  };

  const handleRegister = async () => {
    if (!user) {
      alert("Please login to register for events");
      router.push("/login");
      return;
    }

    if (isRegistered) {
      const confirmed = confirm("Are you sure you want to unregister from this event?");
      if (!confirmed) return;

      try {
        // Unregister from database to sync with admin panel
        await eventService.unregisterFromEvent(eventId, user.$id);
        console.log("✅ Unregistered from event in database");
      } catch (error) {
        console.warn("⚠️ Warning: Could not unregister from database, but removing from local storage:", error);
        // Continue with local cleanup even if DB fails
      }

      eventStorageManager.removeRegisteredEvent(eventId);
      eventStorageManager.deleteTicket(eventId);
      setIsRegistered(false);
      setEmailSent(false);
      setTicketId("");

      // Reload event to get updated registration count from DB
      await loadEvent();

      alert("Successfully unregistered from event");
      return;
    }

    setRegistering(true);
    try {
      // Call server-side registration endpoint for atomic registration
      const response = await fetch('/api/events/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId,
          userId: user.$id,
          userName: user.name,
          userEmail: user.email,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Registration failed');
      }

      setTicketId(result.ticketId);
      setEmailSent(true);

      // Save to localStorage using centralized manager
      const ticketData = {
        ticketId: result.ticketId,
        eventId: eventId,
        eventTitle: event!.title,
        userName: user.name,
        userEmail: user.email,
        date: event!.date,
        time: event!.time,
        venue: event!.venue,
        location: event!.location,
        registeredAt: new Date().toISOString(),
      };

      eventStorageManager.setTicket(eventId, ticketData);
      eventStorageManager.addRegisteredEvent(eventId);
      setIsRegistered(true);

      alert(`✅ Registration successful! \n\n🎫 Your ticket ID: ${result.ticketId}\n📧 E-ticket sent to: ${user.email}\n\nCheck your email for your e-ticket with QR code!`);
      await loadEvent();
    } catch (error) {
      const message = getErrorMessage(error);
      console.error("Registration error:", message);
      alert(message || "Failed to register for event");
    } finally {
      setRegistering(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.title,
        text: event?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDiscount = (original: number, discount: number) => {
    return Math.round(((original - discount) / original) * 100);
  };

  const getSpotsLeft = () => {
    if (!event?.capacity) return null;
    return event.capacity - event.registered;
  };

  const getRegistrationPercentage = () => {
    if (!event?.capacity) return 0;
    return (event.registered / event.capacity) * 100;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-default-500">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <XCircleIcon className="w-16 h-16 text-danger mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <p className="text-default-500 mb-6">The event you're looking for doesn't exist.</p>
          <Button color="primary" onPress={() => router.push("/events")}>
            Browse Events
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12 sm:pb-16 md:pb-20 lg:pb-24">
      {/* Back Button */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <Button
          variant="light"
          startContent={<ArrowLeftIcon className="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5" />}
          onPress={() => router.back()}
          className="text-xs sm:text-small md:text-base"
        >
          Back to Events
        </Button>
      </div>

      {/* Hero Image Section */}
      <div className="relative h-64 sm:h-80 md:h-96 lg:h-[500px] w-full overflow-hidden">
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

        {/* Floating Action Buttons */}
        <div className="absolute top-3 sm:top-4 md:top-6 right-3 sm:right-4 md:right-6 flex gap-1.5 sm:gap-2">
          <Button
            isIconOnly
            variant="flat"
            size="sm"
            className="bg-white/90 dark:bg-black/90 backdrop-blur-sm"
            onPress={toggleSave}
          >
            <HeartIcon
              className={`w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5 ${isSaved ? "fill-red-500 text-red-500" : "text-gray-600"
                }`}
            />
          </Button>
          <Button
            isIconOnly
            variant="flat"
            size="sm"
            className="bg-white/90 dark:bg-black/90 backdrop-blur-sm"
            onPress={handleShare}
          >
            <ShareIcon className="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5" />
          </Button>
        </div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 md:p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-3 mb-2 sm:mb-3 md:mb-4">
              {event.isFeatured && (
                <Badge color="warning" variant="solid" className="font-bold text-[10px] sm:text-xs md:text-small">
                  <StarIcon className="w-2.5 sm:w-3 md:w-3.5 h-2.5 sm:h-3 md:h-3.5 mr-1" />
                  Featured
                </Badge>
              )}
              {event.isPremium && (
                <Badge color="secondary" variant="solid" className="font-bold text-[10px] sm:text-xs md:text-small">
                  <CrownIcon className="w-2.5 sm:w-3 md:w-3.5 h-2.5 sm:h-3 md:h-3.5 mr-1" />
                  Premium
                </Badge>
              )}
              <Badge color="primary" variant="solid" className="text-[10px] sm:text-xs md:text-small">
                {event.category}
              </Badge>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2 sm:mb-3 md:mb-4">
              {event.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-6 text-white/90 text-xs sm:text-small md:text-base">
              <div className="flex items-center gap-1 sm:gap-2">
                <CalendarIcon className="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5 flex-shrink-0" />
                <span className="font-medium">{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <ClockIcon className="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5 flex-shrink-0" />
                <span className="font-medium">{event.time}</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <MapPinIcon className="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5 flex-shrink-0" />
                <span className="font-medium">{event.location}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-10 md:py-12 lg:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
          {/* Left Column - Event Details */}
          <div className="lg:col-span-2 space-y-6 md:space-y-8 lg:space-y-10">
            {/* About Event */}
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-0 px-4 sm:px-6 md:px-8 pt-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">About Event</h2>
              </CardHeader>
              <CardBody className="pt-4 px-4 sm:px-6 md:px-8 pb-6">
                <MarkdownRenderer content={event.description} />
              </CardBody>
            </Card>

            {/* Event Details Grid */}
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-0 px-4 sm:px-6 md:px-8 pt-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Event Details</h2>
              </CardHeader>
              <CardBody className="pt-4 px-4 sm:px-6 md:px-8 pb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5 lg:gap-6">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                      <CalendarIcon className="w-5 sm:w-6 h-5 sm:h-6 text-purple-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-small text-default-500 mb-0.5">Date</p>
                      <p className="text-xs sm:text-small md:text-base font-semibold">{formatDate(event.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <ClockIcon className="w-5 sm:w-6 h-5 sm:h-6 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-small text-default-500 mb-0.5">Time</p>
                      <p className="text-xs sm:text-small md:text-base font-semibold">{event.time}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                      <BuildingIcon className="w-5 sm:w-6 h-5 sm:h-6 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-small text-default-500 mb-0.5">Venue</p>
                      <p className="text-xs sm:text-small md:text-base font-semibold line-clamp-2">{event.venue}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="w-10 sm:w-12 h-10 sm:h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
                      <MapPinIcon className="w-5 sm:w-6 h-5 sm:h-6 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-small text-default-500 mb-0.5">Location</p>
                      <p className="text-xs sm:text-small md:text-base font-semibold line-clamp-2">{event.location}</p>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Tags */}
            {event.tags.length > 0 && (
              <Card className="border-none shadow-lg">
                <CardHeader className="pb-0 px-4 sm:px-6 md:px-8 pt-6">
                  <div className="flex items-center gap-2">
                    <TagIcon className="w-4 sm:w-5 h-4 sm:h-5 text-purple-600 flex-shrink-0" />
                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Topics</h2>
                  </div>
                </CardHeader>
                <CardBody className="pt-4 px-4 sm:px-6 md:px-8 pb-6">
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 md:gap-3">
                    {event.tags.map((tag, index) => (
                      <Chip
                        key={index}
                        size="sm"
                        variant="flat"
                        color="secondary"
                        className="font-medium text-[10px] sm:text-xs md:text-small"
                      >
                        {tag}
                      </Chip>
                    ))}
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Organizer */}
            <Card className="border-none shadow-lg">
              <CardHeader className="pb-0 px-4 sm:px-6 md:px-8 pt-6">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Organized By</h2>
              </CardHeader>
              <CardBody className="pt-4 px-4 sm:px-6 md:px-8 pb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <Avatar
                    src={event.organizerAvatar}
                    name={event.organizerName}
                    size="lg"
                    className="w-12 sm:w-16 h-12 sm:h-16"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-sm sm:text-base md:text-lg line-clamp-1">{event.organizerName}</p>
                    <p className="text-xs sm:text-small text-default-500">Event Organizer</p>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Right Column - Registration Card */}
          <div className="lg:col-span-1">
            <Card className="border-none shadow-2xl sticky top-6 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
              <CardBody className="p-4 sm:p-6 space-y-4 sm:space-y-5 md:space-y-6">
                {/* Price */}
                <div>
                  <div className="flex items-baseline gap-2 sm:gap-3 mb-2">
                    {event.discountPrice && event.discountPrice < event.price ? (
                      <>
                        <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                          ₹{event.discountPrice}
                        </span>
                        <span className="text-xl sm:text-2xl text-default-400 line-through">
                          ₹{event.price}
                        </span>
                      </>
                    ) : (
                      <span className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground">
                        ₹{event.price}
                      </span>
                    )}
                  </div>
                  {event.discountPrice && event.discountPrice < event.price && (
                    <Badge color="success" variant="flat" size="sm" className="text-[10px] sm:text-xs md:text-small">
                      Save ₹{event.price - event.discountPrice} ({calculateDiscount(event.price, event.discountPrice)}% OFF)
                    </Badge>
                  )}
                </div>

                <Divider />

                {/* Registration Stats */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <UsersIcon className="w-4 sm:w-5 h-4 sm:h-5 text-default-500 flex-shrink-0" />
                      <span className="text-xs sm:text-small md:text-base text-default-600">Registered</span>
                    </div>
                    <span className="font-bold text-sm sm:text-base md:text-lg">
                      {event.registered}{event.capacity && `/${event.capacity}`}
                    </span>
                  </div>

                  {event.capacity && (
                    <>
                      <Progress
                        value={getRegistrationPercentage()}
                        size="md"
                        color={
                          getRegistrationPercentage() > 90 ? "danger" :
                            getRegistrationPercentage() > 70 ? "warning" : "primary"
                        }
                        className="mt-1.5 sm:mt-2"
                      />
                      <div className="flex items-center justify-between text-xs sm:text-small">
                        <span className="text-default-500">
                          {getSpotsLeft()} spots remaining
                        </span>
                        <span className={`font-semibold ${getRegistrationPercentage() > 90 ? "text-danger" :
                          getRegistrationPercentage() > 70 ? "text-warning" : "text-success"
                          }`}>
                          {Math.round(getRegistrationPercentage())}% filled
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <Divider />

                {/* Registration Button */}
                <div className="space-y-2 sm:space-y-3">
                  <Button
                    color={isRegistered ? "default" : "primary"}
                    variant={isRegistered ? "flat" : "solid"}
                    size="lg"
                    className="w-full font-bold text-xs sm:text-small md:text-base"
                    isLoading={registering}
                    onPress={handleRegister}
                    startContent={
                      isRegistered ?
                        <CheckCircleIcon className="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5" /> :
                        <TicketIcon className="w-3.5 sm:w-4 md:w-5 h-3.5 sm:h-4 md:h-5" />
                    }
                  >
                    {registering ? "Registering..." : isRegistered ? "You're Registered!" : "Register Now"}
                  </Button>

                  {isRegistered && (
                    <div className="p-3 sm:p-4 bg-success-50 dark:bg-success-900/20 rounded-lg sm:rounded-xl border border-success-200 dark:border-success-800">
                      <div className="flex items-start gap-2">
                        <CheckCircleIcon className="w-4 sm:w-5 h-4 sm:h-5 text-success flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-xs sm:text-small md:text-base text-success">
                            Registration Confirmed!
                          </p>
                          {emailSent && ticketId && (
                            <>
                              <p className="text-[10px] sm:text-xs md:text-small text-success-700 dark:text-success-300 mt-1">
                                <MailIcon className="w-3 h-3 inline mr-1" />
                                E-ticket sent to your email
                              </p>
                              <p className="text-[10px] sm:text-xs md:text-small text-success-700 dark:text-success-300 mt-1 font-mono bg-success-100 dark:bg-success-900/30 p-1.5 sm:p-2 rounded break-all">
                                🎫 {ticketId}
                              </p>
                            </>
                          )}
                          {isRegistered && !emailSent && (
                            <p className="text-[10px] sm:text-xs md:text-small text-success-700 dark:text-success-300 mt-1">
                              Check your email for event details
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {!isRegistered && getSpotsLeft() !== null && getSpotsLeft()! < 10 && (
                    <div className="p-3 sm:p-4 bg-warning-50 dark:bg-warning-900/20 rounded-lg sm:rounded-xl border border-warning-200 dark:border-warning-800">
                      <div className="flex items-start gap-2">
                        <TrendingUpIcon className="w-4 sm:w-5 h-4 sm:h-5 text-warning flex-shrink-0 mt-0.5" />
                        <p className="text-[10px] sm:text-xs md:text-small text-warning-700 dark:text-warning-300">
                          <span className="font-semibold">Filling fast!</span> Only {getSpotsLeft()} spots left
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <Divider />

                {/* Features */}
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <CheckCircleIcon className="w-4 sm:w-5 h-4 sm:h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-small md:text-base">Instant confirmation</span>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <CheckCircleIcon className="w-4 sm:w-5 h-4 sm:h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-small md:text-base">E-ticket included</span>
                  </div>
                  <div className="flex items-start gap-2 sm:gap-3">
                    <CheckCircleIcon className="w-4 sm:w-5 h-4 sm:h-5 text-success flex-shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-small md:text-base">Certificate of attendance</span>
                  </div>
                  {event.isPremium && (
                    <div className="flex items-start gap-2 sm:gap-3">
                      <CrownIcon className="w-4 sm:w-5 h-4 sm:h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                      <span className="text-xs sm:text-small md:text-base font-semibold text-purple-600">Premium perks included</span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}