import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import { CreateNewsletterSchemaType, UpdateNewsletterSchemaType, SubscribeNewsletterSchemaType } from "./newsletter.validators.js";
import { logNewsletterHistory } from "./newsletter.utils.js";

export const getNewslettersService = async (storeId: string) => {
  const newsletters = await prisma.newsletter.findMany({
    where: { storeId, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return apiResponse("Newsletters fetched successfully", newsletters);
};

export const getNewsletterService = async (storeId: string, newsletterId: string) => {
  const newsletter = await prisma.newsletter.findFirst({
    where: { id: newsletterId, storeId, isActive: true },
  });

  if (!newsletter) {
    throw new ApiError("Newsletter not found", StatusCodes.NOT_FOUND);
  }

  return apiResponse("Newsletter fetched successfully", newsletter);
};

export const getSubscribersService = async (storeId: string) => {
  const subscribers = await prisma.newsletterSubscriber.findMany({
    where: { storeId, isActive: true },
    orderBy: { subscribedAt: "desc" },
  });

  return apiResponse("Subscribers fetched successfully", subscribers);
};

export const subscribeNewsletterService = async (
  storeId: string,
  data: SubscribeNewsletterSchemaType
) => {
  const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
    where: {
      email_storeId: {
        email: data.email,
        storeId,
      },
    },
  });

  if (existingSubscriber) {
    if (existingSubscriber.isActive) {
      throw new ApiError("Email already subscribed", StatusCodes.CONFLICT);
    } else {
      // Re-subscribe
      const subscriber = await prisma.newsletterSubscriber.update({
        where: { id: existingSubscriber.id },
        data: {
          isActive: true,
          name: data.name || existingSubscriber.name,
          unsubscribedAt: null,
        },
      });

      return apiResponse("Successfully re-subscribed", subscriber);
    }
  }

  const subscriber = await prisma.newsletterSubscriber.create({
    data: {
      email: data.email,
      storeId,
      name: data.name,
    },
  });

  return apiResponse("Successfully subscribed", subscriber);
};

export const unsubscribeNewsletterService = async (storeId: string, email: string) => {
  const subscriber = await prisma.newsletterSubscriber.findUnique({
    where: {
      email_storeId: {
        email,
        storeId,
      },
    },
  });

  if (!subscriber || !subscriber.isActive) {
    throw new ApiError("Email not subscribed", StatusCodes.NOT_FOUND);
  }

  await prisma.newsletterSubscriber.update({
    where: { id: subscriber.id },
    data: {
      isActive: false,
      unsubscribedAt: new Date(),
    },
  });

  return apiResponse("Successfully unsubscribed", null);
};

export const createNewsletterService = async (
  userId: string,
  storeId: string,
  data: CreateNewsletterSchemaType,
  ipAddress: string,
  userAgent: string
) => {
  const existingNewsletter = await prisma.newsletter.findFirst({
    where: { name: data.name, storeId, isActive: true },
  });

  if (existingNewsletter) {
    throw new ApiError("Newsletter already exists", StatusCodes.CONFLICT);
  }

  const result = await prisma.$transaction(async (tx) => {
    const newsletter = await tx.newsletter.create({
      data: {
        name: data.name,
        subject: data.subject,
        content: data.content,
        storeId,
        status: "DRAFT",
        scheduledAt: data.scheduledAt,
        isActive: data.isActive ?? true,
      },
    });

    await logNewsletterHistory(
      tx,
      userId,
      newsletter.id,
      "create",
      "DRAFT",
      "Newsletter created",
      ipAddress,
      userAgent,
      newsletter
    );

    return newsletter;
  });

  return apiResponse("Newsletter created successfully", result);
};

export const updateNewsletterService = async (
  userId: string,
  storeId: string,
  newsletterId: string,
  data: UpdateNewsletterSchemaType,
  ipAddress: string,
  userAgent: string
) => {
  const existingNewsletter = await prisma.newsletter.findFirst({
    where: { id: newsletterId, storeId, isActive: true },
  });

  if (!existingNewsletter) {
    throw new ApiError("Newsletter not found", StatusCodes.NOT_FOUND);
  }

  if (data.name && data.name !== existingNewsletter.name) {
    const conflict = await prisma.newsletter.findFirst({
      where: {
        name: data.name,
        storeId,
        isActive: true,
        NOT: { id: newsletterId },
      },
    });

    if (conflict) {
      throw new ApiError("Newsletter name already exists", StatusCodes.CONFLICT);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const newsletter = await tx.newsletter.update({
      where: { id: newsletterId },
      data: {
        name: data.name || existingNewsletter.name,
        subject: data.subject || existingNewsletter.subject,
        content: data.content || existingNewsletter.content,
        status: data.status || existingNewsletter.status,
        scheduledAt: data.scheduledAt ?? existingNewsletter.scheduledAt,
        isActive: data.isActive ?? existingNewsletter.isActive,
      },
    });

    await logNewsletterHistory(
      tx,
      userId,
      newsletter.id,
      "update",
      data.status || existingNewsletter.status,
      "Newsletter updated",
      ipAddress,
      userAgent,
      newsletter
    );

    return newsletter;
  });

  return apiResponse("Newsletter updated successfully", result);
};

export const deleteNewsletterService = async (
  userId: string,
  storeId: string,
  newsletterId: string,
  reason: string,
  ipAddress: string,
  userAgent: string
) => {
  const existingNewsletter = await prisma.newsletter.findFirst({
    where: { id: newsletterId, storeId, isActive: true },
  });

  if (!existingNewsletter) {
    throw new ApiError("Newsletter not found", StatusCodes.NOT_FOUND);
  }

  await prisma.$transaction(async (tx) => {
    await tx.newsletter.update({
      where: { id: newsletterId },
      data: {
        deletedAt: new Date(),
        isActive: false,
        status: "CANCELLED",
      },
    });

    await logNewsletterHistory(
      tx,
      userId,
      existingNewsletter.id,
      "delete",
      "CANCELLED",
      reason,
      ipAddress,
      userAgent,
      existingNewsletter
    );
  });

  return apiResponse("Newsletter deleted successfully", null);
};

