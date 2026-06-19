import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FeatureFlagProvider, useFeatureFlags } from "./FeatureFlagProvider.js";

function FeatureFlagSnapshot() {
  const { featureFlags } = useFeatureFlags();

  return <pre>{JSON.stringify(featureFlags)}</pre>;
}

describe("FeatureFlagProvider", () => {
  it("throws when the hook is used outside a provider", () => {
    expect(() => render(<FeatureFlagSnapshot />)).toThrow(
      "useFeatureFlags must be used within a FeatureFlagProvider",
    );
  });

  it("merges context flags into provider output", () => {
    render(
      <FeatureFlagProvider contextFlags={{ contextFlag: "ctx" }}>
        <FeatureFlagSnapshot />
      </FeatureFlagProvider>,
    );

    expect(screen.getByText('{"contextFlag":"ctx"}')).toBeInTheDocument();
  });

  it("merges nested provider context flags", () => {
    render(
      <FeatureFlagProvider contextFlags={{ rootContext: "root" }}>
        <FeatureFlagProvider contextFlags={{ nestedContext: "nested" }}>
          <FeatureFlagSnapshot />
        </FeatureFlagProvider>
      </FeatureFlagProvider>,
    );

    expect(
      screen.getByText('{"rootContext":"root","nestedContext":"nested"}'),
    ).toBeInTheDocument();
  });
});
