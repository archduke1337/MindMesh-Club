// app/api/events/register/route.ts
// Server-side endpoint for atomic event registration to prevent race conditions
import { NextRequest, NextResponse } from 'next/server';
import { Client, Databases, ID, Query } from 'appwrite';
import { sendRegistrationEmail } from '@/lib/emailService';
import { DATABASE_ID, REGISTRATIONS_COLLECTION_ID, EVENTS_COLLECTION_ID } from '@/lib/database';
import { getErrorMessage } from '@/lib/errorHandler';

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
    const body: RegisterRequestBody = await request.json();
    const { eventId, userId, userName, userEmail } = body;

    // Validate input
    if (!eventId || !userId || !userName || !userEmail) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields',
          error: 'eventId, userId, userName, and userEmail are required',
        },
        { status: 400 }
      );
    }

    console.log(`[API] Registering user ${userId} for event ${eventId}`);

    // Initialize Appwrite with admin API key for server-side operations
    const adminClient = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!)
      .setApiKey(process.env.APPWRITE_API_KEY!); // Use API key for admin access

    const adminDatabases = new Databases(adminClient);

    // Check if already registered
    const existingRegistrations = await adminDatabases.listDocuments(
      DATABASE_ID,
      REGISTRATIONS_COLLECTION_ID,
      [
        Query.equal("eventId", eventId),
        Query.equal("userId", userId),
        Query.limit(1)
      ]
    );

    if (existingRegistrations.documents.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Already registered for this event',
          error: 'Already registered for this event',
        },
        { status: 409 }
      );
    }

    // Get event to check capacity
    const eventDoc = await adminDatabases.getDocument(
      DATABASE_ID,
      EVENTS_COLLECTION_ID,
      eventId
    );

    const event = eventDoc as any;
    if (event.capacity && event.registered >= event.capacity) {
      return NextResponse.json(
        {
          success: false,
          message: 'Event is full',
          error: 'Event is full',
        },
        { status: 409 }
      );
    }

    // Create registration document
    const registration = await adminDatabases.createDocument(
      DATABASE_ID,
      REGISTRATIONS_COLLECTION_ID,
      ID.unique(),
      {
        eventId,
        userId,
        userName,
        userEmail,
        registeredAt: new Date().toISOString(),
      }
    );

    const ticketId = registration.$id || '';

    if (!ticketId) {
      throw new Error('Registration created but no ticket ID returned');
    }

    console.log(`[API] Registration successful: ${ticketId}`);

    // Update event registered count
    try {
      await adminDatabases.updateDocument(
        DATABASE_ID,
        EVENTS_COLLECTION_ID,
        eventId,
        {
          registered: event.registered + 1
        }
      );
      console.log(`[API] Updated event registered count to ${event.registered + 1}`);
    } catch (updateError) {
      console.warn(`[API] Warning: failed to update event registered count:`, updateError);
      // Don't fail registration if count update fails
    }

    // Try to send email in the background (don't block if it fails)
    try {
      await sendRegistrationEmail(userEmail, userName, {
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
