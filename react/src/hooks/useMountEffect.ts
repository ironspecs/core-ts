import * as React from "react";

export function useMountEffect(effect: () => void | (() => void)): void {
  /* eslint-disable no-restricted-syntax */
  React.useEffect(effect, []);
}
