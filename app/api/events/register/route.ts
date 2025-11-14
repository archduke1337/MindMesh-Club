// app/api/events/register/route.ts
// Server-side endpoint for atomic event registration to prevent race conditions
import { NextRequest, NextResponse } from 'next/server';
import { eventService } from '@/lib/database';
import { sendRegistrationEmail } from '@/lib/emailService';

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
 * Request body:
 * - eventId: string
 * - userId: string
 * - userName: string
 * - userEmail: string
 * 
 * Response:
 * - success: boolean
 * - message: string
 * - ticketId: string (on success)
 * - error: string (on failure)
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

    // Register using the service (handles duplicate check and capacity check)
    const registration = await eventService.registerForEvent(
      eventId,
      userId,
      userName,
      userEmail
    );

    const ticketId = registration.$id || '';

    if (!ticketId) {
      throw new Error('Registration created but no ticket ID returned');
    }

    console.log(`[API] Registration successful: ${ticketId}`);

    // Try to send email in the background (don't block if it fails)
    try {
      const event = await eventService.getEventById(eventId);
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[API] Registration error:', errorMessage);

    // Determine HTTP status based on error type
    let statusCode = 500;
    if (errorMessage.includes('Already registered')) {
      statusCode = 409; // Conflict
    } else if (errorMessage.includes('Event is full')) {
      statusCode = 409; // Conflict
    } else if (errorMessage.includes('not found')) {
      statusCode = 404;
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
