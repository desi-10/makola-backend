import { cloudinary } from "../config/cloudinary.js";

export const uploadToCloudinary = async (
  folder: string,
  buffer: Buffer
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: "makola/images/" + folder },
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
