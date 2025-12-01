import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import { Prisma } from "@prisma/client";

export const getSalesAnalyticsService = async (
  storeId: string,
  startDate?: Date,
  endDate?: Date
) => {
  const where: any = {
    storeId,
    isActive: true,
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      items: { include: { product: true } },
    },
  });

  const totalRevenue = orders.reduce(
    (sum, order) => sum.plus(order.finalAmount),
    new Prisma.Decimal(0)
  );

  const totalOrders = orders.length;
  const averageOrderValue = totalOrders > 0
    ? totalRevenue.dividedBy(totalOrders)
    : new Prisma.Decimal(0);

  const ordersByStatus = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const revenueByDate = orders.reduce((acc, order) => {
    const date = order.createdAt.toISOString().split("T")[0];
    acc[date] = (acc[date] || new Prisma.Decimal(0)).plus(order.finalAmount);
    return acc;
  }, {} as Record<string, Prisma.Decimal>);

  return apiResponse("Sales analytics fetched successfully", {
    totalRevenue: totalRevenue.toString(),
    totalOrders,
    averageOrderValue: averageOrderValue.toString(),
    ordersByStatus,
    revenueByDate: Object.fromEntries(
      Object.entries(revenueByDate).map(([date, amount]) => [date, amount.toString()])
    ),
  });
};

