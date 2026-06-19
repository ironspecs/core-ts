/**
 * Owns public type contracts for feature-gated buttons. Callers provide labels,
 * feature identity, action behavior, and feature loading policy.
 */

import type {
  ButtonHTMLAttributes,
  ComponentPropsWithoutRef,
  ReactNode,
} from "react";
import type { SubscriptionFeatureLike } from "./feature-access.js";

export type FeatureButtonLabels = {
  trigger: string;
  lockedDialog: {
    title: string;
    description: string;
    featureNameLabel: string;
    actions: {
      close: string;
    };
  };
};

export type FeatureButtonSession = {
  fetch: (url: string | URL, init?: RequestInit) => Promise<Response>;
};

export type FetchAccountSubscriptionFeatures = (params: {
  session: FeatureButtonSession;
  accountId: string;
}) => Promise<SubscriptionFeatureLike[]>;

export type FeatureButtonVariant = "primary" | "ghost" | "outline";
export type FeatureButtonSize = "xs" | "sm" | "md" | "lg";
export type FeatureButtonAccessState = "dormant" | "enabled" | "locked";

export type FeatureButtonConfig = {
  labels: FeatureButtonLabels;
  featureKey: string;
  featureName: string;
  accountId: string;
  session: FeatureButtonSession | null;
  fetchFeatures: FetchAccountSubscriptionFeatures;
  onEnabledClick: () => void;
  forceLocked?: boolean;
  lockedMarkdown?: ReactNode;
  variant?: FeatureButtonVariant;
  size?: FeatureButtonSize;
  startIcon?: ReactNode;
  disabled?: boolean;
  lockedDialogProps?: ComponentPropsWithoutRef<"dialog">;
  lockedCloseButtonProps?: ButtonHTMLAttributes<HTMLButtonElement>;
};
