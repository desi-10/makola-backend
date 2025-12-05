import { z } from "zod";

export const OnboardingSchema = z.object({
  // Step 1: Organization Information
  organizationName: z
    .string()
    .min(1, { message: "Organization name is required" })
    .trim(),
  description: z.string().trim().optional(),

  // Step 2: Store Information
  storeName: z.string().min(1, { message: "Store name is required" }).trim(),
  storeDescription: z.string().trim().optional(),
  category: z.string().min(1, { message: "Category is required" }),
  subdomain: z.string().trim().optional(),

  // Step 3: Business Details
  businessType: z.string().min(1, { message: "Business type is required" }),
  address: z.string().min(1, { message: "Address is required" }).trim(),
  city: z.string().min(1, { message: "City is required" }).trim(),
  country: z.string().min(1, { message: "Country is required" }),
  postalCode: z.string().trim().optional(),

  // Step 4: Storefront Template
  templateChoice: z.enum(["template", "design-new", "skip"], {
    message: "Please select an option",
  }),
  selectedTemplate: z.string().optional(),

  // Step 5: Preferences
  currency: z.string().min(1, { message: "Currency is required" }),
  timezone: z.string().min(1, { message: "Timezone is required" }),
  language: z.string().optional(),
});

export type OnboardingSchemaType = z.infer<typeof OnboardingSchema>;

