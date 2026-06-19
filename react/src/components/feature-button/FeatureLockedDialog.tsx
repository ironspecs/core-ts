/**
 * Owns the locked-state explanation dialog for feature-gated controls. The
 * caller owns all labels and optional plan/help content.
 */

import type { ReactNode } from "react";
import { cn } from "../../lib/cn.js";
import { Typography } from "../ui/Typography.js";
import type { FeatureButtonLabels } from "./types.js";

export type FeatureLockedDialogProps =
  React.ComponentPropsWithoutRef<"dialog"> & {
    isOpen: boolean;
    labels: FeatureButtonLabels["lockedDialog"];
    featureName: string;
    markdown?: ReactNode;
    onClose: () => void;
    closeButtonProps?: React.ButtonHTMLAttributes<HTMLButtonElement>;
  };

export function FeatureLockedDialog(props: FeatureLockedDialogProps) {
  if (!props.isOpen) return null;

  const {
    isOpen: _isOpen,
    labels,
    featureName,
    markdown,
    onClose,
    closeButtonProps,
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

        <div className="rounded-box bg-base-200/60 space-y-2 p-3">
          <Typography variant="hint" className="block">
            {labels.featureNameLabel}
          </Typography>
          <Typography variant="body" className="block">
            {featureName}
          </Typography>
        </div>

        {markdown ? <div>{markdown}</div> : null}

        <div className="modal-action">
          <button
            {...closeButtonProps}
            type="button"
            className="btn btn-primary"
            onClick={onClose}
          >
            {labels.actions.close}
          </button>
        </div>
      </div>
      <div className="modal-backdrop">
        <button
          type="button"
          aria-label={labels.actions.close}
          onClick={onClose}
        >
          {labels.actions.close}
        </button>
      </div>
    </dialog>
  );
}
