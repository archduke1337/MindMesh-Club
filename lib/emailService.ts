// lib/emailService.ts
// FINAL VERSION - Matches your EmailJS template exactly

// Generate a unique ticket ID
const generateTicketId = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let ticketId = 'TKT-';
  for (let i = 0; i < 8; i++) {
    ticketId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return ticketId;
};

// Generate QR code URL (using free QR code API)
// Updated to use ticket QR format: TICKET|ticketId|userName|eventTitle
const generateQRCode = (ticketId: string, userName?: string, eventTitle?: string): string => {
  let qrData = ticketId;
  
  // If additional info provided, use ticket QR format for venue check-in
  if (userName && eventTitle) {
    qrData = `TICKET|${ticketId}|${userName}|${eventTitle}`;
  }
  
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
};

// Format date for email (e.g., "Monday, January 15, 2025")
const formatEventDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Send email using EmailJS - Matches your template exactly
const sendEmailWithEmailJS = async (
  toEmail: string,
  toName: string,
  eventTitle: string,
  eventDate: string,
  eventTime: string,
  eventVenue: string,
  eventLocation: string,
  ticketId: string,
  qrCodeUrl: string,
  organizerName: string,
  eventPrice: number
): Promise<boolean> => {
  try {
    const formattedDate = formatEventDate(eventDate);
    
    console.log('📧 Sending email with EmailJS...');
    console.log('To:', toEmail);
    console.log('Event:', eventTitle);
    console.log('Ticket ID:', ticketId);
    
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        service_id: process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID || "",
        template_id: process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID || "",
        user_id: process.env.NEXT_PUBLIC_EMAILJS_USER_ID || "",
        template_params: {
          to_email: toEmail,
          to_name: toName,
          event_title: eventTitle,
          event_date: formattedDate,
          event_time: eventTime,
          event_venue: eventVenue,
          event_location: eventLocation,
          ticket_id: ticketId,
          qr_code_url: qrCodeUrl,
          organizer_name: organizerName,
          event_price: eventPrice.toString(),
        },
      }),
    });

    if (response.ok) {
      console.log('✅ Email sent successfully!');
      console.log('Response:', await response.text());
      return true;
    } else {
      const errorText = await response.text();
      console.error('❌ EmailJS Error Response:', errorText);
      return false;
    }
  } catch (error) {
    console.error('❌ EmailJS Network Error:', error);
    return false;
  }
};

// Main function to send registration confirmation with e-ticket
export const sendRegistrationEmail = async (
  userEmail: string,
  userName: string,
  ticketId: string,
  eventData: {
    title: string;
    date: string;
    time: string;
    venue: string;
    location: string;
    image?: string;
    organizerName: string;
    price: number;
    discountPrice?: number | null;
  }
): Promise<{ success: boolean; ticketId: string }> => {
  try {
    // Use the provided ticket ID from registration
    const qrCodeUrl = generateQRCode(ticketId, userName, eventData.title);
    const actualPrice = eventData.discountPrice || eventData.price;

    console.log('📧 Starting email registration process...');
    console.log('User:', userName, '(', userEmail, ')');
    console.log('Event:', eventData.title);
    console.log('Generated Ticket ID:', ticketId);
    console.log('QR Code URL:', qrCodeUrl);

    // Send the email
    const sent = await sendEmailWithEmailJS(
      userEmail,
      userName,
      eventData.title,
      eventData.date,
      eventData.time,
      eventData.venue,
      eventData.location,
      ticketId,
      qrCodeUrl,
      eventData.organizerName,
      actualPrice
    );

    if (sent) {
      console.log('✅ Registration email sent successfully!');
      console.log('Ticket ID:', ticketId);
    } else {
      console.warn('⚠️ Email failed to send, but ticket was generated');
      console.log('Ticket ID:', ticketId);
    }

    return {
      success: sent,
      ticketId: ticketId,
    };
  } catch (error) {
    console.error('❌ Unexpected error in sendRegistrationEmail:', error);
    // Still generate and return a ticket ID even if email fails
    return {
      success: false,
      ticketId: ticketId,
    };
  }
};

// Export helper functions for use elsewhere
export { generateTicketId, generateQRCode };