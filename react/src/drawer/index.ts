/**
 * Owns the public exports for the drawer module. This file is only a stable
 * module boundary and does not add behavior beyond root exports.
 */

export { DrawerContent } from "./DrawerContent.js";
export type { DrawerContentProps } from "./DrawerContent.js";
export { DrawerTargetPane } from "./DrawerTargetPane.js";
export type {
  DrawerPaneRatio,
  DrawerTargetPaneProps,
} from "./DrawerTargetPane.js";
export { SlidingDrawer } from "./SlidingDrawer.js";
export type {
  SlidingDrawerLabels,
  SlidingDrawerProps,
} from "./SlidingDrawer.js";
export { useDrawerController } from "./useDrawerController.js";
export type {
  UseDrawerControllerParams,
  UseDrawerControllerResult,
} from "./useDrawerController.js";
