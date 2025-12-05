import { StatusCodes } from "http-status-codes";
import { ApiError } from "../../utils/api-error.js";
import { apiResponse } from "../../utils/api-response.js";
import prisma from "../../utils/db.js";
import { OnboardingSchemaType } from "./onboarding.validators.js";
import { slugifyText } from "../../utils/slugify.js";
import { logOrganizationHistory } from "../organization/organization.utils.js";
import { logStoreHistory } from "../store/store.utils.js";

export const completeOnboardingService = async (
  userId: string,
  data: OnboardingSchemaType,
  ipAddress: string,
  userAgent: string
) => {
  console.log(data, "data");
  // Check if user already has an organization
  const existingOrganization = await prisma.organization.findFirst({
    where: {
      userId,
      isActive: true,
    },
  });

  if (existingOrganization) {
    throw new ApiError(
      "User already has an organization",
      StatusCodes.CONFLICT
    );
  }

  // Use transaction to ensure all operations succeed or fail together
  const result = await prisma.$transaction(async (tx) => {
    // Step 1: Create Organization
    const organization = await tx.organization.create({
      data: {
        name: data.organizationName,
        description: data.description,
        userId,
        slug: slugifyText(data.organizationName),
      },
    });

    // Create organization owner role
    const organizationRole = await tx.organizationRole.create({
      data: {
        name: "owner",
        description: "Owner of the organization",
        organizationId: organization.id,
      },
    });

    // Add user as organization member with owner role
    await tx.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId,
        roleId: organizationRole.id,
      },
    });

    // Log organization creation
    await logOrganizationHistory(
      tx,
      userId,
      organization.id,
      "create",
      "Organization created during onboarding",
      ipAddress,
      userAgent,
      organization
    );

    // Step 2: Create Store
    const store = await tx.store.create({
      data: {
        name: data.storeName,
        description: data.storeDescription,
        organizationId: organization.id,
      },
    });

    // Create store owner role
    const storeRole = await tx.storeRole.create({
      data: {
        name: "owner",
        description: "Owner of the store",
        storeId: store.id,
      },
    });

    // Add user as store member with owner role
    await tx.storeMember.create({
      data: {
        userId,
        storeId: store.id,
        roleId: storeRole.id,
      },
    });

    // Log store creation
    await logStoreHistory(
      tx,
      userId,
      store.id,
      "create",
      "Store created during onboarding",
      ipAddress,
      userAgent,
      store
    );

    // Step 3: Create Store Settings
    await tx.storeSetting.create({
      data: {
        storeId: store.id,
        // Store settings can be extended with currency, timezone, language, etc.
        // For now, we'll create the basic setting record
      },
    });

    // Step 4: Handle template selection (if needed)
    // This can be stored in store settings or a separate table
    // For now, we'll just return the template choice in the response

    return {
      organization,
      store,
      templateChoice: data.templateChoice,
      selectedTemplate: data.selectedTemplate,
      preferences: {
        currency: data.currency,
        timezone: data.timezone,
        language: data.language,
      },
    };
  });

  return apiResponse("Onboarding completed successfully", {
    organizationId: result.organization.id,
    storeId: result.store.id,
    templateChoice: result.templateChoice,
    selectedTemplate: result.selectedTemplate,
    preferences: result.preferences,
  });
};
