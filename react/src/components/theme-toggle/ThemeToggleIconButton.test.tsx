import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ThemeToggleIconButton } from "./ThemeToggleIconButton.js";

describe("ThemeToggleIconButton", () => {
  it("renders the dark-mode action labels when the default theme is light", () => {
    document.cookie = "";
    document.documentElement.removeAttribute("data-theme");

    render(
      <ThemeToggleIconButton
        labels={{
          switchToDarkMode: "Switch to dark mode",
          switchToLightMode: "Switch to light mode",
        }}
      />,
    );

    expect(
      screen.getByRole("button", { name: "Switch to dark mode" }),
    ).toHaveAttribute("title", "Switch to dark mode");
  });
});
