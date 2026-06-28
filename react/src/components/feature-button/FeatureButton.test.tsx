/**
 * Verifies feature-gated button access states and locked-dialog behavior.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { FeatureButton } from "./FeatureButton.js";
import type { FeatureButtonLabels } from "./types.js";

const labels: FeatureButtonLabels = {
  trigger: "Compose Email",
  lockedDialog: {
    title: "Upgrade required",
    description: "This feature requires a paid plan.",
    featureNameLabel: "Feature",
    actions: {
      close: "Close",
    },
  },
};

function renderFeatureButton(
  props?: Partial<ComponentProps<typeof FeatureButton>>,
) {
  const onEnabledClick = props?.onEnabledClick ?? vi.fn();
  const fetchFeatures =
    props?.fetchFeatures ??
    vi.fn(async () => [
      {
        feature_key: "create-custom-emails",
        value_text: "true",
        value_int: null,
      },
    ]);

  const client = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  render(
    <QueryClientProvider client={client}>
      <FeatureButton
        labels={labels}
        featureKey="create-custom-emails"
        featureName="Compose Email"
        accountId="acc_test_1"
        session={{ fetch: vi.fn() }}
        onEnabledClick={onEnabledClick}
        fetchFeatures={fetchFeatures}
        data-testid="feature-button-trigger"
        lockedDialogProps={{ "data-testid": "feature-button-dialog" }}
        lockedCloseButtonProps={{ "data-testid": "feature-button-close" }}
        {...props}
      />
    </QueryClientProvider>,
  );

  return { onEnabledClick, fetchFeatures };
}

describe("FeatureButton", () => {
  it("renders the primary variant when feature is enabled", async () => {
    renderFeatureButton();

    await waitFor(() =>
      expect(screen.getByTestId("feature-button-trigger")).not.toBeDisabled(),
    );

    const trigger = screen.getByTestId("feature-button-trigger");
    expect(trigger.className).toContain("btn-primary");
    expect(trigger.className).not.toContain("btn-locked");
  });

  it("renders locked state without the primary variant", async () => {
    renderFeatureButton({
      fetchFeatures: vi.fn(async () => [
        {
          feature_key: "create-custom-emails",
          value_text: "false",
          value_int: 0,
        },
      ]),
    });

    await waitFor(() =>
      expect(screen.getByTestId("feature-button-trigger")).not.toBeDisabled(),
    );

    const trigger = screen.getByTestId("feature-button-trigger");
    expect(trigger.className).toContain("btn-locked");
    expect(trigger.className).not.toContain("btn-primary");
  });

  it("renders locked state without the configured variant", async () => {
    renderFeatureButton({
      variant: "outline",
      fetchFeatures: vi.fn(async () => [
        {
          feature_key: "create-custom-emails",
          value_text: "false",
          value_int: 0,
        },
      ]),
    });

    await waitFor(() =>
      expect(screen.getByTestId("feature-button-trigger")).not.toBeDisabled(),
    );

    const trigger = screen.getByTestId("feature-button-trigger");
    expect(trigger.className).toContain("btn-locked");
    expect(trigger.className).not.toContain("btn-outline");
  });

  it("clicks through when feature is enabled", async () => {
    const { onEnabledClick } = renderFeatureButton();

    await waitFor(() =>
      expect(screen.getByTestId("feature-button-trigger")).not.toBeDisabled(),
    );

    fireEvent.click(screen.getByTestId("feature-button-trigger"));
    expect(onEnabledClick).toHaveBeenCalledTimes(1);
  });

  it("opens locked dialog when feature is not enabled", async () => {
    renderFeatureButton({
      fetchFeatures: vi.fn(async () => [
        {
          feature_key: "create-custom-emails",
          value_text: "false",
          value_int: 0,
        },
      ]),
    });

    await waitFor(() =>
      expect(screen.getByTestId("feature-button-trigger")).not.toBeDisabled(),
    );

    fireEvent.click(screen.getByTestId("feature-button-trigger"));
    expect(screen.getByTestId("feature-button-dialog")).toBeTruthy();
  });

  it("stays locked when forceLocked is true", async () => {
    const { fetchFeatures, onEnabledClick } = renderFeatureButton({
      forceLocked: true,
    });

    await waitFor(() =>
      expect(screen.getByTestId("feature-button-trigger")).not.toBeDisabled(),
    );
    expect(fetchFeatures).toHaveBeenCalledTimes(0);

    fireEvent.click(screen.getByTestId("feature-button-trigger"));
    expect(screen.getByTestId("feature-button-dialog")).toBeTruthy();
    expect(onEnabledClick).toHaveBeenCalledTimes(0);
  });
});
