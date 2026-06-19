/**
 * Owns the destructive action trigger plus confirmation-dialog state. Callers
 * own labels, pending/error state, and the actual destructive operation.
 */

import {
  type ButtonHTMLAttributes,
  type ComponentPropsWithoutRef,
  type InputHTMLAttributes,
  useCallback,
  useState,
} from "react";
import { cn } from "../../lib/cn.js";
import {
  DeleteConfirmationDialog,
  type DeleteConfirmationDialogLabels,
} from "./DeleteConfirmationDialog.js";

export type DestructiveButtonLabels = {
  trigger: string;
  dialog: DeleteConfirmationDialogLabels;
};

export type DestructiveButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  labels: DestructiveButtonLabels;
  matchValue: string;
  isPending: boolean;
  errorMessage: string | null;
  onConfirm: () => void | Promise<void>;
  onOpen?: () => void;
  onCancel?: () => void;
  dialogProps?: ComponentPropsWithoutRef<"dialog">;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
  cancelButtonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  confirmButtonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
};

export function DestructiveButton(props: DestructiveButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const {
    labels,
    matchValue,
    isPending,
    errorMessage,
    onConfirm,
    onOpen,
    onCancel,
    dialogProps,
    inputProps,
    cancelButtonProps,
    confirmButtonProps,
    className,
    type = "button",
    ...buttonProps
  } = props;
  const isTriggerDisabled = props.disabled || isPending;

  const handleOpen = useCallback(() => {
    onOpen?.();
    setInputValue("");
    setIsDialogOpen(true);
  }, [onOpen]);

  const handleCancel = useCallback(() => {
    onCancel?.();
    setInputValue("");
    setIsDialogOpen(false);
  }, [onCancel]);

  return (
    <>
      <button
        {...buttonProps}
        type={type}
        className={cn("btn btn-error", className)}
        onClick={handleOpen}
        disabled={isTriggerDisabled}
      >
        {labels.trigger}
      </button>

      <DeleteConfirmationDialog
        {...dialogProps}
        isOpen={isDialogOpen}
        labels={labels.dialog}
        matchValue={matchValue}
        inputValue={inputValue}
        onInputValueChange={setInputValue}
        isPending={isPending}
        errorMessage={errorMessage}
        onConfirm={onConfirm}
        onCancel={handleCancel}
        inputProps={inputProps}
        cancelButtonProps={cancelButtonProps}
        confirmButtonProps={confirmButtonProps}
      />
    </>
  );
}
