import { z } from "zod";
import prisma from "@/lib/prisma";
import { verifyPassword, createToken } from "@/lib/auth";
import { successResponse, errorResponse, withApiHandler } from "@/lib/api";

// Validation schema for login
const loginSchema = z.object({
  phone: z.string().min(1, "Le numéro de téléphone est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

/**
 * POST /api/auth/login
 * Authenticate a user and return a JWT token.
 */
export const POST = withApiHandler(
  async (request) => {
    const body = await request.json();

    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse("Données invalides", 400, validation.error.flatten().fieldErrors);
    }

    const { phone, password } = validation.data;

    // Find user by phone
    const user = await prisma.user.findUnique({
      where: { phone },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            isActive: true,
            trialEndsAt: true,
            logoUrl: true,
          },
        },
      },
    });

    if (!user) {
      return errorResponse("Numéro de téléphone ou mot de passe incorrect", 401);
    }

    // Check if user is active
    if (!user.isActive) {
      return errorResponse("Ce compte a été désactivé", 403);
    }

    // Check if organization is active
    if (!user.organization.isActive) {
      return errorResponse("Cette boutique a été désactivée", 403);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return errorResponse("Numéro de téléphone ou mot de passe incorrect", 401);
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Create JWT token
    const token = createToken({
      userId: user.id,
      organizationId: user.organization.id,
      role: user.role,
    });

    return successResponse({
      token,
      user: {
        id: user.id,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
      },
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        logoUrl: user.organization.logoUrl,
        trialEndsAt: user.organization.trialEndsAt,
      },
    });
  },
  { requireAuth: false }
);
