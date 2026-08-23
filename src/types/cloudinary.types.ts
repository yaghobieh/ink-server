export type CloudinaryCredentials = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

export type CloudinaryUploadInput = {
  dataUrl: string;
  fileName?: string;
};

export type CloudinaryUploadResult = {
  public_id: string;
  url: string;
  secure_url: string;
  resource_type: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  folder?: string;
};
