/**
 * Owns the feature-gated action button. It loads caller-provided feature data,
 * resolves enabled/locked/dormant access, and opens a locked dialog instead of
 * running the action when access is unavailable.
 */

import { useMemo, useState } from "react";
import { skipToken, useQuery } from "@tanstack/react-query";
import { cn } from "../../lib/cn.js";
import { FeatureLockedDialog } from "./FeatureLockedDialog.js";
import { isSubscriptionFeatureEnabled } from "./feature-access.js";
import type {
  FeatureButtonAccessState,
  FeatureButtonConfig,
  FeatureButtonSize,
  FeatureButtonVariant,
} from "./types.js";

function toButtonSizeClass(size: FeatureButtonSize): string {
  const map: Record<FeatureButtonSize, string> = {
    xs: "",
    sm: "",
    md: "btn-md",
    lg: "btn-lg",
  };

  return map[size];
}

function toButtonVariantClass(variant: FeatureButtonVariant): string {
  const map: Record<FeatureButtonVariant, string> = {
    primary: "btn-primary",
    ghost: "btn-ghost",
    outline: "btn-outline",
  };

  return map[variant];
}

export type FeatureButtonProps =
  React.ButtonHTMLAttributes<HTMLButtonElement> & FeatureButtonConfig;

export function FeatureButton(props: FeatureButtonProps) {
  const {
    labels,
    featureKey,
    featureName,
    accountId,
    session,
    fetchFeatures,
    onEnabledClick,
    forceLocked,
    lockedMarkdown,
    variant = "primary",
    size = "sm",
    className,
    startIcon,
    disabled,
    lockedDialogProps,
    lockedCloseButtonProps,
    type = "button",
    ...buttonProps
  } = props;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const featureAccessQueryInput =
    session && !disabled && !forceLocked
      ? { session, accountId, featureKey, fetchFeatures }
      : null;
  const featureAccessQuery = useQuery({
    queryKey: ["feature-button-access", accountId, featureKey],
    queryFn: featureAccessQueryInput
      ? async () => {
          const features = await featureAccessQueryInput.fetchFeatures({
            session: featureAccessQueryInput.session,
            accountId: featureAccessQueryInput.accountId,
          });
          return isSubscriptionFeatureEnabled({
            features,
            featureKey: featureAccessQueryInput.featureKey,
          });
        }
      : skipToken,
    retry: false,
  });
  if (featureAccessQuery.isError) {
    throw featureAccessQuery.error;
  }
  const accessState = useMemo<FeatureButtonAccessState>(() => {
    if (!featureAccessQueryInput) {
      return "locked";
    }
    if (featureAccessQuery.isPending) {
      return "dormant";
    }
    return featureAccessQuery.data ? "enabled" : "locked";
  }, [
    featureAccessQueryInput,
    featureAccessQuery.data,
    featureAccessQuery.isPending,
  ]);

  const isLocked = accessState === "locked";
  const isDormant = accessState === "dormant";

  function handleClick() {
    if (isLocked) {
      setIsDialogOpen(true);
    } else {
      onEnabledClick();
    }
  }

  return (
    <>
      <button
        {...buttonProps}
        type={type}
        className={cn(
          "btn",
          isLocked ? null : toButtonVariantClass(variant),
          toButtonSizeClass(size),
          isDormant ? "btn-disabled" : null,
          isLocked ? "btn-locked" : null,
          className,
        )}
        onClick={handleClick}
        disabled={Boolean(disabled) || isDormant}
        aria-busy={isDormant}
      >
        {isDormant ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          startIcon
        )}
        {labels.trigger}
      </button>

      <FeatureLockedDialog
        {...lockedDialogProps}
        isOpen={isDialogOpen}
        labels={labels.lockedDialog}
        featureName={featureName}
        markdown={lockedMarkdown}
        onClose={() => setIsDialogOpen(false)}
        closeButtonProps={lockedCloseButtonProps}
      />
    </>
  );
}
