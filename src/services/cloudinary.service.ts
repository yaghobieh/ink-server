import { v2 as cloudinary } from 'cloudinary';
import { CONFIG } from '../const/index.js';

let configured = false;

export const configureCloudinary = (): boolean => {
  if (!CONFIG.CLOUDINARY_CLOUD_NAME || !CONFIG.CLOUDINARY_API_KEY || !CONFIG.CLOUDINARY_API_SECRET) {
    return false;
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: CONFIG.CLOUDINARY_CLOUD_NAME,
      api_key: CONFIG.CLOUDINARY_API_KEY,
      api_secret: CONFIG.CLOUDINARY_API_SECRET,
      secure: true,
    });
    configured = true;
  }
  return true;
};

export const createUploadSignature = (folder = 'ink-cms') => {
  if (!configureCloudinary()) {
    throw new Error('cloudinary not configured');
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

export const listCloudinaryResources = async (maxResults = 30) => {
  if (!configureCloudinary()) {
    throw new Error('cloudinary not configured');
  }
  return cloudinary.api.resources({
    type: 'upload',
    max_results: maxResults,
    prefix: 'ink-cms',
  });
};
