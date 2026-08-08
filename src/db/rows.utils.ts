export const firstRow = <T>(rows: unknown): T | undefined => {
  if (!Array.isArray(rows) || rows.length === 0) return undefined;
  return rows[0] as T;
};

export const rowCount = (rows: unknown): number => {
  if (!Array.isArray(rows)) return 0;
  return rows.length;
};
