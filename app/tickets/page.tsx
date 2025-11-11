// app/tickets/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader, CardFooter } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { title, subtitle } from "@/components/primitives";
import { useAuth } from "@/context/AuthContext";
import {
  TicketIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  DownloadIcon,
  PrinterIcon,
  ShareIcon,
  CheckCircle,
  ArrowLeftIcon,
  QrCodeIcon,
} from "lucide-react";

interface Ticket {
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

export default function TicketsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      loadTickets();
    }
  }, [user, loading, router]);

  const loadTickets = () => {
    try {
      setTicketsLoading(true);
      const registered = localStorage.getItem("registeredEvents");
      const registeredEvents = registered ? JSON.parse(registered) : [];
      
      console.log("📋 Registered Events from localStorage:", registeredEvents);
      
      const allTickets: Ticket[] = [];
      
      registeredEvents.forEach((eventId: string) => {
        const ticketData = localStorage.getItem(`ticket_${eventId}`);
        console.log(`🎫 Ticket data for event ${eventId}:`, ticketData);
        if (ticketData) {
          allTickets.push(JSON.parse(ticketData));
        }
      });

      console.log("✅ All tickets loaded:", allTickets);

      // Sort by registered date (newest first)
      allTickets.sort((a, b) => 
        new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime()
      );

      setTickets(allTickets);
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setTicketsLoading(false);
    }
  };

  const handleDownloadTicket = (ticket: Ticket) => {
    // Create a simple text representation of the ticket
    const ticketText = `
MIND MESH EVENT TICKET
=======================

Ticket ID: ${ticket.ticketId}
Event: ${ticket.eventTitle}
Date: ${new Date(ticket.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
Time: ${ticket.time}
Venue: ${ticket.venue}
Location: ${ticket.location}

Attendee: ${ticket.userName}
Email: ${ticket.userEmail}

Registered: ${new Date(ticket.registeredAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}

Please present this ticket at the event entrance.
    `;

    // Create blob and download
    const element = document.createElement("a");
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(ticketText));
    element.setAttribute("download", `ticket_${ticket.ticketId}.txt`);
    element.style.display = "none";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handlePrintTicket = (ticket: Ticket) => {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Event Ticket - ${ticket.eventTitle}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 40px; }
              .ticket { 
                border: 2px solid #8b5cf6; 
                padding: 30px; 
                border-radius: 10px;
                max-width: 600px;
                margin: 0 auto;
              }
              .header { text-align: center; margin-bottom: 30px; }
              .title { font-size: 24px; font-weight: bold; color: #8b5cf6; }
              .subtitle { font-size: 14px; color: #666; margin-top: 5px; }
              .section { margin: 20px 0; }
              .label { font-weight: bold; color: #333; }
              .value { color: #666; margin-top: 5px; }
              .divider { border-top: 1px solid #ddd; margin: 20px 0; }
              .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #999; }
            </style>
          </head>
          <body>
            <div class="ticket">
              <div class="header">
                <div class="title">🎫 EVENT TICKET</div>
                <div class="subtitle">Mind Mesh</div>
              </div>

              <div class="section">
                <div class="label">Ticket ID</div>
                <div class="value">${ticket.ticketId}</div>
              </div>

              <div class="section">
                <div class="label">Event</div>
                <div class="value">${ticket.eventTitle}</div>
              </div>

              <div class="divider"></div>

              <div class="section">
                <div class="label">Date</div>
                <div class="value">${new Date(ticket.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
              </div>

              <div class="section">
                <div class="label">Time</div>
                <div class="value">${ticket.time}</div>
              </div>

              <div class="section">
                <div class="label">Venue</div>
                <div class="value">${ticket.venue}</div>
              </div>

              <div class="section">
                <div class="label">Location</div>
                <div class="value">${ticket.location}</div>
              </div>

              <div class="divider"></div>

              <div class="section">
                <div class="label">Attendee</div>
                <div class="value">${ticket.userName}</div>
              </div>

              <div class="section">
                <div class="label">Email</div>
                <div class="value">${ticket.userEmail}</div>
              </div>

              <div class="footer">
                <p>Please present this ticket at the event entrance.</p>
                <p>Registered: ${new Date(ticket.registeredAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleShareTicket = async (ticket: Ticket) => {
    const shareText = `I'm registered for ${ticket.eventTitle} on ${new Date(ticket.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} at ${ticket.venue}. You should join too!`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Event Ticket",
          text: shareText,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(shareText).then(() => {
        alert("Ticket details copied to clipboard!");
      });
    }
  };

  const createTestTicket = () => {
    const testEventId = `test-event-${Date.now()}`;
    const testTicket: Ticket = {
      ticketId: `TKT-${Date.now()}-TEST`,
      eventId: testEventId,
      eventTitle: "Test Event - Mind Mesh Community Meetup",
      userName: user?.name || "Test User",
      userEmail: user?.email || "test@example.com",
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      time: "6:00 PM",
      venue: "Community Center - Main Hall",
      location: "San Francisco, CA",
      registeredAt: new Date().toISOString(),
    };

    // Store ticket and registered event
    localStorage.setItem(`ticket_${testEventId}`, JSON.stringify(testTicket));
    
    const registered = localStorage.getItem("registeredEvents");
    const registeredEvents = registered ? JSON.parse(registered) : [];
    if (!registeredEvents.includes(testEventId)) {
      registeredEvents.push(testEventId);
      localStorage.setItem("registeredEvents", JSON.stringify(registeredEvents));
    }

    // Reload tickets
    loadTickets();
    alert("✅ Test ticket created! Refresh the page to see it.");
  };

  if (loading || ticketsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="mt-4 text-default-500">Loading your tickets...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 md:py-8">
      {/* Header */}
      <div className="mb-8">
        <Button
          variant="light"
          startContent={<ArrowLeftIcon className="w-4 h-4" />}
          onPress={() => router.back()}
          className="mb-4"
          size="sm"
        >
          Back
        </Button>
        <h1 className={title({ size: "lg" })}>
          My <span className={title({ color: "violet", size: "lg" })}>Tickets</span>
        </h1>
        <p className={subtitle({ class: "mt-2 text-sm md:text-base" })}>
          View and manage your registered event tickets
        </p>
      </div>

      {/* Empty State */}
      {tickets.length === 0 ? (
        <div className="space-y-4 md:space-y-6">
          <Card className="border-none shadow-lg">
            <CardBody className="py-12 md:py-16 text-center px-4 md:px-8">
              <TicketIcon className="w-16 h-16 mx-auto text-default-300 mb-4" />
              <h2 className="text-xl md:text-2xl font-semibold mb-2">No Tickets Yet</h2>
              <p className="text-default-500 mb-6 text-sm md:text-base">
                You haven't registered for any events yet. Browse and register for events to get started!
              </p>
              <Button
                color="primary"
                size="lg"
                onPress={() => router.push("/events")}
              >
                Browse Events
              </Button>
            </CardBody>
          </Card>

          {/* Debug Information Card */}
          <Card className="border-default-300 bg-default/50">
            <CardHeader className="bg-default/60 px-4 sm:px-6 md:px-8 pt-4 pb-2">
              <h3 className="text-small font-semibold">🔍 Troubleshooting</h3>
            </CardHeader>
            <CardBody className="text-xs md:text-small space-y-4 px-4 sm:px-6 md:px-8">
              <div>
                <p>
                  <strong>How to get tickets:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-default-600 mt-2">
                  <li>Go to <Button variant="light" size="sm" className="h-auto p-0 text-xs" onPress={() => router.push("/events")}>Events page</Button></li>
                  <li>Find an event you're interested in</li>
                  <li>Click the ticket/register button</li>
                  <li>Complete the registration</li>
                  <li>You'll receive a confirmation and ticket ID</li>
                  <li>Your ticket will appear here automatically</li>
                </ol>
              </div>
              <p className="text-default-500">
                💡 <strong>Tip:</strong> Tickets are stored in your browser's local storage and persist across sessions.
              </p>
              <Button
                size="sm"
                variant="flat"
                color="secondary"
                onPress={createTestTicket}
                className="w-full"
              >
                🧪 Create Test Ticket (For Demo)
              </Button>
            </CardBody>
          </Card>
        </div>
      ) : (
        <div className="space-y-4 md:space-y-6">
          {/* Summary Card */}
          <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-200/50">
            <CardBody className="py-4 md:py-6 px-4 md:px-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm md:text-base text-default-500">Total Registered Events</p>
                  <h3 className="text-2xl md:text-3xl font-bold text-primary">{tickets.length}</h3>
                </div>
                <TicketIcon className="w-12 h-12 text-primary/40" />
              </div>
            </CardBody>
          </Card>

          {/* Tickets List */}
          <div className="space-y-3 md:space-y-4">
            {tickets.map((ticket) => (
              <Card
                key={ticket.ticketId}
                className="border-none shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                isPressable
                onPress={() => setSelectedTicket(ticket)}
              >
                <CardBody className="p-4 md:p-6 gap-4">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    {/* Ticket Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-3">
                        <TicketIcon className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
                        <div className="flex-1 min-w-0">
                          <h3 className="text-base md:text-lg font-semibold line-clamp-2">
                            {ticket.eventTitle}
                          </h3>
                          <p className="text-xs md:text-small text-default-500 mt-1">
                            ID: {ticket.ticketId}
                          </p>
                        </div>
                      </div>

                      {/* Event Details */}
                      <div className="mt-4 space-y-2 ml-8">
                        <div className="flex items-center gap-2 text-xs md:text-small text-default-600">
                          <CalendarIcon className="w-4 h-4 flex-shrink-0" />
                          <span>
                            {new Date(ticket.date).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs md:text-small text-default-600">
                          <ClockIcon className="w-4 h-4 flex-shrink-0" />
                          <span>{ticket.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs md:text-small text-default-600">
                          <MapPinIcon className="w-4 h-4 flex-shrink-0" />
                          <span className="line-clamp-1">{ticket.location}</span>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col gap-2 md:items-end md:justify-start">
                      <Chip
                        startContent={<CheckCircle className="w-4 h-4" />}
                        color="success"
                        variant="flat"
                        size="sm"
                      >
                        Registered
                      </Chip>
                      <p className="text-xs text-default-500 text-right">
                        Registered:{" "}
                        {new Date(ticket.registeredAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <Divider className="my-2" />
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="flat"
                      startContent={<DownloadIcon className="w-4 h-4" />}
                      onPress={() => handleDownloadTicket(ticket)}
                      className="flex-1"
                    >
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      startContent={<PrinterIcon className="w-4 h-4" />}
                      onPress={() => handlePrintTicket(ticket)}
                      className="flex-1"
                    >
                      Print
                    </Button>
                    <Button
                      size="sm"
                      variant="flat"
                      startContent={<ShareIcon className="w-4 h-4" />}
                      onPress={() => handleShareTicket(ticket)}
                      className="flex-1"
                    >
                      Share
                    </Button>
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div
          className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4"
          onClick={() => setSelectedTicket(null)}
        >
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-col gap-1 items-start px-4 sm:px-6 md:px-8 pt-6 sm:pt-8 pb-0">
              <div className="flex items-center justify-between w-full">
                <h2 className="text-xl md:text-2xl font-bold">Ticket Details</h2>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={() => setSelectedTicket(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>

            <CardBody className="p-4 sm:p-6 md:p-8 space-y-4 md:space-y-6">
              {/* Ticket ID */}
              <div className="bg-default/50 p-4 md:p-6 rounded-lg">
                <div className="flex items-center gap-3">
                  <QrCodeIcon className="w-6 h-6 text-primary" />
                  <div>
                    <p className="text-xs md:text-small text-default-500">Ticket ID</p>
                    <p className="text-sm md:text-lg font-mono font-semibold text-primary break-all">
                      {selectedTicket.ticketId}
                    </p>
                  </div>
                </div>
              </div>

              <Divider />

              {/* Event Details */}
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-4">Event Information</h3>
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <p className="text-xs md:text-small font-semibold text-default-500 mb-1">Event Title</p>
                    <p className="text-sm md:text-base">{selectedTicket.eventTitle}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-small font-semibold text-default-500 mb-1">Date</p>
                    <p className="text-sm md:text-base">
                      {new Date(selectedTicket.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs md:text-small font-semibold text-default-500 mb-1">Time</p>
                    <p className="text-sm md:text-base">{selectedTicket.time}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-small font-semibold text-default-500 mb-1">Venue</p>
                    <p className="text-sm md:text-base">{selectedTicket.venue}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-small font-semibold text-default-500 mb-1">Location</p>
                    <p className="text-sm md:text-base">{selectedTicket.location}</p>
                  </div>
                </div>
              </div>

              <Divider />

              {/* Attendee Details */}
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-4">Attendee Information</h3>
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <p className="text-xs md:text-small font-semibold text-default-500 mb-1">Name</p>
                    <p className="text-sm md:text-base">{selectedTicket.userName}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-small font-semibold text-default-500 mb-1">Email</p>
                    <p className="text-sm md:text-base break-all">{selectedTicket.userEmail}</p>
                  </div>
                  <div>
                    <p className="text-xs md:text-small font-semibold text-default-500 mb-1">Registered At</p>
                    <p className="text-sm md:text-base">
                      {new Date(selectedTicket.registeredAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <Divider />

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2">
                <Button
                  color="primary"
                  startContent={<DownloadIcon className="w-4 h-4" />}
                  size="lg"
                  className="flex-1"
                  onPress={() => {
                    handleDownloadTicket(selectedTicket);
                    setSelectedTicket(null);
                  }}
                >
                  Download Ticket
                </Button>
                <Button
                  variant="flat"
                  startContent={<PrinterIcon className="w-4 h-4" />}
                  size="lg"
                  className="flex-1"
                  onPress={() => {
                    handlePrintTicket(selectedTicket);
                    setSelectedTicket(null);
                  }}
                >
                  Print Ticket
                </Button>
                <Button
                  variant="flat"
                  startContent={<ShareIcon className="w-4 h-4" />}
                  size="lg"
                  className="flex-1"
                  onPress={() => {
                    handleShareTicket(selectedTicket);
                    setSelectedTicket(null);
                  }}
                >
                  Share
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
