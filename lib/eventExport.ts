// lib/eventExport.ts
// Export event statistics to CSV, PDF and other formats

import { Event, Registration } from "./database";
import { EventMetrics } from "./eventAnalytics";
import { jsPDF } from "jspdf";

/**
 * Generate PDF for registration list
 */
export function generateRegistrationListPDF(
  eventTitle: string,
  eventDate: string,
  registrations: Registration[]
): Blob {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(18);
  doc.text("Event Registration List", 14, 22);
  
  // Event Info
  doc.setFontSize(11);
  doc.text(`Event: ${eventTitle}`, 14, 32);
  doc.text(`Date: ${new Date(eventDate).toLocaleDateString()}`, 14, 40);
  doc.text(`Total Registrations: ${registrations.length}`, 14, 48);
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 56);

  // Table headers
  const startY = 66;
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - 2 * margin;
  
  // Column widths
  const col1Width = 60;  // Name
  const col2Width = 80;  // Email
  const col3Width = 50;  // Registration Date
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Name", margin, startY);
  doc.text("Email", margin + col1Width, startY);
  doc.text("Registration Date", margin + col1Width + col2Width, startY);
  
  // Draw line
  doc.setDrawColor(200);
  doc.line(margin, startY + 2, pageWidth - margin, startY + 2);
  
  // Table rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  let currentY = startY + 10;
  const rowHeight = 8;
  const pageBottomMargin = 20;
  
  registrations.forEach((reg, index) => {
    // Check if we need a new page
    if (currentY + rowHeight > pageHeight - pageBottomMargin) {
      doc.addPage();
      currentY = 14;
      
      // Repeat header on new page
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("Name", margin, currentY);
      doc.text("Email", margin + col1Width, currentY);
      doc.text("Registration Date", margin + col1Width + col2Width, currentY);
      
      doc.setDrawColor(200);
      doc.line(margin, currentY + 2, pageWidth - margin, currentY + 2);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      currentY += 8;
    }
    
    const regDate = new Date(reg.registeredAt).toLocaleDateString();
    
    // Wrap text for long emails
    const email = reg.userEmail.length > 35 ? reg.userEmail.substring(0, 35) + "..." : reg.userEmail;
    
    doc.text(reg.userName, margin, currentY);
    doc.text(email, margin + col1Width, currentY);
    doc.text(regDate, margin + col1Width + col2Width, currentY);
    
    currentY += rowHeight;
  });
  
  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} of ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: "center" }
    );
  }
  
  return doc.output("blob");
}

/**
 * Download registration list as PDF
 */
export function downloadRegistrationListPDF(
  eventTitle: string,
  eventDate: string,
  registrations: Registration[]
): void {
  const pdfBlob = generateRegistrationListPDF(eventTitle, eventDate, registrations);
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement("a");
  
  link.href = url;
  link.download = `${eventTitle.replace(/\s+/g, "_")}_registrations.pdf`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generate CSV content for event statistics

/**
 * Generate CSV content for event statistics
 */
export function generateEventStatsCSV(
  event: Event,
  metrics: EventMetrics,
  registrations: Registration[]
): string {
  const lines: string[] = [];

  // Header
  lines.push("MindMesh Event Statistics Report");
  lines.push("================================\n");

  // Event Info
  lines.push("EVENT INFORMATION");
  lines.push(`Title,${event.title}`);
  lines.push(`Date,${event.date}`);
  lines.push(`Time,${event.time}`);
  lines.push(`Location,${event.location}`);
  lines.push(`Category,${event.category}`);
  lines.push(`Price,$${event.price}`);
  if (event.discountPrice) {
    lines.push(`Discount Price,$${event.discountPrice}`);
  }
  lines.push("");

  // Statistics
  lines.push("REGISTRATION STATISTICS");
  lines.push(`Total Registered,${metrics.totalRegistered}`);
  lines.push(`Capacity,${metrics.capacity}`);
  lines.push(`Registration %,${Math.round(metrics.registrationPercentage)}%`);
  lines.push(`Spots Remaining,${metrics.spotsRemaining}`);
  lines.push(`Full,${metrics.isFull ? "Yes" : "No"}`);
  lines.push("");

  // Revenue
  const totalRevenue = registrations.reduce((sum, reg) => {
    const price = event.discountPrice || event.price;
    return sum + price;
  }, 0);

  lines.push("REVENUE METRICS");
  lines.push(`Unit Price,$${event.discountPrice || event.price}`);
  lines.push(`Total Revenue,$${totalRevenue}`);
  lines.push(`Average Revenue Per Attendee,$${totalRevenue > 0 ? (totalRevenue / registrations.length).toFixed(2) : 0}`);
  lines.push("");

  // Registrations Table
  lines.push("DETAILED REGISTRATIONS");
  lines.push("User Name,Email,Registered At");
  registrations.forEach((reg) => {
    const date = new Date(reg.registeredAt).toLocaleString();
    lines.push(`"${reg.userName}","${reg.userEmail}","${date}"`);
  });

  return lines.join("\n");
}

/**
 * Trigger CSV download
 */
export function downloadEventStatsCSV(
  event: Event,
  metrics: EventMetrics,
  registrations: Registration[]
): void {
  const csv = generateEventStatsCSV(event, metrics, registrations);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", `${event.title.replace(/\s+/g, "_")}_stats.csv`);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Generate registration list for export
 */
export function generateRegistrationList(registrations: Registration[]): string {
  const lines: string[] = [];
  lines.push("Registered Users Report");
  lines.push("=======================\n");
  lines.push("Name,Email,Registration Date\n");

  registrations.forEach((reg) => {
    const date = new Date(reg.registeredAt).toLocaleDateString();
    lines.push(`${reg.userName},${reg.userEmail},${date}`);
  });

  return lines.join("\n");
}

/**
 * Trigger registration list download as PDF
 * @deprecated Use downloadRegistrationListPDF instead
 */
export function downloadRegistrationList(eventTitle: string, registrations: Registration[]): void {
  // Get the first registration date to pass as eventDate
  const eventDate = registrations.length > 0 
    ? new Date().toISOString() 
    : new Date().toISOString();
  downloadRegistrationListPDF(eventTitle, eventDate, registrations);
}

/**
 * Generate shareable stats summary
 */
export function generateStatsShareText(event: Event, metrics: EventMetrics): string {
  return `🎉 ${event.title}\n📍 ${event.location}\n📅 ${event.date}\n\n` +
    `👥 ${metrics.totalRegistered}/${metrics.capacity} registered (${Math.round(metrics.registrationPercentage)}%)\n` +
    `💰 $${event.price}${event.discountPrice ? ` (on sale: $${event.discountPrice})` : ''}\n\n` +
    `Register: https://mindmesh.club/events/${event.$id}`;
}
