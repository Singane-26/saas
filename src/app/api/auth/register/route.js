import { z } from "zod";
import prisma from "@/lib/prisma";
import { hashPassword, createToken } from "@/lib/auth";
import { successResponse, errorResponse, withApiHandler } from "@/lib/api";

// Validation schema for registration
const registerSchema = z.object({
  organizationName: z.string().min(2, "Le nom doit avoir au moins 2 caractères").max(150),
  phone: z
    .string()
    .regex(/^\+221[0-9]{9}$/, "Numéro sénégalais invalide (format: +221XXXXXXXXX)"),
  password: z.string().min(6, "Le mot de passe doit avoir au moins 6 caractères"),
  fullName: z.string().min(2, "Le nom complet est requis").max(150),
});

/**
 * POST /api/auth/register
 * Create a new organization and owner account.
 */
export const POST = withApiHandler(
  async (request) => {
    const body = await request.json();

    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse("Données invalides", 400, validation.error.flatten().fieldErrors);
    }

    const { organizationName, phone, password, fullName } = validation.data;

    // Check if phone already exists
    const existingUser = await prisma.user.findUnique({ where: { phone } });
    if (existingUser) {
      return errorResponse("Ce numéro de téléphone est déjà utilisé", 409);
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create organization + user + subscription in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          name: organizationName,
          phone,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // +14 days
        },
      });

      // Create owner user
      const user = await tx.user.create({
        data: {
          organizationId: organization.id,
          phone,
          passwordHash,
          fullName,
          role: "OWNER",
        },
      });

      // Create trial subscription
      const now = new Date();
      await tx.subscription.create({
        data: {
          organizationId: organization.id,
          plan: "BASIC",
          status: "TRIAL",
          currentPeriodStart: now,
          currentPeriodEnd: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
          amount: 0,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          action: "account.register",
          entityType: "organization",
          entityId: organization.id,
        },
      });

      return { organization, user };
    });

    // Create JWT token
    const token = createToken({
      userId: result.user.id,
      organizationId: result.organization.id,
      role: result.user.role,
    });

    return successResponse(
      {
        token,
        user: {
          id: result.user.id,
          fullName: result.user.fullName,
          phone: result.user.phone,
          role: result.user.role,
        },
        organization: {
          id: result.organization.id,
          name: result.organization.name,
          trialEndsAt: result.organization.trialEndsAt,
        },
      },
      201
    );
  },
  { requireAuth: false }
);
