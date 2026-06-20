/**
 * Owns the public exports for the react package. This file is the only
 * supported package API boundary and does not add behavior beyond stable root
 * exports.
 */

import "./types/react-augmented.js";

export { ErrorBoundary } from "./components/errors/ErrorBoundary.js";
export type { ErrorBoundaryLabels } from "./components/errors/ErrorBoundary.js";
export {
  DeleteConfirmationDialog,
  DestructiveButton,
} from "./components/destructive-button/index.js";
export type {
  DeleteConfirmationDialogLabels,
  DeleteConfirmationDialogProps,
  DestructiveButtonLabels,
  DestructiveButtonProps,
} from "./components/destructive-button/index.js";
export {
  FeatureFlagProvider,
  useFeatureFlags,
  resolveFeatureFlags,
} from "./components/feature-flags/index.js";
export type {
  FeatureFlagProviderProps,
  FeatureFlags,
} from "./components/feature-flags/index.js";
export {
  FeatureButton,
  FeatureLockedDialog,
  isSubscriptionFeatureEnabled,
} from "./components/feature-button/index.js";
export type {
  FeatureButtonAccessState,
  FeatureButtonConfig,
  FeatureButtonLabels,
  FeatureButtonProps,
  FeatureButtonSession,
  FeatureButtonSize,
  FeatureButtonVariant,
  FeatureLockedDialogProps,
  FetchAccountSubscriptionFeatures,
  SubscriptionFeatureLike,
} from "./components/feature-button/index.js";
export { Heading } from "./components/ui/Heading.js";
export type { HeadingElement, HeadingProps } from "./components/ui/Heading.js";
export { useMediaQuery } from "./hooks/useMediaQuery.js";
export { useMountEffect } from "./hooks/useMountEffect.js";
export { MarkdownBlock } from "./components/markdown/index.js";
export type { MarkdownBlockProps } from "./components/markdown/index.js";
export {
  SubmitButton,
  useSubmitAction,
} from "./components/submit-button/index.js";
export type {
  SubmitButtonProps,
  SubmitButtonState,
  SubmitActionRunResult,
  UseSubmitActionParams,
  UseSubmitActionResult,
} from "./components/submit-button/index.js";
export { ThemeToggleIconButton } from "./components/theme-toggle/index.js";
export type {
  Theme,
  ThemePreferenceContext,
  ThemePreferenceOptions,
  ThemeToggleIconButtonLabels,
  ThemeToggleIconButtonProps,
} from "./components/theme-toggle/index.js";
export { cn } from "./lib/cn.js";
export {
  createMock,
  deleteByPath,
  getByPath,
  getByPathOr,
  setByPath,
} from "./lib/objs.js";
export type { DeepPartial } from "./lib/objs.js";
export { Typography } from "./components/ui/Typography.js";
