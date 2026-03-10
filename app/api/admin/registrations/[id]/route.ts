// app/api/admin/registrations/[id]/route.ts
import { NextRequest } from "next/server";
import { verifyAdminAuth } from "@/lib/apiAuth";
import { adminDb, DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/server";
import { handleApiError, successResponse, ApiError } from "@/lib/apiErrorHandler";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  reason: z.string().max(2000).optional(),
});

/**
 * PATCH /api/admin/registrations/[id]
 * Approve or reject an application-based registration.
 * Body: { action: "approve" | "reject", reason?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin } = await verifyAdminAuth(request);
    if (!isAdmin) {
      throw new ApiError(403, "Admin access required");
    }

    const { id } = await params;
    const body = actionSchema.parse(await request.json());

    // Verify registration exists
    const registration = await adminDb.getDocument(
      DATABASE_ID,
      COLLECTIONS.REGISTRATIONS,
      id
    );

    if (!registration) {
      throw new ApiError(404, "Registration not found");
    }

    const currentStatus = registration.status as string;

    // Only pending/waitlisted registrations can be approved/rejected
    if (!["confirmed", "waitlisted"].includes(currentStatus) && body.action === "approve") {
      // "confirmed" is the default status — application-based ones also start as confirmed
      // We allow approving from any non-terminal state
    }

    if (["cancelled", "checked_in"].includes(currentStatus)) {
      throw new ApiError(400, `Cannot ${body.action} a registration with status "${currentStatus}"`);
    }

    const newStatus = body.action === "approve" ? "approved" : "rejected";

    const updateData: Record<string, unknown> = {
      status: newStatus,
    };

    if (body.action === "reject" && body.reason) {
      // Store rejection reason in extraFields JSON
      const existing = registration.extraFields
        ? JSON.parse(registration.extraFields as string)
        : {};
      updateData.extraFields = JSON.stringify({
        ...existing,
        rejectionReason: body.reason,
        rejectedAt: new Date().toISOString(),
      });
    }

    if (body.action === "approve") {
      const existing = registration.extraFields
        ? JSON.parse(registration.extraFields as string)
        : {};
      updateData.extraFields = JSON.stringify({
        ...existing,
        approvedAt: new Date().toISOString(),
      });
    }

    await adminDb.updateDocument(
      DATABASE_ID,
      COLLECTIONS.REGISTRATIONS,
      id,
      updateData
    );

    return successResponse({
      message: `Registration ${newStatus} successfully`,
      status: newStatus,
    });
  } catch (error) {
    return handleApiError(error, `PATCH /api/admin/registrations/${(await params).id}`);
  }
}

/**
 * GET /api/admin/registrations/[id]
 * Get a single registration with full details.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { isAdmin } = await verifyAdminAuth(request);
    if (!isAdmin) {
      throw new ApiError(403, "Admin access required");
    }

    const { id } = await params;
    const registration = await adminDb.getDocument(
      DATABASE_ID,
      COLLECTIONS.REGISTRATIONS,
      id
    );

    return successResponse({ registration });
  } catch (error) {
    return handleApiError(error, `GET /api/admin/registrations/${(await params).id}`);
  }
}
