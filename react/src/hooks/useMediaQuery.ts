import { useSyncExternalStore } from "react";

function subscribeToMediaQuery(
  query: string,
  onStoreChange: () => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const mediaQuery = window.matchMedia(query);
  mediaQuery.addEventListener?.("change", onStoreChange);

  return () => {
    mediaQuery.removeEventListener?.("change", onStoreChange);
  };
}

function getMediaQuerySnapshot(query: string): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.matchMedia(query).matches;
}

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => subscribeToMediaQuery(query, onStoreChange),
    () => getMediaQuerySnapshot(query),
    () => false,
  );
}
