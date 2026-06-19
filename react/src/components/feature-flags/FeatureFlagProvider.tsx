import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { type FeatureFlags, resolveFeatureFlags } from "./feature-flags.js";

type FeatureFlagsContextType = {
  featureFlags: FeatureFlags;
  setUserFlags: (flags: FeatureFlags) => void;
};

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(
  undefined,
);

export type FeatureFlagProviderProps = {
  contextFlags?: FeatureFlags;
  children: ReactNode;
};
export function FeatureFlagProvider(props: FeatureFlagProviderProps) {
  const { contextFlags = {}, children } = props;
  const parentContext = useContext(FeatureFlagsContext);
  const globalSessionFlags = useMemo(
    () => ({
      ...(parentContext?.featureFlags || resolveFeatureFlags()),
    }),
    [parentContext?.featureFlags],
  );
  const staticFeatureFlags = useMemo(
    () => ({
      ...globalSessionFlags,
      ...contextFlags,
    }),
    [globalSessionFlags, contextFlags],
  );
  const [userFlags, setUserFlagsInternal] = useState<FeatureFlags>({});
  const setUserFlags = parentContext?.setUserFlags || setUserFlagsInternal;

  const featureFlags = useMemo(
    () => ({ ...staticFeatureFlags, ...userFlags }),
    [staticFeatureFlags, userFlags],
  );

  return (
    <FeatureFlagsContext.Provider value={{ featureFlags, setUserFlags }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags(): FeatureFlagsContextType {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error(
      "useFeatureFlags must be used within a FeatureFlagProvider",
    );
  }

  return context;
}
