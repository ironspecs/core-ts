/**
 * Owns route-agnostic drawer state derivation for bounded drawer layouts. This
 * hook maps caller-proven selection state and viewport state to drawer
 * booleans and the caller-provided back action; it does not own query strings,
 * records, lists, or navigation policy.
 */

import { useMemo } from "react";

import { useMediaQuery } from "../hooks/useMediaQuery.js";

export type UseDrawerControllerParams = {
  isSelected: boolean;
  onRequestBack: () => void;
  desktopQuery?: string;
};

export type UseDrawerControllerResult = {
  isDrawerOpen: boolean;
  isMobile: boolean;
  onRequestBack: () => void;
  isSelected: boolean;
};

const DEFAULT_DESKTOP_QUERY = "(min-width: 768px)";

export function useDrawerController(
  params: UseDrawerControllerParams,
): UseDrawerControllerResult {
  const { isSelected, onRequestBack, desktopQuery } = params;
  const isDesktop = useMediaQuery(desktopQuery ?? DEFAULT_DESKTOP_QUERY);
  const isMobile = !isDesktop;

  return useMemo(
    () => ({
      isDrawerOpen: isMobile && isSelected,
      isMobile,
      onRequestBack,
      isSelected,
    }),
    [isMobile, isSelected, onRequestBack],
  );
}
