/**
 * Owns the behavior contract tests for the shared single-select toggle button
 * primitives. These tests ensure the shared wrapper preserves non-clearable
 * selection semantics and explicit visual-state class mapping for shared
 * button-footprint controls.
 */

import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ToggleButton, ToggleButtonGroup } from "./ToggleButtonGroup.js";

describe("ToggleButtonGroup", () => {
  it("maps the selected item to the shared selected classes", () => {
    render(
      <ToggleButtonGroup value="in" onValueChange={() => {}}>
        <ToggleButton value="in" data-testid="direction-in">
          In
        </ToggleButton>
        <ToggleButton value="out" data-testid="direction-out">
          Out
        </ToggleButton>
      </ToggleButtonGroup>,
    );

    expect(screen.getByTestId("direction-in")).toHaveAttribute(
      "data-state",
      "on",
    );
    expect(screen.getByTestId("direction-in")).toHaveClass(
      "bg-base-300",
      "text-base-content",
    );
    expect(screen.getByTestId("direction-out")).toHaveAttribute(
      "data-state",
      "off",
    );
    expect(screen.getByTestId("direction-out")).not.toHaveClass("bg-base-300");
  });

  it("calls onValueChange when a different item is selected", async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <ToggleButtonGroup value="in" onValueChange={handleValueChange}>
        <ToggleButton value="in">In</ToggleButton>
        <ToggleButton value="out">Out</ToggleButton>
      </ToggleButtonGroup>,
    );

    await user.click(screen.getByRole("radio", { name: "Out" }));

    expect(handleValueChange).toHaveBeenCalledWith("out");
  });

  it("does not clear the value when the selected item is clicked again", async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <ToggleButtonGroup value="in" onValueChange={handleValueChange}>
        <ToggleButton value="in">In</ToggleButton>
        <ToggleButton value="out">Out</ToggleButton>
      </ToggleButtonGroup>,
    );

    await user.click(screen.getByRole("radio", { name: "In" }));

    expect(handleValueChange).not.toHaveBeenCalled();
  });

  it("does not change value when disabled", async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <ToggleButtonGroup value="in" onValueChange={handleValueChange} disabled>
        <ToggleButton value="in">In</ToggleButton>
        <ToggleButton value="out">Out</ToggleButton>
      </ToggleButtonGroup>,
    );

    await user.click(screen.getByRole("radio", { name: "Out" }));

    expect(handleValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("radio", { name: "Out" })).toHaveClass(
      "pointer-events-none",
      "opacity-50",
    );
  });

  it("forwards native props to the standard radix group and items", () => {
    render(
      <ToggleButtonGroup
        value="in"
        onValueChange={() => {}}
        data-testid="direction-group"
      >
        <ToggleButton value="in" data-testid="direction-in">
          In
        </ToggleButton>
        <ToggleButton value="out">Out</ToggleButton>
      </ToggleButtonGroup>,
    );

    expect(screen.getByTestId("direction-group")).toHaveClass("join");
    expect(screen.getByTestId("direction-group")).toHaveAttribute(
      "role",
      "radiogroup",
    );
    expect(screen.getByTestId("direction-in")).toHaveClass(
      "btn",
      "join-item",
      "c-btn-min-h",
      "c-btn-min-w",
    );
  });

  it("preserves non-toggle children without rewriting them", () => {
    render(
      <ToggleButtonGroup value="in" onValueChange={() => {}}>
        <ToggleButton value="in">In</ToggleButton>
        <span data-testid="separator">/</span>
        <ToggleButton value="out">Out</ToggleButton>
      </ToggleButtonGroup>,
    );

    expect(screen.getByTestId("separator")).toHaveTextContent("/");
  });
});
