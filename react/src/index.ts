import "./types/react-augmented.js";

export { ErrorBoundary } from "./components/errors/ErrorBoundary.js";
export type { ErrorBoundaryLabels } from "./components/errors/ErrorBoundary.js";
export {
  FeatureFlagProvider,
  useFeatureFlags,
  resolveFeatureFlags,
} from "./components/feature-flags/index.js";
export type {
  FeatureFlagProviderProps,
  FeatureFlags,
} from "./components/feature-flags/index.js";
export { Heading } from "./components/ui/Heading.js";
export type { HeadingElement, HeadingProps } from "./components/ui/Heading.js";
export { useMediaQuery } from "./hooks/useMediaQuery.js";
export { useMountEffect } from "./hooks/useMountEffect.js";
export { MarkdownBlock } from "./components/markdown/index.js";
export type { MarkdownBlockProps } from "./components/markdown/index.js";
export { ThemeToggleIconButton } from "./components/theme-toggle/index.js";
export type {
  Theme,
  ThemePreferenceContext,
  ThemePreferenceOptions,
  ThemeToggleIconButtonLabels,
  ThemeToggleIconButtonProps,
} from "./components/theme-toggle/index.js";
export { cn } from "./lib/cn.js";
export { Typography } from "./components/ui/Typography.js";
