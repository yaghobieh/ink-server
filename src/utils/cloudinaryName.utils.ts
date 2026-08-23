import {
  CLOUDINARY_URL_PREFIX,
  CLOUDINARY_URL_SCHEME,
} from '../const/cloudinary.const.js';
import { EMPTY_STRING } from '../const/strings.const.js';
import type { CloudinaryCredentials } from '../types/cloudinary.types.js';

const PREFIX_LENGTH = CLOUDINARY_URL_PREFIX.length;

export const parseCloudinaryCloudName = (raw: string): string => {
  const credentials = parseCloudinaryUrl(raw);
  if (credentials.cloudName) {
    return credentials.cloudName;
  }
  return raw.trim();
};

export const parseCloudinaryUrl = (raw: string): CloudinaryCredentials => {
  let value = raw.trim();
  if (value.toUpperCase().startsWith(CLOUDINARY_URL_PREFIX)) {
    value = value.slice(PREFIX_LENGTH).trim();
  }
  if (!value.toLowerCase().startsWith(CLOUDINARY_URL_SCHEME)) {
    return {
      cloudName: value,
      apiKey: EMPTY_STRING,
      apiSecret: EMPTY_STRING,
    };
  }
  const withoutScheme = value.slice(CLOUDINARY_URL_SCHEME.length);
  const at = withoutScheme.lastIndexOf('@');
  if (at < 0) {
    return {
      cloudName: EMPTY_STRING,
      apiKey: EMPTY_STRING,
      apiSecret: EMPTY_STRING,
    };
  }
  const userinfo = withoutScheme.slice(0, at);
  const host = withoutScheme
    .slice(at + 1)
    .split('/')[0]
    .split('?')[0]
    .trim();
  const colon = userinfo.indexOf(':');
  if (colon < 0) {
    return {
      cloudName: host,
      apiKey: userinfo,
      apiSecret: EMPTY_STRING,
    };
  }
  return {
    cloudName: host,
    apiKey: userinfo.slice(0, colon),
    apiSecret: userinfo.slice(colon + 1),
  };
};

export const resolveCloudinaryCredentials = (): CloudinaryCredentials => {
  const fromUrl = parseCloudinaryUrl(process.env.CLOUDINARY_URL ?? EMPTY_STRING);
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME ?? EMPTY_STRING).trim() || fromUrl.cloudName;
  const apiKey = (process.env.CLOUDINARY_API_KEY ?? EMPTY_STRING).trim() || fromUrl.apiKey;
  const apiSecret = (process.env.CLOUDINARY_API_SECRET ?? EMPTY_STRING).trim() || fromUrl.apiSecret;
  return { cloudName, apiKey, apiSecret };
};
