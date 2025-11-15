// app/tickets/TicketsPageContent.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Divider } from "@heroui/divider";
import { title, subtitle } from "@/components/primitives";
import { useAuth } from "@/context/AuthContext";
import { eventService } from "@/lib/database";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import {
  TicketIcon,
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  ArrowLeftIcon,
  DownloadIcon,
  PrinterIcon,
  ShareIcon,
  QrCodeIcon,
  CheckCircle,
} from "lucide-react";

interface Ticket {
  ticketId: string | undefined;
  eventId: string;
  eventTitle: string;
  userName: string;
  userEmail: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  registeredAt: string;
  price?: number;
  discountPrice?: number | null;
  ticketQRData?: string; // Stored QR code data
}

export default function TicketsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  // Get eventId from query parameters for auto-selection
  const eventIdParam = searchParams?.get("eventId");

  const loadTickets = async () => {
    try {
      setTicketsLoading(true);

      if (!user) {
        console.error("❌ No user found");
        setTickets([]);
        return;
      }

      console.log("🔄 Loading tickets from database for user:", user.$id);

      // Try to load from database first
      try {
        const databaseTickets = await eventService.getUserTickets(user.$id);
        console.log("✅ Tickets loaded from database:", databaseTickets.length);

        if (databaseTickets && databaseTickets.length > 0) {
          // Sort by registered date (newest first)
          const sortedTickets = [...databaseTickets].sort(
            (a: any, b: any) =>
              new Date(b.registeredAt).getTime() -
              new Date(a.registeredAt).getTime()
          ) as Ticket[];
          setTickets(sortedTickets);

          // Auto-select ticket if eventId is in query params
          if (eventIdParam) {
            const selectedTicketForEvent = sortedTickets.find(
              (t: any) => t.eventId === eventIdParam
            );
            if (selectedTicketForEvent) {
              setSelectedTicket(selectedTicketForEvent as Ticket);
              console.log(
                "✅ Auto-selected ticket for event:",
                eventIdParam
              );
            }
          }
          return;
        }
      } catch (dbError) {
        console.warn(
          "⚠️ Database error, falling back to localStorage:",
          dbError
        );
      }

      // Fallback to localStorage if database is empty or fails
      console.log("📱 Falling back to localStorage...");
      const registered = localStorage.getItem("registeredEvents");
      const registeredEvents = registered ? JSON.parse(registered) : [];

      console.log("📋 Registered Events from localStorage:", registeredEvents);

      const allTickets: Ticket[] = [];

      registeredEvents.forEach((eventId: string) => {
        const ticketData = localStorage.getItem(`ticket_${eventId}`);
        console.log(
          `🎫 Ticket data for event ${eventId}:`,
          ticketData
        );
        if (ticketData) {
          allTickets.push(JSON.parse(ticketData));
        }
      });

      console.log("✅ All tickets loaded from localStorage:", allTickets);

      // Sort by registered date (newest first)
      const sortedAllTickets = [...allTickets].sort(
        (a: any, b: any) =>
          new Date(b.registeredAt).getTime() -
          new Date(a.registeredAt).getTime()
      ) as Ticket[];

      setTickets(sortedAllTickets);

      // Auto-select ticket if eventId is in query params
      if (eventIdParam) {
        const selectedTicketForEvent = sortedAllTickets.find(
          (t: any) => t.eventId === eventIdParam
        );
        if (selectedTicketForEvent) {
          setSelectedTicket(selectedTicketForEvent as Ticket);
          console.log(
            "✅ Auto-selected ticket for event:",
            eventIdParam
          );
        }
      }
    } catch (error) {
      console.error("❌ Error loading tickets:", error);
      setTickets([]);
    } finally {
      setTicketsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (user) {
      loadTickets();
    }
  }, [user, authLoading, router]);

  const getQRCodeUrl = (ticket: Ticket) => {
    if (!ticket.ticketId || !ticket.userName || !ticket.eventTitle) return '';
    
    // Use stored QR data if available, otherwise generate it
    let ticketData = ticket.ticketQRData;
    if (!ticketData) {
      // Fallback to generating on-the-fly if not stored
      ticketData = `TICKET|${ticket.ticketId}|${ticket.userName}|${ticket.eventTitle}`;
    }
    
    const encoded = encodeURIComponent(ticketData);
    return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encoded}`;
  };

  const handleDownloadTicket = async (ticket: Ticket) => {
    try {
      // Fetch QR code image and convert to data URL
      const qrCodeUrl = getQRCodeUrl(ticket);
      const qrResponse = await fetch(qrCodeUrl);
      const qrBlob = await qrResponse.blob();
      const qrDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(qrBlob);
      });

      // Create a temporary container for rendering
      const tempContainer = document.createElement("div");
      tempContainer.style.position = "absolute";
      tempContainer.style.left = "-9999px";
      tempContainer.style.width = "800px";
      tempContainer.style.backgroundColor = "white";
      tempContainer.style.padding = "40px";
      tempContainer.style.fontFamily =
        "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

      const dateStr = new Date(ticket.date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const registeredStr = new Date(ticket.registeredAt).toLocaleDateString(
        "en-US",
        {
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }
      );

      const ticketQRData = ticket.ticketQRData || `TICKET|${ticket.ticketId}|${ticket.userName}|${ticket.eventTitle}`;

      tempContainer.innerHTML = `
        <div style="max-width: 600px; margin: 0 auto;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: white; padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
            <div style="font-size: 48px; margin-bottom: 15px;">🎫</div>
            <div style="font-size: 28px; font-weight: 700; margin-bottom: 8px; letter-spacing: 1px;">EVENT TICKET</div>
            <div style="font-size: 14px; opacity: 0.9; font-weight: 500; letter-spacing: 2px;">MIND MESH COMMUNITY</div>
          </div>

          <!-- Body -->
          <div style="padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none;">
            <!-- Ticket ID Section -->
            <div style="background: linear-gradient(135deg, #f0e7ff 0%, #ede9fe 100%); border: 2px solid #8b5cf6; border-radius: 10px; padding: 20px; margin-bottom: 30px; text-align: center;">
              <div style="font-size: 11px; color: #666; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 600;">Ticket ID</div>
              <div style="font-family: 'Courier New', monospace; font-size: 20px; font-weight: 700; color: #8b5cf6; word-break: break-all; margin-bottom: 8px;">${ticket.ticketId}</div>
              <div style="display: inline-block; background: #16a34a; color: white; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600;">✓ CONFIRMED</div>
            </div>

            <!-- Event Information -->
            <div style="margin-bottom: 28px;">
              <div style="font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb;">📅 Event Information</div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <div style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Event</div>
                <div style="font-size: 15px; color: #333; font-weight: 500; text-align: right; flex: 1;">${ticket.eventTitle}</div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <div style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Date</div>
                <div style="font-size: 15px; color: #333; font-weight: 500; text-align: right; flex: 1;">${dateStr}</div>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <div style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Time</div>
                <div style="font-size: 15px; color: #333; font-weight: 500; text-align: right; flex: 1;">${ticket.time}</div>
              </div>
            </div>

            <!-- Venue & Location -->
            <div style="background: #f9f5ff; border-left: 4px solid #8b5cf6; padding: 20px; border-radius: 6px; margin-bottom: 28px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <div style="font-size: 12px; color: #666; font-weight: 600;">📍 VENUE</div>
                <div style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${ticket.venue}</div>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <div style="font-size: 12px; color: #666; font-weight: 600;">📍 LOCATION</div>
                <div style="font-size: 14px; color: #333; font-weight: 600; text-align: right;">${ticket.location}</div>
              </div>
            </div>

            <!-- Attendee Information -->
            <div style="margin-bottom: 28px;">
              <div style="font-size: 13px; color: #666; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; margin-bottom: 16px; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb;">👤 Attendee Information</div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <div style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Name</div>
                <div style="font-size: 15px; color: #333; font-weight: 500; text-align: right; flex: 1;">${ticket.userName}</div>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px;">
                <div style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Email</div>
                <div style="font-size: 15px; color: #333; font-weight: 500; text-align: right; flex: 1; word-break: break-all;">${ticket.userEmail}</div>
              </div>
              <div style="display: flex; justify-content: space-between;">
                <div style="font-size: 12px; color: #999; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">Registered</div>
                <div style="font-size: 15px; color: #333; font-weight: 500; text-align: right; flex: 1;">${registeredStr}</div>
              </div>
            </div>

            <div style="height: 1px; background: #e5e7eb; margin: 24px 0;"></div>

            <!-- QR Code and Data Side-by-Side -->
            <div class="qr-code-section" style="display: flex; gap: 20px; margin-bottom: 24px; align-items: flex-start;">
              <!-- QR Code Image -->
              <div style="flex-shrink: 0;">
                <div style="font-size: 11px; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 700;">📱 QR Code</div>
                <div style="background: white; border: 1px solid #e9d5ff; border-radius: 6px; padding: 8px;">
                  <img src="${qrDataUrl}" alt="QR Code" style="width: 140px; height: 140px; display: block;" />
                </div>
              </div>
              <!-- QR Data -->
              <div style="flex: 1;">
                <div style="font-size: 11px; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 700;">📋 QR Data (Text Format)</div>
                <div style="background: #f5f3ff; border: 1px solid #e9d5ff; border-radius: 6px; padding: 12px;">
                  <div style="font-family: 'Courier New', monospace; font-size: 10px; color: #6b21a8; word-break: break-all; line-height: 1.6;">${ticketQRData}</div>
                </div>
              </div>
            </div>

            <!-- Instructions -->
            <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 20px; border-radius: 6px; margin-bottom: 24px;">
              <div style="font-size: 12px; color: #16a34a; text-transform: uppercase; font-weight: 700; margin-bottom: 12px; letter-spacing: 1px;">✓ Instructions</div>
              <ul style="font-size: 13px; color: #334155; line-height: 1.8; margin: 0; padding-left: 20px;">
                <li style="margin-bottom: 8px;">Please arrive 15 minutes before the event starts</li>
                <li style="margin-bottom: 8px;">Bring this ticket or show it on your mobile device</li>
                <li style="margin-bottom: 8px;">Present your ticket at the event entrance</li>
                <li>Keep this ticket safe for future reference</li>
              </ul>
            </div>

            <!-- Footer -->
            <div style="border-top: 2px dashed #e5e7eb; padding-top: 24px; text-align: center;">
              <div style="font-size: 11px; color: #999; margin-bottom: 4px;">Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
              <div style="font-size: 12px; color: #8b5cf6; font-weight: 700; letter-spacing: 1px;">MIND MESH EVENT MANAGEMENT</div>
              <div style="font-size: 11px; color: #999; margin-top: 12px; font-style: italic;">Please bring valid ID to the event</div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(tempContainer);

      // Convert HTML to canvas
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        logging: false,
        backgroundColor: "#ffffff",
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL("image/png");

      // Handle multi-page PDFs
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if content exceeds one page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`ticket_${ticket.ticketId}.pdf`);

      // Clean up
      document.body.removeChild(tempContainer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const handlePrintTicket = (ticket: Ticket) => {
    const dateStr = new Date(ticket.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeStr = ticket.time;
    const registeredStr = new Date(ticket.registeredAt).toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Event Ticket - ${ticket.eventTitle}</title>
            <style>
              * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
              }
              
              body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: #f5f5f5;
                padding: 20px;
                color: #333;
              }
              
              .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                border-radius: 12px;
                overflow: hidden;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
              }
              
              .ticket-header {
                background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
                color: white;
                padding: 40px 30px;
                text-align: center;
              }
              
              .ticket-icon {
                font-size: 48px;
                margin-bottom: 15px;
              }
              
              .ticket-title {
                font-size: 28px;
                font-weight: 700;
                margin-bottom: 8px;
                letter-spacing: 1px;
              }
              
              .ticket-brand {
                font-size: 14px;
                opacity: 0.9;
                font-weight: 500;
                letter-spacing: 2px;
              }
              
              .ticket-body {
                padding: 40px 30px;
              }
              
              .ticket-id-section {
                background: linear-gradient(135deg, #f0e7ff 0%, #ede9fe 100%);
                border: 2px solid #8b5cf6;
                border-radius: 10px;
                padding: 20px;
                margin-bottom: 30px;
                text-align: center;
              }
              
              .label-small {
                font-size: 11px;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 8px;
                font-weight: 600;
              }
              
              .ticket-id {
                font-family: 'Courier New', monospace;
                font-size: 20px;
                font-weight: 700;
                color: #8b5cf6;
                word-break: break-all;
              }
              
              .section {
                margin-bottom: 28px;
              }
              
              .section-title {
                font-size: 13px;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 1.5px;
                font-weight: 700;
                margin-bottom: 16px;
                padding-bottom: 10px;
                border-bottom: 2px solid #e5e7eb;
              }
              
              .info-row {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 12px;
              }
              
              .info-label {
                font-size: 12px;
                color: #999;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 600;
                min-width: 120px;
              }
              
              .info-value {
                font-size: 15px;
                color: #333;
                font-weight: 500;
                text-align: right;
                flex: 1;
              }
              
              .highlight-section {
                background: #f9f5ff;
                border-left: 4px solid #8b5cf6;
                padding: 20px;
                border-radius: 6px;
                margin-bottom: 28px;
              }
              
              .highlight-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
              }
              
              .highlight-row:last-child {
                margin-bottom: 0;
              }
              
              .highlight-label {
                font-size: 12px;
                color: #666;
                font-weight: 600;
              }
              
              .highlight-value {
                font-size: 18px;
                color: #8b5cf6;
                font-weight: 700;
              }
              
              .divider {
                height: 1px;
                background: #e5e7eb;
                margin: 24px 0;
              }

              @media print {
                .qr-code-section {
                  page-break-before: always;
                  margin-top: 40px;
                }
              }
              
              .qr-code-section {
                display: flex;
                gap: 20px;
                margin-bottom: 24px;
                align-items: flex-start;
              }
              
              .instructions {
                background: #f0fdf4;
                border-left: 4px solid #16a34a;
                padding: 20px;
                border-radius: 6px;
                margin-bottom: 24px;
              }
              
              .instructions-title {
                font-size: 12px;
                color: #16a34a;
                text-transform: uppercase;
                font-weight: 700;
                margin-bottom: 12px;
                letter-spacing: 1px;
              }
              
              .instructions-list {
                font-size: 13px;
                color: #334155;
                line-height: 1.8;
              }
              
              .instructions-list li {
                margin-bottom: 8px;
                margin-left: 20px;
              }
              
              .ticket-footer {
                border-top: 2px dashed #e5e7eb;
                padding-top: 24px;
                text-align: center;
              }
              
              .footer-text {
                font-size: 11px;
                color: #999;
                margin-bottom: 4px;
              }
              
              .footer-brand {
                font-size: 12px;
                color: #8b5cf6;
                font-weight: 700;
                letter-spacing: 1px;
              }
              
              .qr-note {
                font-size: 11px;
                color: #999;
                margin-top: 12px;
                font-style: italic;
              }
              
              .status-badge {
                display: inline-block;
                background: #16a34a;
                color: white;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                margin-top: 8px;
              }
              
              @media print {
                body {
                  background: white;
                  padding: 0;
                }
                .container {
                  box-shadow: none;
                  max-width: 100%;
                }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <!-- Header -->
              <div class="ticket-header">
                <div class="ticket-icon">🎫</div>
                <div class="ticket-title">EVENT TICKET</div>
                <div class="ticket-brand">MIND MESH COMMUNITY</div>
              </div>
              
              <!-- Body -->
              <div class="ticket-body">
                <!-- Ticket ID Section -->
                <div class="ticket-id-section">
                  <div class="label-small">Ticket ID</div>
                  <div class="ticket-id">${ticket.ticketId}</div>
                  <div class="status-badge">✓ CONFIRMED</div>
                </div>
                
                <!-- Event Information -->
                <div class="section">
                  <div class="section-title">📅 Event Information</div>
                  <div class="info-row">
                    <div class="info-label">Event</div>
                    <div class="info-value">${ticket.eventTitle}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Date</div>
                    <div class="info-value">${dateStr}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Time</div>
                    <div class="info-value">${timeStr}</div>
                  </div>
                </div>
                
                <!-- Venue & Location -->
                <div class="highlight-section">
                  <div class="highlight-row">
                    <div class="highlight-label">📍 VENUE</div>
                    <div class="highlight-value" style="text-align: right; font-size: 14px; color: #333; font-weight: 600;">${ticket.venue}</div>
                  </div>
                  <div class="highlight-row">
                    <div class="highlight-label">📍 LOCATION</div>
                    <div class="highlight-value" style="text-align: right; font-size: 14px; color: #333; font-weight: 600;">${ticket.location}</div>
                  </div>
                </div>
                
                <!-- Attendee Information -->
                <div class="section">
                  <div class="section-title">👤 Attendee Information</div>
                  <div class="info-row">
                    <div class="info-label">Name</div>
                    <div class="info-value">${ticket.userName}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Email</div>
                    <div class="info-value">${ticket.userEmail}</div>
                  </div>
                  <div class="info-row">
                    <div class="info-label">Registered</div>
                    <div class="info-value">${registeredStr}</div>
                  </div>
                </div>
                
                <div class="divider"></div>
                
                <!-- QR Code and Data Side-by-Side -->
                <div style="display: flex; gap: 20px; margin-bottom: 24px; align-items: flex-start;">
                  <!-- QR Code Image -->
                  <div style="flex-shrink: 0;">
                    <div style="font-size: 11px; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 700;">📱 QR Code</div>
                    <div style="background: white; border: 1px solid #e9d5ff; border-radius: 6px; padding: 8px;">
                      <img src="${getQRCodeUrl(ticket)}" alt="QR Code" style="width: 140px; height: 140px; display: block;" />
                    </div>
                  </div>
                  <!-- QR Data -->
                  <div style="flex: 1;">
                    <div style="font-size: 11px; color: #7c3aed; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; font-weight: 700;">📋 QR Data (Text Format)</div>
                    <div style="background: #f5f3ff; border: 1px solid #e9d5ff; border-radius: 6px; padding: 12px;">
                      <div style="font-family: 'Courier New', monospace; font-size: 10px; color: #6b21a8; word-break: break-all; line-height: 1.6;">${ticket.ticketQRData || `TICKET|${ticket.ticketId}|${ticket.userName}|${ticket.eventTitle}`}</div>
                    </div>
                  </div>
                </div>
                
                <!-- Instructions -->
                <div class="instructions">
                  <div class="instructions-title">✓ Instructions</div>
                  <ul class="instructions-list">
                    <li>Please arrive 15 minutes before the event starts</li>
                    <li>Bring this ticket or show it on your mobile device</li>
                    <li>Present your ticket at the event entrance</li>
                    <li>Keep this ticket safe for future reference</li>
                  </ul>
                </div>
                
                <!-- Footer -->
                <div class="ticket-footer">
                  <div class="footer-text">Generated on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</div>
                  <div class="footer-brand">MIND MESH EVENT MANAGEMENT</div>
                  <div class="qr-note">Please bring valid ID to the event</div>
                </div>
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
      date: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(), // 7 days from now
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

  if (authLoading || ticketsLoading) {
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
    <div className="w-full min-h-screen bg-gradient-to-b from-default-50 to-default-100">
      {/* Main Container with responsive max-width */}
      <div className="px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <Button
            variant="light"
            startContent={<ArrowLeftIcon className="w-4 h-4" />}
            onPress={() => router.back()}
            className="mb-3 sm:mb-4"
            size="sm"
          >
            Back
          </Button>
          <h1 className={title({ size: "lg" })}>
            My <span className={title({ color: "violet", size: "lg" })}>Tickets</span>
          </h1>
          <p className={subtitle({ class: "mt-2 text-xs sm:text-sm md:text-base" })}>
            View and manage your registered event tickets
          </p>
        </div>

        {/* Empty State */}
        {tickets.length === 0 ? (
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            <Card className="border-none shadow-lg">
              <CardBody className="py-8 sm:py-12 md:py-16 text-center px-3 sm:px-4 md:px-8">
                <TicketIcon className="w-12 sm:w-14 md:w-16 h-12 sm:h-14 md:h-16 mx-auto text-default-300 mb-3 sm:mb-4" />
                <h2 className="text-lg sm:text-xl md:text-2xl font-semibold mb-2">
                  No Tickets Yet
                </h2>
                <p className="text-default-500 mb-4 sm:mb-6 text-xs sm:text-sm md:text-base px-2">
                  You haven't registered for any events yet. Browse and register
                  for events to get started!
                </p>
                <Button
                  color="primary"
                  size="lg"
                  onPress={() => router.push("/events")}
                  className="w-full sm:w-auto"
                >
                  Browse Events
                </Button>
              </CardBody>
            </Card>

            {/* Debug Information Card */}
            <Card className="border-default-300 bg-default/50">
              <CardHeader className="bg-default/60 px-3 sm:px-4 md:px-6 lg:px-8 pt-3 sm:pt-4 pb-2">
                <h3 className="text-xs sm:text-small md:text-base font-semibold">🔍 Troubleshooting</h3>
              </CardHeader>
              <CardBody className="text-xs sm:text-small space-y-2 sm:space-y-3 md:space-y-4 px-3 sm:px-4 md:px-6 lg:px-8">
              <div>
                <p>
                  <strong>How to get tickets:</strong>
                </p>
                <ol className="list-decimal list-inside space-y-1 text-default-600 mt-2">
                  <li>
                    Go to{" "}
                    <Button
                      variant="light"
                      size="sm"
                      className="h-auto p-0 text-xs"
                      onPress={() => router.push("/events")}
                    >
                      Events page
                    </Button>
                  </li>
                  <li>Find an event you're interested in</li>
                  <li>Click the ticket/register button</li>
                  <li>Complete the registration</li>
                  <li>You'll receive a confirmation and ticket ID</li>
                  <li>Your ticket will appear here automatically</li>
                </ol>
              </div>
              <p className="text-default-500">
                💡 <strong>Tip:</strong> Tickets are stored in your browser's
                local storage and persist across sessions.
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
        <div className="space-y-3 sm:space-y-4 md:space-y-6">
          {/* Summary Card */}
          <Card className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-200/50">
            <CardBody className="py-3 sm:py-4 md:py-5 lg:py-6 px-3 sm:px-4 md:px-6 lg:px-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs sm:text-sm md:text-base text-default-500">
                    Total Registered Events
                  </p>
                  <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary mt-1">
                    {tickets.length}
                  </h3>
                </div>
                <TicketIcon className="w-10 sm:w-11 md:w-12 h-10 sm:h-11 md:h-12 text-primary/40 flex-shrink-0" />
              </div>
            </CardBody>
          </Card>

          {/* Tickets List */}
          <div className="space-y-2 sm:space-y-3 md:space-y-4">
            {tickets.map((ticket) => (
              <Card
                key={ticket.ticketId}
                className="border-none shadow-md hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
                isPressable
                onPress={() => setSelectedTicket(ticket)}
              >
                <CardBody className="p-0 overflow-hidden">
                  {/* Card Top Accent */}
                  <div className="h-1 bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700" />

                  <div className="p-3 sm:p-4 md:p-5 lg:p-6 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                      {/* Ticket Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className="flex items-center justify-center w-9 sm:w-10 h-9 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 flex-shrink-0 mt-0.5 sm:mt-1">
                            <TicketIcon className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base md:text-lg font-bold line-clamp-2 text-gray-900">
                              {ticket.eventTitle}
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5 sm:mt-1 font-mono truncate">
                              ID:{" "}
                              <span className="font-semibold text-purple-600">
                                {ticket.ticketId?.substring(0, 8)}...
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Event Details Grid */}
                        <div className="mt-3 sm:mt-4 space-y-1.5 sm:space-y-2 ml-6 sm:ml-8">
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                            <CalendarIcon className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0 text-purple-500" />
                            <span className="font-medium truncate">
                              {new Date(ticket.date).toLocaleDateString(
                                "en-US",
                                {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                }
                              )}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                            <ClockIcon className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0 text-purple-500" />
                            <span className="font-medium">{ticket.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                            <MapPinIcon className="w-3.5 sm:w-4 h-3.5 sm:h-4 flex-shrink-0 text-purple-500" />
                            <span className="line-clamp-1 font-medium">
                              {ticket.location}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge & Registration Date */}
                      <div className="flex flex-col gap-2 sm:items-end sm:justify-start sm:ml-3">
                        <Chip
                          startContent={<CheckCircle className="w-3.5 h-3.5" />}
                          color="success"
                          variant="flat"
                          size="sm"
                          className="font-semibold text-xs sm:text-sm w-fit"
                        >
                          Confirmed
                        </Chip>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 font-semibold uppercase tracking-tight">
                            Registered
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-gray-700 mt-0.5">
                            {new Date(ticket.registeredAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <Divider className="my-2 sm:my-3" />
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-3">
                      <div className="flex gap-1.5 sm:gap-2 flex-1">
                        <Button
                          size="sm"
                          variant="flat"
                          startContent={<DownloadIcon className="w-3.5 h-3.5" />}
                          onPress={() => handleDownloadTicket(ticket)}
                          className="flex-1 font-semibold text-xs sm:text-sm transition-all hover:bg-purple-100 active:scale-95"
                          color="primary"
                        >
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          startContent={<PrinterIcon className="w-4 h-4" />}
                          onPress={() => handlePrintTicket(ticket)}
                          className="flex-1 font-semibold transition-all hover:bg-purple-100"
                          color="primary"
                        >
                          Print
                        </Button>
                        <Button
                          size="sm"
                          variant="flat"
                          startContent={<ShareIcon className="w-4 h-4" />}
                          onPress={() => handleShareTicket(ticket)}
                          className="flex-1 font-semibold transition-all hover:bg-purple-100"
                          color="primary"
                        >
                          Share
                        </Button>
                      </div>
                      
                      {/* QR Code Preview */}
                      {getQRCodeUrl(ticket) && (
                        <div className="flex items-center justify-center p-2 bg-default-100 rounded-lg border border-default-200">
                          <img
                            src={getQRCodeUrl(ticket)}
                            alt="Ticket QR Code"
                            className="w-12 h-12 sm:w-14 sm:h-14"
                            title="Your check-in QR code"
                          />
                        </div>
                      )}
                    </div>
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
          className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-2 sm:p-3 md:p-4 overflow-y-auto"
          onClick={() => setSelectedTicket(null)}
        >
          <Card className="w-full max-w-lg sm:max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto my-4 sm:my-auto">
            <CardHeader className="flex flex-col gap-1 items-start px-3 sm:px-4 md:px-6 lg:px-8 pt-4 sm:pt-6 md:pt-8 pb-0">
              <div className="flex items-center justify-between w-full gap-2">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold break-words">
                  Ticket Details
                </h2>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onPress={() => setSelectedTicket(null)}
                  className="flex-shrink-0"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>

            <CardBody className="p-3 sm:p-4 md:p-6 lg:p-8 space-y-3 sm:space-y-4 md:space-y-6">
              {/* Ticket ID */}
              <div className="bg-default/50 p-3 sm:p-4 md:p-6 rounded-lg">
                <div className="flex items-start gap-2 sm:gap-3">
                  <QrCodeIcon className="w-5 sm:w-6 h-5 sm:h-6 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-small text-default-500">
                      Ticket ID
                    </p>
                    <p className="text-xs sm:text-sm md:text-lg font-mono font-semibold text-primary break-all">
                      {selectedTicket.ticketId}
                    </p>
                  </div>
                </div>
              </div>

              <Divider />

              {/* QR Code Display */}
              {getQRCodeUrl(selectedTicket) && (
                <>
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 p-4 sm:p-6 md:p-8 rounded-xl border border-purple-200/50 dark:border-purple-800/50">
                    <div className="flex flex-col gap-4">
                      <div>
                        <h3 className="text-sm sm:text-base font-semibold text-center mb-2 text-default-700">
                          📱 Your Check-In QR Code
                        </h3>
                        <p className="text-xs sm:text-small text-center text-default-500 mb-4">
                          Show this to staff when checking in at the venue
                        </p>
                      </div>
                      
                      {/* QR Code and Data Side-by-Side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {/* QR Code */}
                        <div className="flex justify-center">
                          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-default-200">
                            <img
                              src={getQRCodeUrl(selectedTicket)}
                              alt="Ticket QR Code"
                              className="w-48 h-48 sm:w-56 sm:h-56"
                              title="Scan this QR code for check-in"
                            />
                          </div>
                        </div>
                        
                        {/* QR Data */}
                        {(() => {
                          const qrData = selectedTicket.ticketQRData || `TICKET|${selectedTicket.ticketId}|${selectedTicket.userName}|${selectedTicket.eventTitle}`;
                          return (
                            <div className="flex flex-col justify-center">
                              <div className="bg-white dark:bg-default-900 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                                <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 mb-3">QR Data (Text Format):</p>
                                <p className="text-xs font-mono text-purple-600 dark:text-purple-400 break-all leading-relaxed bg-purple-50 dark:bg-purple-950/50 p-3 rounded border border-purple-200 dark:border-purple-800">
                                  {qrData}
                                </p>
                                <p className="text-xs text-default-500 mt-3">
                                  ✅ This is the unique data encoded in your QR code. Save it for your records.
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      
                      <p className="text-xs text-center text-default-500 max-w-full">
                        💡 <strong>Tip:</strong> You can take a screenshot, download, or print this QR code and present it at the event.
                      </p>
                    </div>
                  </div>

                  <Divider />
                </>
              )}

              {/* Event Details */}
              <div>
                <h3 className="text-sm sm:text-base md:text-lg font-semibold mb-3 sm:mb-4">
                  Event Information
                </h3>
                <div className="space-y-2 sm:space-y-3 md:space-y-4">
                  <div>
                    <p className="text-xs md:text-small font-semibold text-default-500 mb-1">
                      Event Title
                    </p>
                    <p className="text-sm md:text-base">
                      {selectedTicket.eventTitle}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs md:text-small font-semibold text-default-500 mb-1">
                      Date
                    </p>
                    <p className="text-sm md:text-base">
                      {new Date(selectedTicket.date).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs md:text-small font-semibold text-default-500 mb-1">
                      Time
                    </p>
                    <p className="text-sm md:text-base">
                      {selectedTicket.time}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs md:text-small font-semibold text-default-500 mb-1">
                      Venue
                    </p>
                    <p className="text-sm md:text-base">
                      {selectedTicket.venue}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs md:text-small font-semibold text-default-500 mb-1">
                      Location
                    </p>
                    <p className="text-sm md:text-base">
                      {selectedTicket.location}
                    </p>
                  </div>
                </div>
              </div>

              <Divider />

              {/* Attendee Details */}
              <div>
                <h3 className="text-base md:text-lg font-semibold mb-4">
                  Attendee Information
                </h3>
                <div className="space-y-3 md:space-y-4">
                  <div>
                    <p className="text-xs md:text-small font-semibold text-default-500 mb-1">
                      Name
                    </p>
                    <p className="text-sm md:text-base">
                      {selectedTicket.userName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs md:text-small font-semibold text-default-500 mb-1">
                      Email
                    </p>
                    <p className="text-sm md:text-base break-all">
                      {selectedTicket.userEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs md:text-small font-semibold text-default-500 mb-1">
                      Registered At
                    </p>
                    <p className="text-sm md:text-base">
                      {new Date(selectedTicket.registeredAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
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
    </div>
  );
}
