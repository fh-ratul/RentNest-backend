import httpStatus from "http-status";
import multer from "multer";
import { ApiError } from "../utils/apiError.js";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Files are kept in memory and sent to Cloudinary by the service. One image
// per request: Vercel caps a request body at 4.5 MB.
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      return callback(
        new ApiError(
          httpStatus.BAD_REQUEST,
          "Only JPEG, PNG or WebP images can be uploaded",
        ),
      );
    }

    callback(null, true);
  },
});
