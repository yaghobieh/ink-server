export type CmsPageStatus = 'draft' | 'published' | 'archived';

export type CmsPageRecord = {
  id: string;
  slug: string;
  title: string;
  bodyHtml: string;
  status: CmsPageStatus;
  mediaUrl: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CmsDashboardResponse = {
  user: {
    id: string;
    email: string;
    name: string;
    username: string | null;
    role: string;
    plan: string;
    premium: boolean;
  };
  usage: {
    tokensUsed: number;
    tokensLimit: number;
    periodStart: string;
    periodEnd: string;
  };
  pages: {
    total: number;
    published: number;
    draft: number;
  };
  host: {
    apiBase: string;
    cmsPublicUrl: string;
  };
};