export const getProductAnalyticsService = async (
  storeId: string,
  startDate?: Date,
  endDate?: Date
) => {
  const where: any = {
    storeId,
    isActive: true,
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const orderItems = await prisma.orderItem.findMany({
    where: {
      order: where,
    },
    include: {
      product: true,
    },
  });

  const productStats = orderItems.reduce((acc, item) => {
    if (!acc[item.productId]) {
      acc[item.productId] = {
        product: item.product,
        totalQuantity: 0,
        totalRevenue: new Prisma.Decimal(0),
        orderCount: 0,
      };
    }
    acc[item.productId].totalQuantity += item.quantity;
    acc[item.productId].totalRevenue = acc[item.productId].totalRevenue.plus(item.totalPrice);
    acc[item.productId].orderCount += 1;
    return acc;
  }, {} as Record<string, any>);

  const topProducts = Object.values(productStats)
    .sort((a: any, b: any) => b.totalRevenue.minus(a.totalRevenue).toNumber())
    .slice(0, 10)
    .map((stat: any) => ({
      product: stat.product,
      totalQuantity: stat.totalQuantity,
      totalRevenue: stat.totalRevenue.toString(),
      orderCount: stat.orderCount,
    }));

  return apiResponse("Product analytics fetched successfully", {
    topProducts,
    totalProductsSold: Object.keys(productStats).length,
  });
};

export const getMarketingAnalyticsService = async (
  storeId: string,
  startDate?: Date,
  endDate?: Date
) => {
  const where: any = {
    storeId,
    isActive: true,
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  // Campaign analytics
  const campaigns = await prisma.campaign.findMany({
    where: {
      storeId,
      isActive: true,
      ...(startDate || endDate
        ? {
            OR: [
              { startDate: { lte: endDate || new Date() } },
              { endDate: { gte: startDate || new Date(0) } },
            ],
          }
        : {}),
    },
  });

  // Coupon analytics
  const coupons = await prisma.coupon.findMany({
    where: {
      storeId,
      isActive: true,
      ...(startDate || endDate
        ? {
            OR: [
              { startDate: { lte: endDate || new Date() } },
              { endDate: { gte: startDate || new Date(0) } },
            ],
          }
        : {}),
    },
  });

  const ordersWithCoupons = await prisma.order.findMany({
    where: {
      ...where,
      couponId: { not: null },
    },
    include: { coupon: true },
  });

  const couponUsage = ordersWithCoupons.reduce((acc, order) => {
    if (order.coupon) {
      acc[order.coupon.id] = (acc[order.coupon.id] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // FlashSale analytics
  const flashSales = await prisma.flashSale.findMany({
    where: {
      storeId,
      isActive: true,
      ...(startDate || endDate
        ? {
            OR: [
              { startTime: { lte: endDate || new Date() } },
              { endTime: { gte: startDate || new Date(0) } },
            ],
          }
        : {}),
    },
  });

  const ordersWithFlashSales = await prisma.order.findMany({
    where: {
      ...where,
      flashSaleId: { not: null },
    },
    include: { flashSale: true },
  });

  const flashSaleRevenue = ordersWithFlashSales.reduce(
    (sum, order) => sum.plus(order.discountAmount),
    new Prisma.Decimal(0)
  );

  // Newsletter analytics
  const newsletters = await prisma.newsletter.findMany({
    where: {
      storeId,
      isActive: true,
      ...(startDate || endDate
        ? {
            createdAt: {
              ...(startDate ? { gte: startDate } : {}),
              ...(endDate ? { lte: endDate } : {}),
            },
          }
        : {}),
    },
  });

  const subscribers = await prisma.newsletterSubscriber.count({
    where: {
      storeId,
      isActive: true,
    },
  });

  return apiResponse("Marketing analytics fetched successfully", {
    campaigns: {
      total: campaigns.length,
      active: campaigns.filter((c) => c.status === "ACTIVE").length,
      totalBudget: campaigns.reduce(
        (sum, c) => sum.plus(c.budget || 0),
        new Prisma.Decimal(0)
      ).toString(),
      totalSpent: campaigns.reduce(
        (sum, c) => sum.plus(c.spent),
        new Prisma.Decimal(0)
      ).toString(),
    },
    coupons: {
      total: coupons.length,
      active: coupons.filter(
        (c) =>
          (!c.startDate || c.startDate <= new Date()) &&
          (!c.endDate || c.endDate >= new Date())
      ).length,
      totalUses: coupons.reduce((sum, c) => sum + c.usedCount, 0),
      usageByCoupon: couponUsage,
    },
    flashSales: {
      total: flashSales.length,
      active: flashSales.filter((fs) => fs.status === "ACTIVE").length,
      totalRevenue: flashSaleRevenue.toString(),
      totalSold: flashSales.reduce((sum, fs) => sum + fs.soldQuantity, 0),
    },
    newsletter: {
      total: newsletters.length,
      sent: newsletters.filter((n) => n.status === "SENT").length,
      totalSubscribers: subscribers,
      totalOpened: newsletters.reduce((sum, n) => sum + n.openedCount, 0),
      totalClicked: newsletters.reduce((sum, n) => sum + n.clickedCount, 0),
    },
  });
};

export const getInventoryAnalyticsService = async (storeId: string) => {
  const inventories = await prisma.inventory.findMany({
    where: { storeId, isActive: true },
    include: { product: true },
  });

  const lowStockItems = inventories.filter(
    (inv) =>
      inv.lowStockThreshold &&
      inv.quantity - inv.reserved <= inv.lowStockThreshold
  );

  const outOfStockItems = inventories.filter(
    (inv) => inv.quantity - inv.reserved <= 0
  );

  const totalValue = inventories.reduce(
    (sum, inv) => sum.plus(inv.product.price.times(inv.quantity)),
    new Prisma.Decimal(0)
  );

  return apiResponse("Inventory analytics fetched successfully", {
    totalItems: inventories.length,
    lowStockItems: lowStockItems.length,
    outOfStockItems: outOfStockItems.length,
    totalValue: totalValue.toString(),
    lowStockList: lowStockItems.map((inv) => ({
      product: inv.product,
      quantity: inv.quantity,
      reserved: inv.reserved,
      available: inv.quantity - inv.reserved,
      threshold: inv.lowStockThreshold,
    })),
  });
};

export const getCustomerAnalyticsService = async (
  storeId: string,
  startDate?: Date,
  endDate?: Date
) => {
  const where: any = {
    storeId,
    isActive: true,
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const orders = await prisma.order.findMany({
    where,
  });

  const uniqueCustomers = new Set(
    orders
      .map((order) => order.customerEmail)
      .filter((email): email is string => !!email)
  );

  const customerOrders = orders.reduce((acc, order) => {
    if (order.customerEmail) {
      if (!acc[order.customerEmail]) {
        acc[order.customerEmail] = {
          email: order.customerEmail,
          name: order.customerName,
          totalOrders: 0,
          totalSpent: new Prisma.Decimal(0),
        };
      }
      acc[order.customerEmail].totalOrders += 1;
      acc[order.customerEmail].totalSpent = acc[order.customerEmail].totalSpent.plus(
        order.finalAmount
      );
    }
    return acc;
  }, {} as Record<string, any>);

  const topCustomers = Object.values(customerOrders)
    .sort((a: any, b: any) => b.totalSpent.minus(a.totalSpent).toNumber())
    .slice(0, 10)
    .map((customer: any) => ({
      ...customer,
      totalSpent: customer.totalSpent.toString(),
    }));

  return apiResponse("Customer analytics fetched successfully", {
    totalCustomers: uniqueCustomers.size,
    topCustomers,
    averageOrderValue: uniqueCustomers.size > 0
      ? orders.reduce((sum, o) => sum.plus(o.finalAmount), new Prisma.Decimal(0)).dividedBy(orders.length).toString()
      : "0",
  });
};

