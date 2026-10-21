import { z } from "zod";
import prisma from "@/lib/prisma";
import { successResponse, errorResponse, withApiHandler } from "@/lib/api";
import { generateSequentialNumber } from "@/lib/format";

// Validation schema for creating a sale
const createSaleSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1, "Au moins un produit est requis"),
  discountAmount: z.number().int().min(0).default(0),
  paymentMethod: z.enum(["CASH", "WAVE", "ORANGE_MONEY", "CREDIT", "OTHER"]),
  paymentAmount: z.number().int().min(0).optional(),
  notes: z.string().optional().nullable(),
  // For offline sync — client can provide its own UUID
  id: z.string().uuid().optional(),
});

/**
 * GET /api/sales
 * List sales with optional date filters.
 */
export const GET = withApiHandler(async (request, context, user) => {
  const { organizationId } = user;
  const { searchParams } = new URL(request.url);

  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);

  const where = { organizationId };

  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  if (status) {
    where.status = status.toUpperCase();
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        customer: { select: { id: true, fullName: true, phone: true } },
        user: { select: { id: true, fullName: true } },
        items: { select: { productName: true, quantity: true, unitPrice: true, totalPrice: true } },
        payments: { select: { amount: true, method: true, paidAt: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.sale.count({ where }),
  ]);

  return successResponse({
    sales,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

/**
 * POST /api/sales
 * Create a new sale with items, payment, stock deduction, and invoice.
 * Designed for speed — target < 30s total user interaction.
 */
export const POST = withApiHandler(async (request, context, user) => {
  const { organizationId, userId } = user;
  const body = await request.json();

  const validation = createSaleSchema.safeParse(body);
  if (!validation.success) {
    return errorResponse("Données invalides", 400, validation.error.flatten().fieldErrors);
  }

  const { customerId, items, discountAmount, paymentMethod, paymentAmount, notes, id } =
    validation.data;

  const sale = await prisma.$transaction(async (tx) => {
    // 1. Fetch all products in one query
    const productIds = items.map((i) => i.productId);
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, organizationId },
    });

    if (products.length !== productIds.length) {
      throw new Error("Un ou plusieurs produits n'ont pas été trouvés");
    }

    // 2. Build sale items and calculate total
    const productMap = new Map(products.map((p) => [p.id, p]));
    let totalAmount = 0;
    const saleItems = items.map((item) => {
      const product = productMap.get(item.productId);
      const totalPrice = product.sellPrice * item.quantity;
      totalAmount += totalPrice;
      return {
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        unitPrice: product.sellPrice,
        totalPrice,
      };
    });

    const netAmount = totalAmount - discountAmount;
    const amountPaid = paymentAmount ?? (paymentMethod === "CREDIT" ? 0 : netAmount);
    const amountDue = netAmount - amountPaid;

    // Determine status
    let status;
    if (paymentMethod === "CREDIT") {
      status = "CREDIT";
    } else if (amountDue > 0) {
      status = "PARTIAL";
    } else {
      status = "COMPLETED";
    }

    // 3. Get next sale number
    const lastSale = await tx.sale.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: { saleNumber: true },
    });
    const lastNum = lastSale ? parseInt(lastSale.saleNumber.split("-").pop(), 10) : 0;
    const saleNumber = generateSequentialNumber("VNT", lastNum + 1);

    // 4. Create sale
    const newSale = await tx.sale.create({
      data: {
        ...(id ? { id } : {}), // Allow client-provided UUID for offline sync
        organizationId,
        userId,
        customerId,
        saleNumber,
        totalAmount,
        discountAmount,
        netAmount,
        amountPaid,
        amountDue,
        status,
        notes,
        synced: !id, // If client provided ID, it came from offline
        items: {
          create: saleItems,
        },
      },
    });

    // 5. Create payment record
    if (amountPaid > 0) {
      await tx.payment.create({
        data: {
          saleId: newSale.id,
          amount: amountPaid,
          method: paymentMethod === "CREDIT" ? "CASH" : paymentMethod,
        },
      });
    }

    // 6. Deduct stock for each item
    for (const item of items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          quantityInStock: { decrement: item.quantity },
        },
      });

      await tx.stockMovement.create({
        data: {
          organizationId,
          productId: item.productId,
          userId,
          type: "SALE_OUT",
          quantity: -item.quantity,
          reference: saleNumber,
        },
      });
    }

    // 7. Update customer balance if credit sale
    if (customerId && amountDue > 0) {
      await tx.customer.update({
        where: { id: customerId },
        data: {
          balanceDue: { increment: amountDue },
        },
      });
    }

    // 8. Create invoice
    const lastInvoice = await tx.invoice.findFirst({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      select: { invoiceNumber: true },
    });
    const lastInvNum = lastInvoice
      ? parseInt(lastInvoice.invoiceNumber.split("-").pop(), 10)
      : 0;
    const invoiceNumber = generateSequentialNumber("FAC", lastInvNum + 1);

    await tx.invoice.create({
      data: {
        organizationId,
        saleId: newSale.id,
        invoiceNumber,
        type: "RECEIPT",
      },
    });

    // 9. Audit log
    await tx.auditLog.create({
      data: {
        organizationId,
        userId,
        action: "sale.create",
        entityType: "sale",
        entityId: newSale.id,
        details: { saleNumber, netAmount, paymentMethod, itemCount: items.length },
      },
    });

    return { ...newSale, invoiceNumber, items: saleItems };
  });

  return successResponse(sale, 201);
});
