# Drawer

This module owns the shared bounded drawer pattern for responsive target/content
layouts.

## Purpose

- Preserve the generic sliding drawer behavior from app workspaces before it
  merges with route state, resource lists, and product-specific row systems.
- Keep the spatial model explicit: a drawer slides over and is bounded by a
  target pane.
- Provide cold reusable primitives for apps that need a target pane on mobile
  and a side-by-side target/content layout on desktop.

## Ownership Boundaries

- This module owns drawer geometry, open/closed presentation, swipe/Escape/back
  mechanics, viewport-derived drawer state, and neutral target/content layout.
- Consuming apps own labels, route/query state, selected IDs, data fetching,
  list rendering, record state, row actions, pagination, and product-specific
  content.
- `DrawerTargetPane` does not assume the target pane is a list.
- `DrawerContent` does not assume the content pane is a detail view.

## Architecture

- `SlidingDrawer.tsx`: animated mobile drawer shell.
- `DrawerTargetPane.tsx`: bounded target/content layout that places content
  beside the target on desktop and inside `SlidingDrawer` on mobile.
- `DrawerContent.tsx`: neutral content boundary for caller-owned content.
- `useDrawerController.ts`: route-agnostic state derivation from caller-proven
  selected state and viewport state.
- `*.test.tsx` and `*.test.ts`: boundary behavior tests.

## Invariants

- Do not import app-local UI, route helpers, label builders, record/list models,
  or data-fetching helpers into this module.
- Keep `targetSlot` and `contentSlot` neutral; do not reintroduce `listSlot`,
  `detailSlot`, `ResourceListPaneItem`, or selected-id search helpers here.
- Back and close actions are caller-owned callbacks.
- The drawer remains bounded by `DrawerTargetPane` through relative/absolute
  containment.

## Public Surface

- `SlidingDrawer`
- `SlidingDrawerProps`
- `SlidingDrawerLabels`
- `DrawerTargetPane`
- `DrawerTargetPaneProps`
- `DrawerPaneRatio`
- `DrawerContent`
- `DrawerContentProps`
- `useDrawerController`
- `UseDrawerControllerParams`
- `UseDrawerControllerResult`
