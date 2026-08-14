import { getSql, firstRow } from '../db/index.js';
import type { InkPlan } from '../types/plan.types.js';
import type { UsageResponse } from '../types/plan.types.js';
import { PLAN_MONTHLY_TOKEN_LIMIT } from '../const/plans.const.js';

type UsageRow = {
  tokens_used: number;
  period_start: string | Date;
  period_end: string | Date;
};

const toIsoDate = (value: string | Date): string =>
  value instanceof Date ? value.toISOString().slice(0, 10) : value.slice(0, 10);

const currentPeriod = (): { periodStart: string; periodEnd: string } => {
  const now = new Date();
  const periodStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const periodEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0));
  return {
    periodStart: periodStart.toISOString().slice(0, 10),
    periodEnd: periodEnd.toISOString().slice(0, 10),
  };
};

export const getUsageForUser = async (
  userId: string,
  plan: InkPlan,
): Promise<UsageResponse> => {
  const sql = getSql();
  const { periodStart, periodEnd } = currentPeriod();
  const rows = await sql`
    SELECT tokens_used, period_start, period_end
    FROM token_usage
    WHERE user_id = ${userId} AND period_start = ${periodStart}
    LIMIT 1
  `;
  const row = firstRow<UsageRow>(rows);
  return {
    tokensUsed: row?.tokens_used ?? 0,
    tokensLimit: PLAN_MONTHLY_TOKEN_LIMIT[plan],
    periodStart: row ? toIsoDate(row.period_start) : periodStart,
    periodEnd: row ? toIsoDate(row.period_end) : periodEnd,
  };
};

export const recordTokenUsage = async (
  userId: string,
  tokens: number,
): Promise<UsageResponse> => {
  const sql = getSql();
  const { periodStart, periodEnd } = currentPeriod();
  const rows = await sql`
    INSERT INTO token_usage (user_id, tokens_used, period_start, period_end)
    VALUES (${userId}, ${tokens}, ${periodStart}, ${periodEnd})
    ON CONFLICT (user_id, period_start)
    DO UPDATE SET tokens_used = token_usage.tokens_used + ${tokens}
    RETURNING tokens_used, period_start, period_end
  `;
  const row = firstRow<UsageRow>(rows);
  if (!row) {
    throw new Error('failed to record token usage');
  }
  const user = await sql`
    SELECT COALESCE(p.plan, 'free') AS plan
    FROM users u
    LEFT JOIN plans p ON p.user_id = u.id
    WHERE u.id = ${userId}
    LIMIT 1
  `;
  const planRow = firstRow<{ plan: InkPlan }>(user);
  const plan = planRow?.plan ?? 'free';
  return {
    tokensUsed: row.tokens_used,
    tokensLimit: PLAN_MONTHLY_TOKEN_LIMIT[plan],
    periodStart: toIsoDate(row.period_start),
    periodEnd: toIsoDate(row.period_end),
  };
};
