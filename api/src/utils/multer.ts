import multer from "multer";

// Use memory storage for Cloudinary
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
  },
});

/**
 * USAGE:
 *
 * upload.single("image")
 * upload.array("images", 10)
 * upload.fields([{ name: "thumbnail", maxCount: 1 }, { name: "gallery", maxCount: 5 }])
 */
