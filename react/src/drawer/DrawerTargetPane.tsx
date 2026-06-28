/**
 * Owns the bounded target/content drawer layout. The target pane is the area
 * the mobile drawer slides over and is bounded by; callers decide whether the
 * target is a list, rail, menu, or another product-specific surface.
 */

import type { HTMLAttributes, ReactNode } from "react";

import { useMediaQuery } from "../hooks/useMediaQuery.js";
import { cn } from "../lib/cn.js";
import { SlidingDrawer, type SlidingDrawerLabels } from "./SlidingDrawer.js";

export type DrawerPaneRatio = "3/9" | "4/8" | "5/7" | "6/6";

const paneRatioClasses: Record<
  DrawerPaneRatio,
  { target: string; content: string }
> = {
  "3/9": { target: "md:col-span-3", content: "md:col-span-9" },
  "4/8": { target: "md:col-span-4", content: "md:col-span-8" },
  "5/7": { target: "md:col-span-5", content: "md:col-span-7" },
  "6/6": { target: "md:col-span-6", content: "md:col-span-6" },
};

export type DrawerTargetPaneProps = HTMLAttributes<HTMLDivElement> & {
  targetSlot: ReactNode;
  contentSlot: ReactNode;
  isDrawerOpen: boolean;
  onRequestClose: () => void;
  drawerLabels: SlidingDrawerLabels;
  columns?: DrawerPaneRatio;
  minHeight?: string;
  desktopQuery?: string;
};

export function DrawerTargetPane(props: DrawerTargetPaneProps) {
  const {
    targetSlot,
    contentSlot,
    isDrawerOpen,
    onRequestClose,
    drawerLabels,
    columns = "4/8",
    minHeight = "520px",
    desktopQuery = "(min-width: 768px)",
    className,
    style,
    ...rootProps
  } = props;

  const isDesktop = useMediaQuery(desktopQuery);
  const paneClasses = paneRatioClasses[columns];

  return (
    <div
      {...rootProps}
      className={cn(
        "relative grid h-full grid-cols-1 gap-2 md:grid-cols-12",
        className,
      )}
      style={{ ...style, minHeight }}
    >
      <div className={cn("col-span-1", paneClasses.target)}>{targetSlot}</div>

      {isDesktop ? (
        <div className={cn("col-span-1", paneClasses.content)}>
          {contentSlot}
        </div>
      ) : null}

      {!isDesktop ? (
        <SlidingDrawer
          isOpen={isDrawerOpen}
          onRequestClose={onRequestClose}
          labels={drawerLabels}
        >
          {contentSlot}
        </SlidingDrawer>
      ) : null}
    </div>
  );
}
