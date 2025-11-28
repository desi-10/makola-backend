import { cloudinaryConfig } from "../config/cloudinary.js";

export const uploadToCloudinary = async (
  folder: string,
  buffer: Buffer
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    cloudinaryConfig.uploader
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
    cloudinaryConfig.uploader.destroy(publicId, (err: any, result: any) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
};
