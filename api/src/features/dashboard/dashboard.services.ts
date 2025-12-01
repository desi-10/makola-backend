import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import { Prisma } from "@prisma/client";
import * as analyticsServices from "../analytics/analytics.services.js";

export const getDashboardService = async (storeId: string) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());

  // Get all analytics
  const [
    salesAnalyticsResponse,
    productAnalyticsResponse,
    marketingAnalyticsResponse,
    inventoryAnalyticsResponse,
    customerAnalyticsResponse,
  ] = await Promise.all([
    analyticsServices.getSalesAnalyticsService(storeId, startOfMonth, now),
    analyticsServices.getProductAnalyticsService(storeId, startOfMonth, now),
    analyticsServices.getMarketingAnalyticsService(storeId, startOfMonth, now),
    analyticsServices.getInventoryAnalyticsService(storeId),
    analyticsServices.getCustomerAnalyticsService(storeId, startOfMonth, now),
  ]);

  const salesAnalytics = salesAnalyticsResponse.data;
  const productAnalytics = productAnalyticsResponse.data;
  const marketingAnalytics = marketingAnalyticsResponse.data;
  const inventoryAnalytics = inventoryAnalyticsResponse.data;
  const customerAnalytics = customerAnalyticsResponse.data;

  // Get recent orders
  const recentOrders = await prisma.order.findMany({
    where: { storeId, isActive: true },
    include: {
      items: { include: { product: true } },
      coupon: true,
      flashSale: true,
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  // Get pending orders count
  const pendingOrders = await prisma.order.count({
    where: {
      storeId,
      isActive: true,
      status: "PENDING",
    },
  });

  // Get low stock items
  const lowStockCount = inventoryAnalytics.lowStockItems;

  // Get active campaigns
  const activeCampaigns = await prisma.campaign.count({
    where: {
      storeId,
      isActive: true,
      status: "ACTIVE",
    },
  });

  // Get active flash sales
  const activeFlashSales = await prisma.flashSale.count({
    where: {
      storeId,
      isActive: true,
      status: "ACTIVE",
      startTime: { lte: now },
      endTime: { gte: now },
    },
  });

  // Get abandoned carts
  const abandonedCarts = await prisma.cart.count({
    where: {
      storeId,
      isActive: true,
      status: "ABANDONED",
    },
  });

  // Get total expenses this month
  const totalExpenses = await prisma.expense.aggregate({
    where: {
      storeId,
      isActive: true,
      status: "PAID",
      date: { gte: startOfMonth },
    },
    _sum: {
      amount: true,
    },
  });

  return apiResponse("Dashboard data fetched successfully", {
    overview: {
      totalRevenue: salesAnalytics.totalRevenue,
      totalOrders: salesAnalytics.totalOrders,
      averageOrderValue: salesAnalytics.averageOrderValue,
      pendingOrders,
      lowStockItems: lowStockCount,
      activeCampaigns,
      activeFlashSales,
      abandonedCarts,
      totalExpenses: totalExpenses._sum.amount?.toString() || "0",
    },
    sales: salesAnalytics,
    products: productAnalytics,
    marketing: marketingAnalytics,
    inventory: inventoryAnalytics,
    customers: customerAnalytics,
    recentOrders: recentOrders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      status: order.status,
      finalAmount: order.finalAmount.toString(),
      createdAt: order.createdAt,
      itemsCount: order.items.length,
    })),
  });
};

