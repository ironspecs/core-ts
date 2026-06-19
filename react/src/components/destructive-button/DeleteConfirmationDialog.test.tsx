/**
 * Verifies destructive confirmation dialog gating, pending behavior, and
 * caller-provided error rendering.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vitest";
import { DeleteConfirmationDialog } from "./DeleteConfirmationDialog.js";

function renderDialog(
  props?: Partial<ComponentProps<typeof DeleteConfirmationDialog>>,
) {
  const onConfirm = props?.onConfirm ?? vi.fn();
  const onCancel = props?.onCancel ?? vi.fn();
  const onInputValueChange = props?.onInputValueChange ?? vi.fn();

  render(
    <DeleteConfirmationDialog
      isOpen
      labels={{
        title: "Delete resource",
        description: "This action cannot be undone.",
        warning: "You are about to remove this resource permanently.",
        matchLabel: "Type the value below to confirm",
        inputLabel: "Confirmation",
        actions: {
          confirm: "Delete",
          confirmPending: "Deleting...",
          cancel: "Cancel",
        },
      }}
      matchValue="res_123"
      inputValue=""
      onInputValueChange={onInputValueChange}
      isPending={false}
      errorMessage={null}
      onConfirm={onConfirm}
      onCancel={onCancel}
      data-testid="delete-resource-dialog"
      inputProps={{ "data-testid": "delete-resource-input" }}
      cancelButtonProps={{ "data-testid": "delete-resource-cancel" }}
      confirmButtonProps={{ "data-testid": "delete-resource-confirm" }}
      {...props}
    />,
  );

  return { onConfirm, onCancel, onInputValueChange };
}

describe("DeleteConfirmationDialog", () => {
  it("does not render when closed", () => {
    renderDialog({ isOpen: false });
    expect(screen.queryByTestId("delete-resource-dialog")).toBeNull();
  });

  it("keeps confirm disabled until exact match", () => {
    renderDialog({ inputValue: "res_12" });
    const confirmButton = screen.getByTestId("delete-resource-confirm");
    expect(confirmButton).toBeDisabled();
  });

  it("enables confirm when input matches exactly", () => {
    renderDialog({ inputValue: "res_123" });
    const confirmButton = screen.getByTestId("delete-resource-confirm");
    expect(confirmButton).toBeEnabled();
  });

  it("disables confirm while pending", () => {
    renderDialog({ inputValue: "res_123", isPending: true });
    const confirmButton = screen.getByTestId("delete-resource-confirm");
    expect(confirmButton).toBeDisabled();
  });

  it("renders cancel before confirm", () => {
    renderDialog({ inputValue: "res_123" });
    const cancelButton = screen.getByTestId("delete-resource-cancel");
    const confirmButton = screen.getByTestId("delete-resource-confirm");
    const position = cancelButton.compareDocumentPosition(confirmButton);
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("calls change handler when typing", () => {
    const { onInputValueChange } = renderDialog();
    fireEvent.change(screen.getByTestId("delete-resource-input"), {
      target: { value: "res_123" },
    });
    expect(onInputValueChange).toHaveBeenCalledWith("res_123");
  });

  it("renders error message when provided", () => {
    renderDialog({ errorMessage: "Delete blocked by dependencies." });
    expect(screen.getByText("Delete blocked by dependencies.")).toBeTruthy();
  });
});
