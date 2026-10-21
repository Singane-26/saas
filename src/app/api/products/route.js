import { z } from "zod";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse, withApiHandler } from "@/lib/api";

/**
 * GET /api/products
 * List all products for the authenticated organization.
 * Supports search, category filter, and stock alerts.
 */
export const GET = withApiHandler(async (request, context, user) => {
  const { organizationId } = user;
  const { searchParams } = new URL(request.url);

  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("category");
  const stockAlert = searchParams.get("stockAlert") === "true";
  const publishedOnly = searchParams.get("published") === "true";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "50", 10);

  // Build filter
  const where = {
    organizationId,
    isActive: true,
  };

  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (stockAlert) {
    // Products where stock <= alert threshold
    // Using raw query for this comparison
    where.AND = [
      {
        quantityInStock: { lte: 5 }, // Default threshold, will be refined
      },
    ];
  }

  if (publishedOnly) {
    where.isPublished = true;
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true } },
        images: { select: { id: true, imageUrl: true }, orderBy: { sortOrder: "asc" }, take: 1 },
      },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return successResponse({
    products,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Validation schema for creating a product
const createProductSchema = z.object({
  name: z.string().min(1, "Le nom est requis").max(200),
  categoryId: z.string().uuid().optional().nullable(),
  sku: z.string().max(50).optional().nullable(),
  buyPrice: z.number().int().min(0, "Le prix d'achat doit être positif"),
  sellPrice: z.number().int().min(1, "Le prix de vente est requis"),
  quantityInStock: z.number().int().min(0).default(0),
  alertThreshold: z.number().int().min(0).default(5),
  unit: z.string().max(30).default("pièce"),
  description: z.string().optional().nullable(),
  isPublished: z.boolean().default(false),
});

/**
 * POST /api/products
 * Create a new product.
 */
export const POST = withApiHandler(
  async (request, context, user) => {
    const { organizationId, userId } = user;
    const body = await request.json();

    const validation = createProductSchema.safeParse(body);
    if (!validation.success) {
      return errorResponse("Données invalides", 400, validation.error.flatten().fieldErrors);
    }

    const data = validation.data;

    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          ...data,
          organizationId,
        },
        include: {
          category: { select: { id: true, name: true } },
        },
      });

      // Create initial stock movement if quantity > 0
      if (data.quantityInStock > 0) {
        await tx.stockMovement.create({
          data: {
            organizationId,
            productId: newProduct.id,
            userId,
            type: "PURCHASE_IN",
            quantity: data.quantityInStock,
            note: "Stock initial",
          },
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          organizationId,
          userId,
          action: "product.create",
          entityType: "product",
          entityId: newProduct.id,
        },
      });

      return newProduct;
    });

    return successResponse(product, 201);
  },
  { allowedRoles: ["OWNER", "MANAGER"] }
);
