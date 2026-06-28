/**
 * Verifies the neutral drawer content boundary without depending on any
 * product-specific detail or record behavior.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DrawerContent } from "./DrawerContent.js";

describe("DrawerContent", () => {
  it("renders children and forwards DOM props", () => {
    render(
      <DrawerContent className="custom-content" data-testid="content">
        <p>Content</p>
      </DrawerContent>,
    );

    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByTestId("content")).toHaveClass(
      "min-w-0",
      "custom-content",
    );
  });
});
