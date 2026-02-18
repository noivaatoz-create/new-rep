import { and, desc, eq, gte, lte, or, sql } from "drizzle-orm";
import { db } from "../db.js";
import { commissions, influencers, orders, promoCodes } from "../../shared/schema.js";

export type ReferralContext = {
  refCode?: string;
  refInfluencerId?: number;
};

export type PromoResolution = {
  promoCodeId: number | null;
  influencerId: number | null;
  discountAmount: string;
  commissionAmount: string;
  promoCodeApplied: string | null;
};

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

const toMoney = (value: number): string => Math.max(0, value).toFixed(2);
const toNumber = (value: unknown): number => {
  const n = Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(n) ? n : 0;
};

export function calculateDiscount(subtotal: number, type: "percentage" | "fixed", value: number): number {
  if (type === "percentage") return subtotal * (value / 100);
  return value;
}

export function calculateCommission(netTotal: number, type: "percentage" | "fixed", value: number): number {
  if (type === "percentage") return netTotal * (value / 100);
  return value;
}

async function lockAndUsePromoCode(tx: Tx, code: string, now: Date) {
  const normalizedCode = code.trim().toUpperCase();
  const [promoRow] = await tx
    .select({
      id: promoCodes.id,
      code: promoCodes.code,
      influencerId: promoCodes.influencerId,
      discountType: promoCodes.discountType,
      discountValue: promoCodes.discountValue,
      usageLimit: promoCodes.usageLimit,
      usageCount: promoCodes.usageCount,
      expiresAt: promoCodes.expiresAt,
      active: promoCodes.active,
      influencerStatus: influencers.status,
      influencerCommissionType: influencers.commissionType,
      influencerCommissionValue: influencers.commissionValue,
    })
    .from(promoCodes)
    .innerJoin(influencers, eq(influencers.id, promoCodes.influencerId))
    .where(eq(promoCodes.code, normalizedCode))
    .limit(1);

  if (!promoRow) {
    throw new Error("Invalid promo code");
  }
  if (!promoRow.active || promoRow.influencerStatus !== "active") {
    throw new Error("Promo code is inactive");
  }
  if (promoRow.expiresAt && promoRow.expiresAt <= now) {
    throw new Error("Promo code has expired");
  }

  const [updatedUsage] = await tx
    .update(promoCodes)
    .set({
      usageCount: sql`${promoCodes.usageCount} + 1`,
      updatedAt: now,
    })
    .where(
      and(
        eq(promoCodes.id, promoRow.id),
        eq(promoCodes.active, true),
        or(sql`${promoCodes.expiresAt} IS NULL`, sql`${promoCodes.expiresAt} > ${now}`),
        or(sql`${promoCodes.usageLimit} IS NULL`, sql`${promoCodes.usageCount} < ${promoCodes.usageLimit}`),
      ),
    )
    .returning({ id: promoCodes.id });

  if (!updatedUsage) {
    throw new Error("Promo code usage limit reached");
  }

  return promoRow;
}

async function getActiveInfluencerById(tx: Tx, influencerId: number) {
  const [row] = await tx
    .select({
      id: influencers.id,
      commissionType: influencers.commissionType,
      commissionValue: influencers.commissionValue,
      status: influencers.status,
    })
    .from(influencers)
    .where(eq(influencers.id, influencerId))
    .limit(1);

  if (!row || row.status !== "active") return null;
  return row;
}

