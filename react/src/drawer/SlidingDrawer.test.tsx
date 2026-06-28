/**
 * Verifies the public behavior of the animated drawer shell without depending
 * on Framer Motion's animation runtime.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import type { HTMLAttributes, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { SlidingDrawer } from "./SlidingDrawer.js";

vi.mock("framer-motion", () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({
      children,
      initial: _initial,
      animate: _animate,
      exit: _exit,
      transition: _transition,
      drag: _drag,
      dragConstraints: _dragConstraints,
      dragElastic: _dragElastic,
      onDragEnd: _onDragEnd,
      ...props
    }: HTMLAttributes<HTMLDivElement> & {
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
      drag?: string;
      dragConstraints?: unknown;
      dragElastic?: number;
      onDragEnd?: unknown;
    }) => <div {...props}>{children}</div>,
  },
}));

describe("SlidingDrawer", () => {
  it("renders children and back button when open", () => {
    render(
      <SlidingDrawer
        isOpen={true}
        onRequestClose={vi.fn()}
        labels={{ back: "Back" }}
      >
        <p>Drawer content</p>
      </SlidingDrawer>,
    );

    expect(screen.getByText("Drawer content")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    render(
      <SlidingDrawer
        isOpen={false}
        onRequestClose={vi.fn()}
        labels={{ back: "Back" }}
      >
        <p>Drawer content</p>
      </SlidingDrawer>,
    );

    expect(screen.queryByText("Drawer content")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Back" }),
    ).not.toBeInTheDocument();
  });

  it("calls onRequestClose from the back button", () => {
    const onRequestClose = vi.fn();

    render(
      <SlidingDrawer
        isOpen={true}
        onRequestClose={onRequestClose}
        labels={{ back: "Go back" }}
      >
        <p>Drawer content</p>
      </SlidingDrawer>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Go back" }));

    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  it("calls onRequestClose on Escape when open", () => {
    const onRequestClose = vi.fn();

    render(
      <SlidingDrawer
        isOpen={true}
        onRequestClose={onRequestClose}
        labels={{ back: "Back" }}
      >
        <p>Drawer content</p>
      </SlidingDrawer>,
    );

    fireEvent.keyDown(document, { key: "Escape" });

    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });
});
