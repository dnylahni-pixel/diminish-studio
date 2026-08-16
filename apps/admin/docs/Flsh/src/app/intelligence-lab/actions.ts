"use server";

import {
  isDbSeeded,
  seedDatabase,
  resolveUser360,
  calculateSubscriptionHealth,
  calculateMrrWaterfall,
  reconcileRevenue,
  reconcileCreditLedger,
  creditReserveCaptureRelease,
  calculateCreditBurnRate,
  resolveEffectiveEntitlements,
  validatePlanVersionDiff,
  detectFeatureDependencyCycles,
  detectUsageAnomaliesAndSaturation,
  analyzeTrialAndPromotionEffectiveness,
  calculateNextBestAction,
  calculateDataQualityScorecard,
  generatePrioritizedOperationsQueue,
} from "@/features/intelligence-engine";

export async function isDbSeededAction() {
  try {
    const seeded = await isDbSeeded();
    return { success: true, seeded, dbAvailable: true };
  } catch (e: any) {
    return { success: false, seeded: false, dbAvailable: false, error: e.message };
  }
}

export async function seedDatabaseAction() {
  try {
    await seedDatabase();
    return { success: true, message: "دیتابیس با موفقیت بسترسازی و مقداردهی اولیه شد." };
  } catch (e: any) {
    return { success: false, message: `خطا در بسترسازی دیتابیس: ${e.message}` };
  }
}

export async function getUserIntelligenceAction(userId: string, useDb: boolean) {
  try {
    const user360 = await resolveUser360(userId, useDb);
    const health = await calculateSubscriptionHealth(userId, useDb);
    const burnRate = await calculateCreditBurnRate(userId, useDb);
    const nextBestActions = await calculateNextBestAction(userId, useDb);

    let entitlements: any[] = [];
    let usageAnomaly = null;

    if (user360?.subscription) {
      entitlements = await resolveEffectiveEntitlements(user360.subscription.id, useDb);
      usageAnomaly = await detectUsageAnomaliesAndSaturation(user360.subscription.id, useDb);
    }

    return {
      success: true,
      data: {
        user360,
        health,
        burnRate,
        entitlements,
        usageAnomaly,
        nextBestActions,
      },
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function executeCreditActionAction(
  accountId: string,
  amount: number,
  action: "reserve" | "capture" | "release",
  idempotencyKey: string,
  useDb: boolean
) {
  try {
    const result = await creditReserveCaptureRelease(accountId, amount, action, idempotencyKey, useDb);
    return { success: true, result };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function validatePlanVersionDiffAction(planId: string, v1: number, v2: number, useDb: boolean) {
  try {
    const diff = await validatePlanVersionDiff(planId, v1, v2, useDb);
    return { success: true, diff };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}

export async function getGlobalIntelligenceDataAction(useDb: boolean) {
  try {
    const mrrWaterfall = await calculateMrrWaterfall(useDb);
    const revenueLeakage = await reconcileRevenue(useDb);
    const ledgerReconciliation = await reconcileCreditLedger(useDb);
    const dependencyReport = await detectFeatureDependencyCycles(useDb);
    const trialEffectiveness = await analyzeTrialAndPromotionEffectiveness(useDb);
    const dataQualityScorecard = await calculateDataQualityScorecard(useDb);
    const prioritizedQueue = await generatePrioritizedOperationsQueue(useDb);

    return {
      success: true,
      data: {
        mrrWaterfall,
        revenueLeakage,
        ledgerReconciliation,
        dependencyReport,
        trialEffectiveness,
        dataQualityScorecard,
        prioritizedQueue,
      },
    };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
}