export async function resolvePromoAndCommission(params: {
  tx: Tx;
  promoCodeInput?: string;
  referral?: ReferralContext;
  subtotal: number;
  now?: Date;
}): Promise<PromoResolution> {
  const { tx, promoCodeInput, referral, subtotal } = params;
  const now = params.now ?? new Date();

  let promoCodeId: number | null = null;
  let influencerId: number | null = null;
  let discountAmount = 0;
  let commissionAmount = 0;
  let promoCodeApplied: string | null = null;

  if (promoCodeInput?.trim()) {
    const promo = await lockAndUsePromoCode(tx, promoCodeInput, now);
    const requestedDiscount = calculateDiscount(
      subtotal,
      promo.discountType as "percentage" | "fixed",
      toNumber(promo.discountValue),
    );
    discountAmount = Math.min(subtotal, Math.max(0, requestedDiscount));

    const netTotal = Math.max(0, subtotal - discountAmount);
    const requestedCommission = calculateCommission(
      netTotal,
      promo.influencerCommissionType as "percentage" | "fixed",
      toNumber(promo.influencerCommissionValue),
    );

    promoCodeId = promo.id;
    influencerId = promo.influencerId;
    promoCodeApplied = promo.code;
    commissionAmount = Math.max(0, requestedCommission);
  } else if (referral?.refInfluencerId) {
    const influencer = await getActiveInfluencerById(tx, referral.refInfluencerId);
    if (influencer) {
      const requestedCommission = calculateCommission(
        subtotal,
        influencer.commissionType as "percentage" | "fixed",
        toNumber(influencer.commissionValue),
      );
      influencerId = influencer.id;
      commissionAmount = Math.max(0, requestedCommission);
    }
  }

  return {
    promoCodeId,
    influencerId,
    discountAmount: toMoney(discountAmount),
    commissionAmount: toMoney(commissionAmount),
    promoCodeApplied,
  };
}

export async function createCommissionRecord(params: {
  tx: Tx;
  influencerId: number | null;
  orderId: number;
  commissionAmount: string;
  now?: Date;
}) {
  const amount = toNumber(params.commissionAmount);
  if (!params.influencerId || amount <= 0) return null;

  const now = params.now ?? new Date();
  const [created] = await params.tx
    .insert(commissions)
    .values({
      influencerId: params.influencerId,
      orderId: params.orderId,
      commissionAmount: params.commissionAmount,
      status: "pending",
      updatedAt: now,
    })
    .returning();
  return created ?? null;
}

export async function getInfluencerPerformance(params: { from?: string; to?: string }) {
  const from = params.from ? new Date(params.from) : null;
  const to = params.to ? new Date(params.to) : null;

  const orderWhere = [sql`${orders.influencerId} = ${influencers.id}`];
  const commissionWhere = [sql`${commissions.influencerId} = ${influencers.id}`];

  if (from && !Number.isNaN(from.getTime())) {
    orderWhere.push(gte(orders.createdAt, from));
    commissionWhere.push(gte(commissions.createdAt, from));
  }
  if (to && !Number.isNaN(to.getTime())) {
    orderWhere.push(lte(orders.createdAt, to));
    commissionWhere.push(lte(commissions.createdAt, to));
  }

  const rows = await db
    .select({
      influencerId: influencers.id,
      name: influencers.name,
      email: influencers.email,
      status: influencers.status,
      totalOrders: sql<number>`COALESCE((SELECT COUNT(*)::int FROM ${orders} WHERE ${and(...orderWhere)}), 0)`,
      totalRevenue: sql<string>`COALESCE((SELECT SUM(${orders.total})::text FROM ${orders} WHERE ${and(...orderWhere)}), '0')`,
      totalDiscountGiven: sql<string>`COALESCE((SELECT SUM(${orders.discountAmount})::text FROM ${orders} WHERE ${and(...orderWhere)}), '0')`,
      totalCommissionPending: sql<string>`COALESCE((SELECT SUM(${commissions.commissionAmount})::text FROM ${commissions} WHERE ${and(...commissionWhere, eq(commissions.status, "pending"))}), '0')`,
      totalCommissionPaid: sql<string>`COALESCE((SELECT SUM(${commissions.commissionAmount})::text FROM ${commissions} WHERE ${and(...commissionWhere, eq(commissions.status, "paid"))}), '0')`,
    })
    .from(influencers)
    .orderBy(desc(influencers.createdAt));

  return rows;
}
