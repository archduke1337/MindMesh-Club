// app/api/events/register/route.ts
// Server-side endpoint for atomic event registration to prevent race conditions
import { NextRequest, NextResponse } from 'next/server';
import { ID } from 'appwrite';
import { ZodError } from 'zod';
import { sendRegistrationEmail } from '@/lib/emailService';
import { DATABASE_ID, REGISTRATIONS_COLLECTION_ID, EVENTS_COLLECTION_ID } from '@/lib/database';
import { getErrorMessage } from '@/lib/errorHandler';
import { registrationSchema } from '@/lib/validation/schemas';
import { handleZodError } from '@/lib/utils/errorHandling';
import { verifyAuth } from '@/lib/apiAuth';

interface RegisterRequestBody {
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
}

interface RegisterResponseBody {
  success: boolean;
  message: string;
  ticketId?: string;
  error?: string;
}

/**
 * POST /api/events/register
 * 
 * Atomically registers a user for an event on the server side.
 * This prevents race conditions that could occur with client-side registration.
 * 
 * Uses admin credentials to bypass user permissions and ensure registration succeeds.
 */
export async function POST(request: NextRequest): Promise<NextResponse<RegisterResponseBody>> {
  try {
    // Verify authentication via session cookie
    const { authenticated, user: authUser } = await verifyAuth(request);
    if (!authenticated || !authUser) {
      return NextResponse.json(
        { success: false, message: 'Authentication required', error: 'You must be logged in to register' },
        { status: 401 }
      );
    }

    const body: RegisterRequestBody = await request.json();

    // Validate input with Zod
    try {
      registrationSchema.parse(body);
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            success: false,
            message: 'Validation failed',
            error: handleZodError(error),
          },
          { status: 400 }
        );
      }
      throw error;
    }

    const { eventId } = body;
    // Use server-verified user identity instead of trusting request body
    const userId = authUser.$id;
    const userName = authUser.name || body.userName;
    const userEmail = authUser.email;

    console.log(`[API] Registering user ${userId} for event ${eventId}`);

    // Use REST API with admin API key for server-side database operations
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!;
    const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!;
    const apiKey = process.env.APPWRITE_API_KEY;

    // Helper for admin REST API calls
    const adminHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Appwrite-Project": projectId,
    };
    if (apiKey) {
      adminHeaders["X-Appwrite-Key"] = apiKey;
    }

    const adminFetch = async (path: string, options: RequestInit = {}) => {
      const res = await fetch(`${endpoint}${path}`, {
        ...options,
        headers: { ...adminHeaders, ...(options.headers || {}) },
      });
      return res;
    };

    const databaseId = DATABASE_ID;
    const registrationsCollectionId = REGISTRATIONS_COLLECTION_ID;

    // Check if already registered
    try {
      const listRes = await adminFetch(
        `/databases/${databaseId}/collections/${registrationsCollectionId}/documents?queries[]=${encodeURIComponent(`equal("eventId", ["${eventId}"])`)}&queries[]=${encodeURIComponent(`equal("userId", ["${userId}"])`)}&queries[]=${encodeURIComponent('limit(1)')}`
      );

      if (listRes.ok) {
        const existingRegistrations = await listRes.json();
        if (existingRegistrations.documents?.length > 0) {
          const existingRegistration = existingRegistrations.documents[0];
          console.log(`[API] Found existing registration: ${existingRegistration.$id}`);
          return NextResponse.json(
            {
              success: true,
              message: 'Already registered for this event',
              ticketId: existingRegistration.$id,
            },
            { status: 200 }
          );
        }
      }
    } catch (listError) {
      console.error('[API] Error checking existing registrations:', listError);
    }

    // Get event to check capacity
    let event: any;
    try {
      const eventRes = await adminFetch(
        `/databases/${databaseId}/collections/${EVENTS_COLLECTION_ID}/documents/${eventId}`
      );
      if (!eventRes.ok) {
        return NextResponse.json(
          { success: false, message: 'Event not found', error: 'The event does not exist' },
          { status: 404 }
        );
      }
      event = await eventRes.json();
    } catch (getError) {
      console.error('[API] Error fetching event:', getError);
      return NextResponse.json(
        { success: false, message: 'Event not found', error: 'The event does not exist' },
        { status: 404 }
      );
    }

    if (event.capacity && event.registered >= event.capacity) {
      return NextResponse.json(
        { success: false, message: 'Event is full', error: 'Event is full' },
        { status: 409 }
      );
    }

    // Create registration document with QR code data
    let registration: any;
    try {
      const ticketDocId = ID.unique();
      const eventTitle = event.title;
      const ticketQRData = `TICKET|${ticketDocId}|${userName}|${eventTitle}`;

      const createRes = await adminFetch(
        `/databases/${databaseId}/collections/${registrationsCollectionId}/documents`,
        {
          method: "POST",
          body: JSON.stringify({
            documentId: ticketDocId,
            data: {
              eventId,
              userId,
              userName,
              userEmail,
              registeredAt: new Date().toISOString(),
              ticketQRData,
            },
          }),
        }
      );

      if (!createRes.ok) {
        const errorText = await createRes.text();
        console.error('[API] Error creating registration:', errorText);
        return NextResponse.json(
          { success: false, message: 'Failed to create registration', error: errorText },
          { status: 500 }
        );
      }

      registration = await createRes.json();
    } catch (createError) {
      console.error('[API] Error creating registration:', createError);
      return NextResponse.json(
        { success: false, message: 'Failed to create registration', error: getErrorMessage(createError) },
        { status: 500 }
      );
    }

    const ticketId = registration.$id || '';

    if (!ticketId) {
      throw new Error('Registration created but no ticket ID returned');
    }

    console.log(`[API] Registration successful: ${ticketId}`);

    // Update event registered count - re-read to minimize race condition window
    try {
      const freshEventRes = await adminFetch(
        `/databases/${databaseId}/collections/${EVENTS_COLLECTION_ID}/documents/${eventId}`
      );
      const freshEvent = freshEventRes.ok ? await freshEventRes.json() : event;
      
      await adminFetch(
        `/databases/${databaseId}/collections/${EVENTS_COLLECTION_ID}/documents/${eventId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            data: { registered: (freshEvent.registered || 0) + 1 },
          }),
        }
      );
      console.log(`[API] Updated event registered count`);
    } catch (updateError) {
      console.warn(`[API] Warning: failed to update event registered count:`, updateError);
    }

    // Try to send email in the background (don't block if it fails)
    try {
      await sendRegistrationEmail(userEmail, userName, ticketId, {
        title: event.title,
        date: event.date,
        time: event.time,
        venue: event.venue,
        location: event.location,
        image: event.image,
        organizerName: event.organizerName,
        price: event.price,
        discountPrice: event.discountPrice,
      });
      console.log(`[API] Email sent to ${userEmail}`);
    } catch (emailError) {
      console.warn(`[API] Failed to send registration email: ${emailError}`);
      // Don't fail the entire request if email fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful',
        ticketId,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : getErrorMessage(error);
    console.error('[API] Registration error:', errorMessage);

    // Determine HTTP status based on error type
    let statusCode = 500;
    if (errorMessage.includes('Already registered')) {
      statusCode = 409; // Conflict
    } else if (errorMessage.includes('Event is full')) {
      statusCode = 409; // Conflict
    } else if (errorMessage.includes('not found')) {
      statusCode = 404;
    } else if (errorMessage.includes('unauthorized') || errorMessage.includes('not authorized')) {
      statusCode = 403;
    }

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        error: errorMessage,
      },
      { status: statusCode }
    );
  }
}
