import prisma from "../../utils/db.js";
import { apiResponse } from "../../utils/api-response.js";
import { UpdateUserSchemaType } from "./user.validators.js";
import { ApiError } from "../../utils/api-error.js";
import { StatusCodes } from "http-status-codes";
import {
  deleteFromCloudinary,
  uploadToCloudinary,
} from "../../utils/cloudinary.js";
import { UpdatePasswordSchemaType } from "./user.validators.js";
import {
  bcryptCompareHashed,
  bcryptHashed,
  hashToken,
} from "../auth/auth.utils.js";
import { generateCode } from "../../utils/generate-code.js";

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

export const updatePasswordService = async (
  userId: string,
  data: UpdatePasswordSchemaType
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      password: true,
      isTwoFactorEnabled: true,
    },
  });

  if (!user) throw new ApiError("User not found", StatusCodes.NOT_FOUND);
  if (!user.password)
    throw new ApiError(
      "User has no password",
      StatusCodes.UNPROCESSABLE_ENTITY
    );

  if (user.isTwoFactorEnabled && !data.code) {
    const code = generateCode();

    await prisma.verification.create({
      data: {
        expiresAt: new Date(Date.now() + 3 * 60 * 1000),
        value: hashToken(code),
        identifier: userId,
      },
    });

    //send email

    return apiResponse("Code has been sent to email", {
      isTwoFactorEnabled: true,
      code,
    });
  }

  if (data.code) {
    const verification = await prisma.verification.findFirst({
      where: { identifier: userId, value: hashToken(data.code) },
    });

    if (!verification)
      throw new ApiError("Code not found", StatusCodes.NOT_FOUND);

    if (verification.expiresAt < new Date())
      throw new ApiError("Code expired", StatusCodes.UNPROCESSABLE_ENTITY);

    await prisma.verification.delete({
      where: { id: verification.id },
    });
  }

  const isOldPasswordValid = await bcryptCompareHashed(
    data.oldPassword,
    user.password as string
  );

  if (!isOldPasswordValid)
    throw new ApiError("Invalid password", StatusCodes.UNPROCESSABLE_ENTITY);
  const hashedPassword = await bcryptHashed(data.newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  await prisma.session.deleteMany({
    where: { userId },
  });

  return apiResponse("Password updated successfully", null);
};
