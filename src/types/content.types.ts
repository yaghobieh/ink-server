export type CmsContentStatus = 'draft' | 'published' | 'archived';

export type CmsContentRecord = {
  id: string;
  collection: string;
  slug: string;
  locale: string;
  title: string;
  payload: Record<string, unknown>;
  status: CmsContentStatus;
  createdAt: string;
  updatedAt: string;
};

export type CmsMediaRecord = {
  id: string;
  publicId: string;
  url: string;
  secureUrl: string;
  resourceType: string;
  format: string | null;
  bytes: number;
  width: number | null;
  height: number | null;
  folder: string | null;
  createdAt: string;
};
