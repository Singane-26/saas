import prisma from "@/lib/prisma";
import { successResponse, errorResponse, withApiHandler } from "@/lib/api";

/**
 * GET /api/dashboard
 * Returns dashboard summary data: today's sales, monthly totals, alerts.
 */
export const GET = withApiHandler(async (request, context, user) => {
  const { organizationId } = user;

  // Date boundaries
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Run all queries in parallel for speed
  const [
    todaySales,
    monthSales,
    todaySalesCount,
    monthSalesCount,
    lowStockProducts,
    customersWithDebt,
    pendingOrders,
    monthExpenses,
  ] = await Promise.all([
    // Today's revenue
    prisma.sale.aggregate({
      where: {
        organizationId,
        status: { not: "CANCELLED" },
        createdAt: { gte: startOfDay },
      },
      _sum: { netAmount: true },
    }),

    // Month's revenue
    prisma.sale.aggregate({
      where: {
        organizationId,
        status: { not: "CANCELLED" },
        createdAt: { gte: startOfMonth },
      },
      _sum: { netAmount: true },
    }),

    // Today's sales count
    prisma.sale.count({
      where: {
        organizationId,
        status: { not: "CANCELLED" },
        createdAt: { gte: startOfDay },
      },
    }),

    // Month's sales count
    prisma.sale.count({
      where: {
        organizationId,
        status: { not: "CANCELLED" },
        createdAt: { gte: startOfMonth },
      },
    }),

    // Products with low stock
    prisma.product.count({
      where: {
        organizationId,
        isActive: true,
        quantityInStock: { lte: prisma.product.fields?.alertThreshold ?? 5 },
      },
    }),

    // Customers with outstanding balance
    prisma.customer.count({
      where: {
        organizationId,
        balanceDue: { gt: 0 },
      },
    }),

    // Pending online orders
    prisma.onlineOrder.count({
      where: {
        organizationId,
        status: { in: ["NEW", "CONFIRMED"] },
      },
    }),

    // Month's expenses
    prisma.expense.aggregate({
      where: {
        organizationId,
        expenseDate: { gte: startOfMonth },
      },
      _sum: { amount: true },
    }),
  ]);

  // Calculate estimated profit
  // Profit = Month Sales - Month Cost of Goods Sold - Month Expenses
  // For COGS, we sum (buyPrice * quantity) for all sale items this month
  const monthCOGS = await prisma.$queryRaw`
    SELECT COALESCE(SUM(p.buy_price * si.quantity), 0)::int as total
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    JOIN products p ON si.product_id = p.id
    WHERE s.organization_id = ${organizationId}
      AND s.status != 'CANCELLED'
      AND s.created_at >= ${startOfMonth}
  `;

  const revenue = monthSales._sum.netAmount || 0;
  const expenses = monthExpenses._sum.amount || 0;
  const cogs = monthCOGS[0]?.total || 0;
  const estimatedProfit = revenue - cogs - expenses;

  return successResponse({
    today: {
      revenue: todaySales._sum.netAmount || 0,
      salesCount: todaySalesCount,
    },
    month: {
      revenue,
      salesCount: monthSalesCount,
      expenses,
      cogs,
      estimatedProfit,
    },
    alerts: {
      lowStockProducts,
      customersWithDebt,
      pendingOrders,
    },
  });
});
