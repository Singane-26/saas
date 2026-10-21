import { z } from "zod";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse, withApiHandler } from "@/lib/api";

/**
 * GET /api/customers
 * List customers with optional filters.
 */
export const GET = withApiHandler(async (request, context, user) => {
  const { organizationId } = user;
  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search") || "";
  const withDebt = searchParams.get("withDebt") === "true";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "30", 10);

  const where = { organizationId };

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
    ];
  }

  if (withDebt) {
    where.balanceDue = { gt: 0 };
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: withDebt ? { balanceDue: "desc" } : { fullName: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  return successResponse({
    customers,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

// Validation schema
const createCustomerSchema = z.object({
  fullName: z.string().min(1, "Le nom est requis").max(150),
  phone: z.string().max(20).optional().nullable(),
  email: z.string().email().max(255).optional().nullable(),
  address: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

/**
 * POST /api/customers
 * Create a new customer.
 */
export const POST = withApiHandler(async (request, context, user) => {
  const { organizationId, userId } = user;
  const body = await request.json();

  const validation = createCustomerSchema.safeParse(body);
  if (!validation.success) {
    return errorResponse("Données invalides", 400, validation.error.flatten().fieldErrors);
  }

  const customer = await prisma.customer.create({
    data: {
      ...validation.data,
      organizationId,
    },
  });

  await prisma.auditLog.create({
    data: {
      organizationId,
      userId,
      action: "customer.create",
      entityType: "customer",
      entityId: customer.id,
    },
  });

  return successResponse(customer, 201);
});
