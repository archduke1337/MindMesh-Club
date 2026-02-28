// app/api/events/register/route.ts
// Server-side endpoint for atomic event registration to prevent race conditions
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { sendRegistrationEmail } from '@/lib/emailService';
import { getErrorMessage } from '@/lib/errorHandler';
import { registrationSchema } from '@/lib/validation/schemas';
import { handleZodError } from '@/lib/utils/errorHandling';
import { verifyAuth } from '@/lib/apiAuth';
import { adminDb, DATABASE_ID, COLLECTIONS, ID, Query } from '@/lib/appwrite/server';

interface EventDocument {
  $id: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  location: string;
  image: string;
  organizerName: string;
  price: number;
  discountPrice: number;
  capacity: number;
  registered: number;
  [key: string]: unknown;
}

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

    // Check if already registered
    try {
      const existingRegistrations = await adminDb.listDocuments(
        DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        [
          Query.equal("eventId", eventId),
          Query.equal("userId", userId),
          Query.limit(1),
        ]
      );

      if (existingRegistrations.documents.length > 0) {
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
    } catch (listError) {
      console.error('[API] Error checking existing registrations:', listError);
    }

    // Get event to check capacity
    let event: EventDocument;
    try {
      event = await adminDb.getDocument(
        DATABASE_ID,
        COLLECTIONS.EVENTS,
        eventId
      ) as unknown as EventDocument;
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
    let registration: { $id: string; [key: string]: unknown };
    try {
      const ticketDocId = ID.unique();
      const eventTitle = event.title;
      const ticketQRData = `TICKET|${ticketDocId}|${userName}|${eventTitle}`;

      registration = await adminDb.createDocument(
        DATABASE_ID,
        COLLECTIONS.REGISTRATIONS,
        ticketDocId,
        {
          eventId,
          userId,
          userName,
          userEmail,
          registeredAt: new Date().toISOString(),
          ticketQRData,
        } as Record<string, unknown>
      );
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

    // Update event registered count atomically with retry to prevent race conditions
    try {
      const MAX_RETRIES = 3;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          const freshEvent = await adminDb.getDocument(
            DATABASE_ID,
            COLLECTIONS.EVENTS,
            eventId
          );
          const currentCount = freshEvent.registered || 0;

          await adminDb.updateDocument(
            DATABASE_ID,
            COLLECTIONS.EVENTS,
            eventId,
            { registered: currentCount + 1 }
          );
          console.log(`[API] Updated event registered count to ${currentCount + 1}`);
          break;
        } catch (retryError) {
          if (attempt === MAX_RETRIES - 1) throw retryError;
          // Brief delay before retry to reduce contention
          await new Promise(r => setTimeout(r, 100 * (attempt + 1)));
        }
      }
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
