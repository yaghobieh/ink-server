import { v2 as cloudinary } from 'cloudinary';
import {
  CLOUDINARY_ERROR_NOT_CONFIGURED,
  CLOUDINARY_FOLDER,
  CLOUDINARY_MISSING_API_KEY,
  CLOUDINARY_MISSING_API_SECRET,
  CLOUDINARY_MISSING_CLOUD_NAME,
  CONFIG,
  MEDIA_RESOURCE_TYPE_IMAGE,
} from '../const/index.js';
import type { CloudinaryUploadInput, CloudinaryUploadResult } from '../types/cloudinary.types.js';

export const cloudinaryMissingFields = (): string[] => {
  const missing: string[] = [];
  if (!CONFIG.CLOUDINARY_CLOUD_NAME) {
    missing.push(CLOUDINARY_MISSING_CLOUD_NAME);
  }
  if (!CONFIG.CLOUDINARY_API_KEY) {
    missing.push(CLOUDINARY_MISSING_API_KEY);
  }
  if (!CONFIG.CLOUDINARY_API_SECRET) {
    missing.push(CLOUDINARY_MISSING_API_SECRET);
  }
  return missing;
};

export const configureCloudinary = (): boolean => {
  const missing = cloudinaryMissingFields();
  if (missing.length > 0) {
    return false;
  }
  cloudinary.config({
    cloud_name: CONFIG.CLOUDINARY_CLOUD_NAME,
    api_key: CONFIG.CLOUDINARY_API_KEY,
    api_secret: CONFIG.CLOUDINARY_API_SECRET,
    secure: true,
  });
  return true;
};

export const createUploadSignature = (folder = CLOUDINARY_FOLDER) => {
  if (!configureCloudinary()) {
    throw new Error(CLOUDINARY_ERROR_NOT_CONFIGURED);
  }
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    CONFIG.CLOUDINARY_API_SECRET,
  );
  return {
    cloudName: CONFIG.CLOUDINARY_CLOUD_NAME,
    apiKey: CONFIG.CLOUDINARY_API_KEY,
    timestamp,
    folder,
    signature,
  };
};

export const uploadDataUrl = async (
  input: CloudinaryUploadInput,
): Promise<CloudinaryUploadResult> => {
  if (!configureCloudinary()) {
    throw new Error(CLOUDINARY_ERROR_NOT_CONFIGURED);
  }
  return cloudinary.uploader.upload(input.dataUrl, {
    folder: CLOUDINARY_FOLDER,
    resource_type: MEDIA_RESOURCE_TYPE_IMAGE,
    use_filename: Boolean(input.fileName),
    unique_filename: true,
  });
};

export const listCloudinaryResources = async (maxResults = 30) => {
  if (!configureCloudinary()) {
    throw new Error(CLOUDINARY_ERROR_NOT_CONFIGURED);
  }
  return cloudinary.api.resources({
    type: 'upload',
    max_results: maxResults,
    prefix: CLOUDINARY_FOLDER,
  });
};
