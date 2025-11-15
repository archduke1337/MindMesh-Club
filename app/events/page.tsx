// app/events/page.tsx
"use client";

import {Card, CardBody, CardFooter} from "@heroui/card";
import {Button} from "@heroui/button";
import {Badge} from "@heroui/badge";
import {Chip} from "@heroui/chip";
import {Progress} from "@heroui/progress";
import {Input} from "@heroui/input";
import {Select, SelectItem} from "@heroui/select";
import {subtitle, title} from "@/components/primitives";
import {useCallback, useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {useAuth} from "@/context/AuthContext";
import {type Event as EventType, eventService} from "@/lib/database";
import {getErrorMessage} from "@/lib/errorHandler";
import {eventStorageManager} from "@/lib/eventStorageManager";
import {
    CalendarIcon,
    CrownIcon,
    HeartIcon,
    MapPinIcon,
    SearchIcon,
    SparklesIcon,
    StarIcon,
    TicketIcon,
    UsersIcon
} from "lucide-react";

// Toast notification helper (replace alert with this)
const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // TODO: Integrate with your toast library (e.g., react-hot-toast, sonner)
};

export default function EventsPage() {
    const {user} = useAuth();
    const router = useRouter();
    const [selectedCategory, setSelectedCategory] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState("date");
    const [savedEvents, setSavedEvents] = useState<string[]>([]);
    const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);
    const [events, setEvents] = useState<EventType[]>([]);
    const [loading, setLoading] = useState(true);
    const [registering, setRegistering] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Memoize loadEvents to prevent recreation
    const loadEvents = useCallback(async () => {
        try {
            setError(null);
            console.log('🔄 Loading events from database...');
            const allEvents = await eventService.getUpcomingEvents();
            console.log('✅ Events loaded:', allEvents.length);
            setEvents(allEvents);
        } catch (err) {
            const message = getErrorMessage(err);
            console.error("❌ Error loading events:", message);
            setError(message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Memoize sync function
    const syncRegisteredEventsFromDatabase = useCallback(async () => {
        if (!user) return;

        try {
            console.log('🔄 Syncing registered events for user:', user.$id);
            const userTickets = await eventService.getUserTickets(user.$id);

            if (userTickets && userTickets.length > 0) {
                const registeredEventIds = userTickets.map(ticket => ticket.eventId);
                const mergedIds = eventStorageManager.syncRegistrations(registeredEventIds);
                setRegisteredEvents(mergedIds);
                console.log('✅ Registered events synced:', mergedIds.length);
            }
        } catch (err) {
            console.warn('⚠️ Warning syncing registered events:', getErrorMessage(err));
        }
    }, [user]);

    const loadSavedEvents = useCallback(() => {
        setSavedEvents(eventStorageManager.getSavedEvents());
        setRegisteredEvents(eventStorageManager.getRegisteredEvents());
    }, []);

    // Load events and sync on mount and when user changes
    useEffect(() => {
        loadEvents();
        loadSavedEvents();
    }, [loadEvents, loadSavedEvents]);

    useEffect(() => {
        if (user) {
            syncRegisteredEventsFromDatabase();
        }
    }, [user, syncRegisteredEventsFromDatabase]);

    const categories = [
        {key: "all", label: "All Events"},
        {key: "conference", label: "Conferences"},
        {key: "workshop", label: "Workshops"},
        {key: "masterclass", label: "Masterclasses"},
        {key: "competition", label: "Competitions"},
        {key: "bootcamp", label: "Bootcamps"},
        {key: "forum", label: "Forums"},
    ];

    // Memoize filtered and sorted events
    const filteredEvents = useMemo(() => {
        return events
            .filter(event =>
                selectedCategory === "all" || event.category === selectedCategory
            )
            .filter(event => {
                const query = searchQuery.toLowerCase().trim();
                return (
                    event.title.toLowerCase().includes(query) ||
                    event.description.toLowerCase().includes(query) ||
                    event.tags.some(tag => tag.toLowerCase().includes(query))
                );
            })
            .sort((a, b) => {
                switch (sortBy) {
                    case "date":
                        return new Date(a.date).getTime() - new Date(b.date).getTime();
                    case "price":
                        return (a.discountPrice || a.price) - (b.discountPrice || b.price);
                    case "popularity":
                        return b.registered - a.registered;
                    default:
                        return 0;
                }
            });
    }, [events, selectedCategory, searchQuery, sortBy]);

    const toggleSaveEvent = useCallback((e: any, eventId: string) => {
        e.stopPropagation();
        eventStorageManager.toggleSavedEvent(eventId);
        setSavedEvents(eventStorageManager.getSavedEvents());
    }, []);

    const toggleRegisterEvent = useCallback(async (e: any, eventId: string) => {
        e.stopPropagation();

        if (!user) {
            showNotification("Please login to register for events", "info");
            router.push("/login");
            return;
        }

        if (registeredEvents.includes(eventId)) {
            const confirmed = confirm("Are you sure you want to unregister from this event?");
            if (!confirmed) return;

            try {
                setRegistering(eventId);
                await eventService.unregisterFromEvent(eventId, user.$id);
                console.log("✅ Unregistered from event in database");
            } catch (err) {
                console.warn("⚠️ Unregister failed:", getErrorMessage(err));
                showNotification("Failed to unregister. Please try again.", "error");
                setRegistering(null);
                return;
            }

            eventStorageManager.removeRegisteredEvent(eventId);
            eventStorageManager.deleteTicket(eventId);
            
            // Sync with database to get updated state
            await syncRegisteredEventsFromDatabase();
            
            // Reload event to get updated registered count from database
            try {
                const updatedEvent = await eventService.getEventById(eventId);
                setEvents(prevEvents =>
                    prevEvents.map(e =>
                        e.$id === eventId ? {...e, registered: updatedEvent.registered} : e
                    )
                );
            } catch (err) {
                console.warn("⚠️ Failed to reload event data:", getErrorMessage(err));
            }
            
            setRegistering(null);
            showNotification("Successfully unregistered from event", "success");
            return;
        }

        setRegistering(eventId);
        try {
            const event = events.find(e => e.$id === eventId);
            if (!event) throw new Error("Event not found");

            console.log("🔄 Registering for event:", eventId);

            const response = await fetch('/api/events/register', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
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

            const ticketData = {
                ticketId: result.ticketId,
                eventId: event.$id || eventId,
                eventTitle: event.title,
                userName: user.name,
                userEmail: user.email,
                date: event.date,
                time: event.time,
                venue: event.venue,
                location: event.location,
                registeredAt: new Date().toISOString(),
                ticketQRData: `TICKET|${result.ticketId}|${user.name}|${event.title}`,
            };

            eventStorageManager.setTicket(eventId, ticketData);
            eventStorageManager.addRegisteredEvent(eventId);
            
            // Sync with database to get updated registration state
            await syncRegisteredEventsFromDatabase();
            
            // Reload event to get updated registered count from database
            try {
                const updatedEvent = await eventService.getEventById(eventId);
                setEvents(prevEvents =>
                    prevEvents.map(e =>
                        e.$id === eventId ? {...e, registered: updatedEvent.registered} : e
                    )
                );
            } catch (err) {
                console.warn("⚠️ Failed to reload event data:", getErrorMessage(err));
            }

            showNotification(
                `🎉 Registration Successful! E-ticket sent to ${user.email}. Ticket ID: ${result.ticketId}`,
                "success"
            );
        } catch (err) {
            const message = getErrorMessage(err);
            console.error("Registration error:", message);
            showNotification(`❌ ${message}`, "error");
        } finally {
            setRegistering(null);
        }
    }, [user, events, registeredEvents, router, syncRegisteredEventsFromDatabase]);

    const handleEventClick = useCallback((eventId: string) => {
        router.push(`/events/${eventId}`);
    }, [router]);

    const formatDate = (dateString: string): string => {
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } catch {
            return "Invalid date";
        }
    };

    const calculateDiscount = (original: number, discount: number): number => {
        return Math.round(((original - discount) / original) * 100);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"/>
                    <p className="mt-4 text-default-500">Loading events...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button color="primary" onPress={() => loadEvents()}>
                        Retry
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 sm:space-y-10 md:space-y-12 pb-12 sm:pb-16 md:pb-20">
            {/* Hero Section */}
            <div
                className="text-center space-y-4 sm:space-y-5 md:space-y-6 relative py-8 sm:py-10 md:py-12 px-3 sm:px-4 md:px-6">
                <div
                    className="absolute top-0 left-1/4 w-64 sm:w-80 md:w-96 h-64 sm:h-80 md:h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"/>
                <div
                    className="absolute top-12 sm:top-16 md:top-20 right-1/4 w-64 sm:w-80 md:w-96 h-64 sm:h-80 md:h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse"/>
                <div
                    className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 mb-4 sm:mb-5 md:mb-6">
                    <SparklesIcon className="w-4 sm:w-4.5 md:w-5 h-4 sm:h-4.5 md:h-5 text-purple-500"/>
                    <span
                        className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Upcoming Events
          </span>
                </div>
                <div className="relative z-10">
                    <h1 className={title({size: "lg"})}>
                        Discover{" "}
                        <span className={title({color: "violet", size: "lg"})}>
              Amazing Events
            </span>
                    </h1>
                    <p className={subtitle({class: "mt-4 sm:mt-5 md:mt-6 max-w-3xl mx-auto text-base sm:text-lg md:text-xl"})}>
                        Join our community events, workshops, and conferences to learn, network, and grow together
                    </p>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <Card className="border-none shadow-lg bg-white/60 dark:bg-gray-900/60 backdrop-blur-xl">
                        <CardBody className="p-3 sm:p-4 md:p-5 lg:p-6">
                            <div className="flex flex-col gap-2.5 sm:gap-3 md:gap-4">
                                <div className="w-full">
                                    <Input
                                        placeholder="Search events..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        startContent={<SearchIcon
                                            className="w-3.5 sm:w-4 md:w-4.5 h-3.5 sm:h-4 md:h-4.5 text-default-400"/>}
                                        size="lg"
                                        classNames={{
                                            input: "text-xs sm:text-sm md:text-base",
                                            label: "text-xs sm:text-sm",
                                        }}
                                    />
                                </div>

                                <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 md:gap-4 w-full">
                                    <Select
                                        label="Sort by"
                                        selectedKeys={[sortBy]}
                                        onChange={(e) => setSortBy(e.target.value)}
                                        size="lg"
                                        className="flex-1"
                                        classNames={{
                                            label: "text-xs sm:text-sm",
                                            value: "text-xs sm:text-sm md:text-base",
                                        }}
                                    >
                                        <SelectItem key="date">Date</SelectItem>
                                        <SelectItem key="price">Price</SelectItem>
                                        <SelectItem key="popularity">Popularity</SelectItem>
                                    </Select>

                                    <Select
                                        label="Category"
                                        selectedKeys={[selectedCategory]}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        size="lg"
                                        className="flex-1"
                                    >
                                        {categories.map(category => (
                                            <SelectItem key={category.key}>{category.label}</SelectItem>
                                        ))}
                                    </Select>
                                </div>
                            </div>
                        </CardBody>
                    </Card>
                </div>
            </div>

            {/* Events Grid */}
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 w-full">
                <div
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
                    {filteredEvents.map((event) => (
                        <Card
                            key={event.$id}
                            className="border-none hover:shadow-2xl transition-all duration-300 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl group cursor-pointer"
                            shadow="lg"
                            isPressable
                            onPress={() => handleEventClick(event.$id!)}
                        >
                            <CardBody className="p-0 overflow-hidden">
                                <div className="relative">
                                    <img
                                        src={event.image}
                                        alt={event.title}
                                        className="w-full h-40 sm:h-44 md:h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                                    />

                                    <div
                                        className="absolute top-2 sm:top-3 md:top-4 left-2 sm:left-3 md:left-4 flex flex-col gap-1.5 sm:gap-2">
                                        {event.isFeatured && (
                                            <Badge color="warning" variant="solid"
                                                   className="font-bold text-xs sm:text-sm">
                                                <StarIcon className="w-2.5 sm:w-3 md:w-3.5 h-2.5 sm:h-3 md:h-3.5 mr-1"/>
                                                Featured
                                            </Badge>
                                        )}
                                        {event.isPremium && (
                                            <Badge color="secondary" variant="solid"
                                                   className="font-bold text-xs sm:text-sm">
                                                <CrownIcon
                                                    className="w-2.5 sm:w-3 md:w-3.5 h-2.5 sm:h-3 md:h-3.5 mr-1"/>
                                                Premium
                                            </Badge>
                                        )}
                                    </div>

                                    <Button
                                        isIconOnly
                                        variant="flat"
                                        className="absolute top-2 sm:top-3 md:top-4 right-2 sm:right-3 md:right-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm"
                                        size="sm"
                                        onPress={(e) => toggleSaveEvent(e, event.$id!)}
                                    >
                                        <HeartIcon
                                            className={`w-3 sm:w-3.5 md:w-4 h-3 sm:h-3.5 md:h-4 ${
                                                savedEvents.includes(event.$id!)
                                                    ? "fill-red-500 text-red-500"
                                                    : "text-gray-600"
                                            }`}
                                        />
                                    </Button>

                                    {event.discountPrice && event.discountPrice < event.price && (
                                        <div
                                            className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-2 sm:left-3 md:left-4">
                                            <Badge color="danger" variant="solid" className="text-xs sm:text-sm">
                                                {calculateDiscount(event.price, event.discountPrice)}% OFF
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                <div
                                    className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-2 sm:space-y-2.5 md:space-y-3 lg:space-y-4">
                                    <div className="flex items-start justify-between">
                                        <h3 className="font-bold text-sm sm:text-base md:text-lg line-clamp-2 group-hover:text-primary transition-colors">
                                            {event.title}
                                        </h3>
                                    </div>

                                    <p className="text-default-600 line-clamp-2 text-xs sm:text-sm md:text-base">
                                        {event.description}
                                    </p>

                                    <div className="space-y-2 sm:space-y-2.5 md:space-y-3">
                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-default-500">
                                            <CalendarIcon
                                                className="w-3 sm:w-3.5 md:w-4 h-3 sm:h-3.5 md:h-4 flex-shrink-0"/>
                                            <span className="truncate">{formatDate(event.date)}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-default-500">
                                            <MapPinIcon
                                                className="w-3 sm:w-3.5 md:w-4 h-3 sm:h-3.5 md:h-4 flex-shrink-0"/>
                                            <span className="truncate">{event.location}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-xs sm:text-sm text-default-500">
                                            <UsersIcon
                                                className="w-3 sm:w-3.5 md:w-4 h-3 sm:h-3.5 md:h-4 flex-shrink-0"/>
                                            <span className="truncate">{event.registered} registered</span>
                                            {event.capacity && (
                                                <span className="text-xs text-default-400 whitespace-nowrap">
                          • {Math.max(0, event.capacity - event.registered)} left
                        </span>
                                            )}
                                        </div>
                                    </div>

                                    {event.capacity && (
                                        <Progress
                                            value={(event.registered / event.capacity) * 100}
                                            size="sm"
                                            color="primary"
                                            className="mt-2"
                                        />
                                    )}

                                    <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-2 sm:pt-2.5 md:pt-3">
                                        {event.tags.slice(0, 3).map((tag, index) => (
                                            <Chip key={index} size="sm" variant="flat" color="primary"
                                                  className="text-xs sm:text-sm">
                                                {tag}
                                            </Chip>
                                        ))}
                                        {event.tags.length > 3 && (
                                            <Chip size="sm" variant="flat" className="text-xs sm:text-sm">
                                                +{event.tags.length - 3}
                                            </Chip>
                                        )}
                                    </div>
                                </div>
                            </CardBody>

                            <CardFooter className="px-3 sm:px-4 md:px-5 lg:px-6 pb-3 sm:pb-4 md:pb-5 lg:pb-6 pt-0">
                                <div className="flex flex-col gap-2 sm:gap-2.5 md:gap-3 w-full">
                                    <div className="flex items-center gap-2 sm:gap-2.5">
                                        {event.discountPrice && event.discountPrice < event.price ? (
                                            <>
                        <span className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                          ${event.discountPrice}
                        </span>
                                                <span
                                                    className="text-sm sm:text-base md:text-lg text-default-400 line-through">
                          ${event.price}
                        </span>
                                            </>
                                        ) : (
                                            <span className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">
                        ${event.price}
                      </span>
                                        )}
                                    </div>

                                    <div className="w-full">
                                        {registeredEvents.includes(event.$id!) ? (
                                            <Button
                                                color="success"
                                                variant="solid"
                                                size="md"
                                                startContent={<TicketIcon
                                                    className="w-3 sm:w-3.5 md:w-4 h-3 sm:h-3.5 md:h-4"/>}
                                                onPress={() => router.push(`/tickets?eventId=${event.$id}`)}
                                                className="w-full text-xs sm:text-sm md:text-base"
                                            >
                                                Get Ticket
                                            </Button>
                                        ) : (
                                            <Button
                                                color="primary"
                                                variant="solid"
                                                size="md"
                                                isLoading={registering === event.$id}
                                                onPress={(e) => toggleRegisterEvent(e, event.$id!)}
                                                endContent={<TicketIcon
                                                    className="w-3 sm:w-3.5 md:w-4 h-3 sm:h-3.5 md:h-4"/>}
                                                className="w-full text-xs sm:text-sm md:text-base"
                                            >
                                                Register
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                </div>

                {filteredEvents.length === 0 && (
                    <div className="text-center py-8 sm:py-10 md:py-12">
                        <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">🎯</div>
                        <h3 className="text-base sm:text-lg md:text-xl font-semibold mb-2">No events found</h3>
                        <p className="text-xs sm:text-sm text-default-500">
                            Try adjusting your search or filter criteria
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
