/**
 * Verifies the destructive button trigger and its dialog state handoff.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { DestructiveButton } from "./DestructiveButton.js";

function renderButton(
  props?: Partial<ComponentProps<typeof DestructiveButton>>,
) {
  const onConfirm = props?.onConfirm ?? vi.fn();
  const onOpen = props?.onOpen ?? vi.fn();
  const onCancel = props?.onCancel ?? vi.fn();

  render(
    <DestructiveButton
      labels={{
        trigger: "Delete resource",
        dialog: {
          title: "Delete resource",
          description: "This action cannot be undone.",
          warning: "You are about to remove this resource permanently.",
          matchLabel: "Type this value to confirm:",
          inputLabel: "Confirmation value",
          inputPlaceholder: "res_123",
          actions: {
            confirm: "Delete resource",
            confirmPending: "Deleting...",
            cancel: "Cancel",
          },
        },
      }}
      matchValue="res_123"
      isPending={false}
      errorMessage={null}
      onConfirm={onConfirm}
      onOpen={onOpen}
      onCancel={onCancel}
      data-testid="delete-resource-open"
      dialogProps={{ "data-testid": "delete-resource-dialog" }}
      inputProps={{ "data-testid": "delete-resource-input" }}
      cancelButtonProps={{ "data-testid": "delete-resource-cancel" }}
      confirmButtonProps={{ "data-testid": "delete-resource-confirm" }}
      {...props}
    />,
  );

  return { onConfirm, onOpen, onCancel };
}

describe("DestructiveButton", () => {
  it("opens confirmation dialog when trigger is clicked", () => {
    const { onOpen } = renderButton();
    fireEvent.click(screen.getByTestId("delete-resource-open"));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("delete-resource-dialog")).toBeTruthy();
  });

  it("does not open dialog when trigger is disabled", () => {
    renderButton({ disabled: true });
    fireEvent.click(screen.getByTestId("delete-resource-open"));
    expect(screen.queryByTestId("delete-resource-dialog")).toBeNull();
  });

  it("does not open dialog when pending", () => {
    renderButton({ isPending: true });
    fireEvent.click(screen.getByTestId("delete-resource-open"));
    expect(screen.queryByTestId("delete-resource-dialog")).toBeNull();
  });

  it("uses explicit trigger test id when provided", () => {
    renderButton({ "data-testid": "resource-delete-open" });
    expect(screen.getByTestId("resource-delete-open")).toBeTruthy();
  });

  it("resets confirmation input when closing and reopening", () => {
    renderButton();
    fireEvent.click(screen.getByTestId("delete-resource-open"));
    fireEvent.change(screen.getByTestId("delete-resource-input"), {
      target: { value: "res_123" },
    });
    fireEvent.click(screen.getByTestId("delete-resource-cancel"));

    fireEvent.click(screen.getByTestId("delete-resource-open"));
    expect(screen.getByTestId("delete-resource-input")).toHaveValue("");
  });

  it("calls onCancel and closes dialog when cancel is clicked", () => {
    const { onCancel } = renderButton();
    fireEvent.click(screen.getByTestId("delete-resource-open"));
    fireEvent.click(screen.getByTestId("delete-resource-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId("delete-resource-dialog")).toBeNull();
  });

  it("forwards confirm handler from dialog", () => {
    const { onConfirm } = renderButton();
    fireEvent.click(screen.getByTestId("delete-resource-open"));
    fireEvent.change(screen.getByTestId("delete-resource-input"), {
      target: { value: "res_123" },
    });
    fireEvent.click(screen.getByTestId("delete-resource-confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("keeps confirm disabled for non-matching input", () => {
    const { onConfirm } = renderButton();
    fireEvent.click(screen.getByTestId("delete-resource-open"));
    fireEvent.change(screen.getByTestId("delete-resource-input"), {
      target: { value: "res_12" },
    });
    const confirmButton = screen.getByTestId("delete-resource-confirm");
    expect(confirmButton).toBeDisabled();
    fireEvent.click(confirmButton);
    expect(onConfirm).toHaveBeenCalledTimes(0);
  });
});
