export interface EntitlementSummary {
  includedFeatures: number;
  configuredLimits: number;
  activeAddons: number;
  totalCommercialCapabilities: number;
}

export function summarizeEntitlements(input: {
  includedFeatures: number;
  configuredLimits: number;
  activeAddons: number;
}): EntitlementSummary {
  return {
    ...input,
    totalCommercialCapabilities: input.includedFeatures + input.activeAddons,
  };
}
