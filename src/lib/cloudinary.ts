import { v2 as Cloudinary } from "cloudinary";
import httpStatus from "http-status";
import config from "../config/index.js";
import { ApiError } from "../utils/apiError.js";

Cloudinary.config({
  cloud_name: config.cloudinary_cloud_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
  secure: true,
});

export const cloudinary = Cloudinary;

export type TUploadedImage = {
  url: string;
  publicId: string;
};

// Uploads an in-memory image. This is a network call, so it runs before (or
// after) a database transaction, never inside one.
export const uploadImage = (
  buffer: Buffer,
  folder: "properties",
): Promise<TUploadedImage> =>
  new Promise((resolve, reject) => {
    const fail = () =>
      reject(
        new ApiError(
          httpStatus.BAD_GATEWAY,
          "The image could not be uploaded. Please try again",
        ),
      );

    cloudinary.uploader
      .upload_stream(
        { folder: `rentnest/${folder}`, resource_type: "image" },
        (error, result) => {
          if (error || !result) {
            return fail();
          }

          resolve({ url: result.secure_url, publicId: result.public_id });
        },
      )
      .on("error", fail)
      .end(buffer);
  });
