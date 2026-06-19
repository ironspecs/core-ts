/**
 * Owns the confirmation dialog used by destructive buttons. The dialog requires
 * an exact typed match before enabling confirmation and keeps pending/error
 * rendering separate from the action owner.
 */

import { cn } from "../../lib/cn.js";
import { Typography } from "../ui/Typography.js";

export type DeleteConfirmationDialogLabels = {
  title: string;
  description: string;
  warning: string;
  matchLabel: string;
  inputLabel: string;
  inputPlaceholder?: string;
  actions: {
    confirm: string;
    confirmPending: string;
    cancel: string;
  };
};

function isConfirmEnabled(params: {
  isPending: boolean;
  inputValue: string;
  matchValue: string;
}): boolean {
  return !params.isPending && params.inputValue === params.matchValue;
}

export type DeleteConfirmationDialogProps =
  React.ComponentPropsWithoutRef<"dialog"> & {
    isOpen: boolean;
    labels: DeleteConfirmationDialogLabels;
    matchValue: string;
    inputValue: string;
    onInputValueChange: (next: string) => void;
    isPending: boolean;
    errorMessage: string | null;
    onConfirm: () => void;
    onCancel: () => void;
    inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
    cancelButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
    confirmButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  };

export function DeleteConfirmationDialog(
  props: DeleteConfirmationDialogProps,
) {
  if (!props.isOpen) return null;

  const confirmEnabled = isConfirmEnabled({
    isPending: props.isPending,
    inputValue: props.inputValue,
    matchValue: props.matchValue,
  });

  const {
    isOpen: _isOpen,
    labels,
    matchValue,
    inputValue,
    onInputValueChange,
    isPending,
    errorMessage,
    onConfirm,
    onCancel,
    inputProps,
    cancelButtonProps,
    confirmButtonProps,
    className,
    ...dialogProps
  } = props;

  return (
    <dialog {...dialogProps} open className={cn("modal modal-open", className)}>
      <div className="modal-box w-full max-w-lg space-y-5">
        <div className="space-y-2">
          <Typography variant="title" size="sm" className="block">
            {labels.title}
          </Typography>
          <Typography variant="subtitle" className="block">
            {labels.description}
          </Typography>
        </div>

        <Typography variant="body" className="block">
          {labels.warning}
        </Typography>

        <div className="rounded-box bg-base-200/60 space-y-2 p-3">
          <Typography variant="hint" className="block">
            {labels.matchLabel}
          </Typography>
          <Typography variant="mono" size="sm" className="block break-all">
            {matchValue}
          </Typography>
        </div>

        <label className="form-control w-full gap-2">
          <Typography variant="body" className="block">
            {labels.inputLabel}
          </Typography>
          <input
            {...inputProps}
            type="text"
            className="input input-bordered w-full"
            value={inputValue}
            onChange={(event) => onInputValueChange(event.target.value)}
            placeholder={labels.inputPlaceholder}
          />
        </label>

        {errorMessage ? (
          <Typography variant="hint" className="text-error block">
            {errorMessage}
          </Typography>
        ) : null}

        <div className="modal-action">
          <button
            {...cancelButtonProps}
            type="button"
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={isPending}
          >
            {labels.actions.cancel}
          </button>
          <button
            {...confirmButtonProps}
            type="button"
            className="btn btn-error"
            onClick={onConfirm}
            disabled={!confirmEnabled}
          >
            {isPending ? labels.actions.confirmPending : labels.actions.confirm}
          </button>
        </div>
      </div>
      <div className="modal-backdrop">
        <button
          type="button"
          aria-label={labels.actions.cancel}
          onClick={onCancel}
          disabled={isPending}
        >
          {labels.actions.cancel}
        </button>
      </div>
    </dialog>
  );
}
