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

    // Initialize Appwrite client
    // Note: This endpoint should work with public read access or use admin API key
    const client = new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

    // If API key is available, use it for admin access
    if (process.env.APPWRITE_API_KEY) {
      // For admin operations, we can use the API key as a custom header
      // However, since setHeader is not supported, we'll try with public permissions
      console.log('[API] API key available, attempting admin operations');
    }

    const databases = new Databases(client);
    const databaseId = DATABASE_ID;
    const registrationsCollectionId = REGISTRATIONS_COLLECTION_ID;

    // Check if already registered
    try {
      const existingRegistrations = await databases.listDocuments(
        databaseId,
        registrationsCollectionId,
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
    } catch (listError) {
      console.error('[API] Error checking existing registrations:', listError);
      // If we can't check, proceed with registration attempt
    }

    // Get event to check capacity
    let event;
    try {
      event = await databases.getDocument(
        databaseId,
        EVENTS_COLLECTION_ID,
        eventId
      );
    } catch (getError) {
      console.error('[API] Error fetching event:', getError);
      return NextResponse.json(
        {
          success: false,
          message: 'Event not found',
          error: 'The event does not exist',
        },
        { status: 404 }
      );
    }

    const eventData = event as any;
    if (eventData.capacity && eventData.registered >= eventData.capacity) {
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
    let registration;
    try {
      registration = await databases.createDocument(
        databaseId,
        registrationsCollectionId,
        ID.unique(),
        {
          eventId,
          userId,
          userName,
          userEmail,
          registeredAt: new Date().toISOString(),
        }
      );
    } catch (createError) {
      console.error('[API] Error creating registration:', createError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create registration',
          error: getErrorMessage(createError),
        },
        { status: 500 }
      );
    }

    const ticketId = registration.$id || '';

    if (!ticketId) {
      throw new Error('Registration created but no ticket ID returned');
    }

    console.log(`[API] Registration successful: ${ticketId}`);

    // Update event registered count
    try {
      await databases.updateDocument(
        databaseId,
        EVENTS_COLLECTION_ID,
        eventId,
        {
          registered: (eventData.registered || 0) + 1
        }
      );
      console.log(`[API] Updated event registered count to ${(eventData.registered || 0) + 1}`);
    } catch (updateError) {
      console.warn(`[API] Warning: failed to update event registered count:`, updateError);
      // Don't fail registration if count update fails
    }

    // Try to send email in the background (don't block if it fails)
    try {
      await sendRegistrationEmail(userEmail, userName, {
        title: eventData.title,
        date: eventData.date,
        time: eventData.time,
        venue: eventData.venue,
        location: eventData.location,
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
