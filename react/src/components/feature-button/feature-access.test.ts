/**
 * Verifies generic feature-enabled interpretation for feature-like records.
 */

import { describe, expect, it } from "vitest";
import {
  isSubscriptionFeatureEnabled,
  type SubscriptionFeatureLike,
} from "./feature-access.js";

function feature(
  overrides: Partial<SubscriptionFeatureLike>,
): SubscriptionFeatureLike {
  return {
    feature_key: "create-custom-emails",
    value_text: null,
    value_int: null,
    ...overrides,
  };
}

describe("isSubscriptionFeatureEnabled", () => {
  it("returns true when value_text is true", () => {
    expect(
      isSubscriptionFeatureEnabled({
        features: [feature({ value_text: "true" })],
        featureKey: "create-custom-emails",
      }),
    ).toBe(true);
  });

  it("returns true when value_text is a positive number", () => {
    expect(
      isSubscriptionFeatureEnabled({
        features: [feature({ value_text: "1" })],
        featureKey: "create-custom-emails",
      }),
    ).toBe(true);
  });

  it("returns true when value_int is positive", () => {
    expect(
      isSubscriptionFeatureEnabled({
        features: [feature({ value_int: 10 })],
        featureKey: "create-custom-emails",
      }),
    ).toBe(true);
  });

  it("returns false when value is falsey", () => {
    expect(
      isSubscriptionFeatureEnabled({
        features: [feature({ value_text: "false", value_int: 0 })],
        featureKey: "create-custom-emails",
      }),
    ).toBe(false);
  });

  it("returns false when feature key is not found", () => {
    expect(
      isSubscriptionFeatureEnabled({
        features: [
          feature({ feature_key: "other-feature", value_text: "true" }),
        ],
        featureKey: "create-custom-emails",
      }),
    ).toBe(false);
  });
});
