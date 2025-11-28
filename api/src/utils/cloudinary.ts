import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME as string,
  api_key: env.CLOUDINARY_API_KEY as string,
  api_secret: env.CLOUDINARY_API_SECRET as string,
});

export const uploadToCloudinary = async (
  folder: string,
  buffer: Buffer
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: "rentalord/images/" + folder },
        (
          err: any,
          result: { secure_url: string; public_id: string } | undefined
        ) => {
          if (err) reject(err);
          else resolve(result as { secure_url: string; public_id: string });
        }
      )
      .end(buffer);
  });
};

export const deleteFromCloudinary = (publicId: string) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (err: any, result: any) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};
