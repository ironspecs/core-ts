/**
 * Verifies locked feature dialog rendering and close behavior.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeatureLockedDialog } from "./FeatureLockedDialog.js";

const labels = {
  title: "Upgrade required",
  description: "This feature requires a paid plan.",
  featureNameLabel: "Feature",
  actions: {
    close: "Close",
  },
};

const onClose = vi.fn();

describe("FeatureLockedDialog", () => {
  beforeEach(() => {
    onClose.mockReset();
  });

  it("does not render when closed", () => {
    render(
      <FeatureLockedDialog
        isOpen={false}
        labels={labels}
        featureName="Compose Email"
        data-testid="feature-button-dialog"
        closeButtonProps={{ "data-testid": "feature-button-close" }}
        onClose={onClose}
      />,
    );

    expect(screen.queryByTestId("feature-button-dialog")).toBeNull();
  });

  it("renders the feature name when open", () => {
    render(
      <FeatureLockedDialog
        isOpen
        labels={labels}
        featureName="Compose Email"
        markdown={<p>Paid plan required.</p>}
        data-testid="feature-button-dialog"
        closeButtonProps={{ "data-testid": "feature-button-close" }}
        onClose={onClose}
      />,
    );

    expect(screen.getByText("Compose Email")).toBeTruthy();
    expect(screen.getByText("Paid plan required.")).toBeTruthy();
  });

  it("closes via action button", () => {
    render(
      <FeatureLockedDialog
        isOpen
        labels={labels}
        featureName="Compose Email"
        data-testid="feature-button-dialog"
        closeButtonProps={{ "data-testid": "feature-button-close" }}
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByTestId("feature-button-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
