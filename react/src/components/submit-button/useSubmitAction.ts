/**
 * Owns submit transaction state for one async action. It prevents duplicate
 * runs while busy or completed and returns to idle only when the action fails.
 */

import { useCallback, useRef, useState } from "react";
import { type SubmitButtonState } from "./SubmitButton.js";

export type SubmitActionRunResult = "started" | "skipped";

function toErrorMessageSafe(
  error: unknown,
  fallbackMessage?: string,
): string | null {
  return error instanceof Error ? error.message : (fallbackMessage ?? null);
}

export type UseSubmitActionParams = {
  action: () => void | Promise<void>;
  fallbackMessage?: string;
};

export type UseSubmitActionResult = {
  buttonState: SubmitButtonState;
  error: string | null;
  lastError: unknown;
  isPending: boolean;
  runIfIdle: () => Promise<SubmitActionRunResult>;
  setError: (value: string | null) => void;
};

export function useSubmitAction(
  params: UseSubmitActionParams,
): UseSubmitActionResult {
  const { action, fallbackMessage } = params;
  const [buttonState, setButtonState] = useState<SubmitButtonState>("idle");
  const [errorState, setErrorState] = useState<{
    message: string | null;
    cause: unknown;
  }>({
    message: null,
    cause: null,
  });
  const isRunningRef = useRef(false);
  const isCompletedRef = useRef(false);

  const runIfIdle = useCallback(async (): Promise<SubmitActionRunResult> => {
    if (!isRunningRef.current && !isCompletedRef.current) {
      isRunningRef.current = true;
      setErrorState({ message: null, cause: null });
      setButtonState("busy");
      try {
        await action();
        isCompletedRef.current = true;
        setButtonState("success");
      } catch (error) {
        setErrorState({
          message: toErrorMessageSafe(error, fallbackMessage),
          cause: error,
        });
        setButtonState("idle");
      } finally {
        isRunningRef.current = false;
      }
      return "started";
    }
    return "skipped";
  }, [action, fallbackMessage]);

  const setError = useCallback((value: string | null) => {
    setErrorState({ message: value, cause: null });
  }, []);

  return {
    buttonState,
    error: errorState.message,
    lastError: errorState.cause,
    isPending: buttonState === "busy",
    runIfIdle,
    setError,
  };
}
