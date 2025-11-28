import prisma from "../../utils/db.js";
import { apiResponse } from "../../utils/api-response.js";
import { UpdateUserSchemaType } from "./user.validators.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../../utils/cloudinary.js";

export const getMeService = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      emailVerified: true,
      isTwoFactorEnabled: true,
      bio: true,
    },
  });
  return apiResponse("User fetched successfully", user);
};

export const updateMeService = async (
  userId: string,
  data: Partial<UpdateUserSchemaType>,
  file: Express.Multer.File | undefined
) => {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!existingUser)
    throw new ApiError("User not found", StatusCodes.NOT_FOUND);

  let image = existingUser.image;
  if (file) {
    const uploadedImage = await uploadToCloudinary("users", file.buffer);
    image = uploadedImage.secure_url;
    if (existingUser.image) await deleteFromCloudinary(existingUser.image);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: data.name || existingUser.name,
      image: image,
      bio: data.bio || existingUser?.bio || undefined,
    },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      emailVerified: true,
      isTwoFactorEnabled: true,
    },
  });
  return apiResponse("User updated successfully", user);
};
