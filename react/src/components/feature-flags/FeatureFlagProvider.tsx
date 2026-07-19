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
  definitions: Record<string, unknown>;
  setUserFlags: (flags: FeatureFlags) => void;
};

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(
  undefined,
);

export type FeatureFlagProviderProps = {
  contextFlags?: FeatureFlags;
  definitions?: Record<string, unknown>;
  children: ReactNode;
};

export function FeatureFlagProvider(props: FeatureFlagProviderProps) {
  const { contextFlags = {}, definitions = {}, children } = props;
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

  const resolvedDefinitions = useMemo(
    () => ({
      ...(parentContext?.definitions ?? {}),
      ...definitions,
    }),
    [parentContext?.definitions, definitions],
  );

  return (
    <FeatureFlagsContext.Provider
      value={{ featureFlags, definitions: resolvedDefinitions, setUserFlags }}
    >
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

function coerceFlagValue(
  raw: string | undefined,
  defaultValue: unknown,
): unknown {
  if (raw !== undefined) {
    if (typeof defaultValue === "boolean") {
      if (raw === "") return true;
      return raw !== "false" && raw !== "0";
    }
    if (typeof defaultValue === "number") {
      const parsed = Number(raw);
      if (Number.isFinite(parsed)) return parsed;
    }
    return raw;
  }
  return defaultValue;
}

export function useFeatureFlag(key: string): {
  value: unknown;
  isReady: boolean;
  isOverridden: boolean;
} {
  const context = useContext(FeatureFlagsContext);
  if (!context) {
    throw new Error(
      "useFeatureFlag must be used within a FeatureFlagProvider",
    );
  }

  const { featureFlags, definitions } = context;
  const raw = featureFlags[key];
  const defaultValue = definitions[key];
  const isOverridden = raw !== undefined;

  return {
    value: isOverridden ? coerceFlagValue(raw, defaultValue) : defaultValue,
    isReady: true,
    isOverridden,
  };
}
