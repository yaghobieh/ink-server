export type AuditLogRecord = {
  id: string;
  userId: string | null;
  action: string;
  resource: string | null;
  metadata: Record<string, unknown>;
  ipAddress: string | null;
  createdAt: string;
};

export type AuditLogListResponse = {
  items: AuditLogRecord[];
  total: number;
};
