/**
 * Owns generic feature entitlement interpretation for feature-gated controls.
 * It accepts feature-like records and treats absent or false-like entitlement
 * values as disabled.
 */

export type SubscriptionFeatureLike = {
  feature_key: string;
  value_text: string | null;
  value_int: number | null;
};

function isEnabledByText(value: string | null): boolean {
  const normalized = value?.trim().toLowerCase() ?? "";
  const numericValue = Number(normalized);
  return (
    normalized === "true" ||
    (Number.isFinite(numericValue) && numericValue > 0)
  );
}

function isEnabledByValue(feature: SubscriptionFeatureLike): boolean {
  return (
    (typeof feature.value_int === "number" && feature.value_int > 0) ||
    isEnabledByText(feature.value_text)
  );
}

export function isSubscriptionFeatureEnabled(params: {
  features: SubscriptionFeatureLike[];
  featureKey: string;
}): boolean {
  const { features, featureKey } = params;

  return features
    .filter((feature) => feature.feature_key === featureKey)
    .some((feature) => isEnabledByValue(feature));
}
