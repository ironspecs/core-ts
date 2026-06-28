/**
 * Owns the neutral content-pane wrapper used inside bounded drawer layouts.
 * This file does not own data loading, route selection, labels, or product
 * detail behavior; it only provides a stable content boundary for callers.
 */

import type { HTMLAttributes, ReactNode } from "react";

import { cn } from "../lib/cn.js";

export type DrawerContentProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function DrawerContent(props: DrawerContentProps) {
  const { children, className, ...rootProps } = props;

  return (
    <div {...rootProps} className={cn("min-w-0", className)}>
      {children}
    </div>
  );
}
