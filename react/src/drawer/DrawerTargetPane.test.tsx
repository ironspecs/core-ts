/**
 * Verifies the bounded target/content layout behavior without importing any
 * app list, record, route, or label-helper concepts.
 */

import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { useMediaQuery } from "../hooks/useMediaQuery.js";
import { DrawerTargetPane } from "./DrawerTargetPane.js";

vi.mock("../hooks/useMediaQuery.js", () => ({
  useMediaQuery: vi.fn(),
}));

vi.mock("./SlidingDrawer.js", () => ({
  SlidingDrawer: ({
    children,
    isOpen,
  }: {
    children: ReactNode;
    isOpen: boolean;
  }) =>
    isOpen ? <div data-testid="mock-sliding-drawer">{children}</div> : null,
}));

const mockUseMediaQuery = vi.mocked(useMediaQuery);

const defaultProps = {
  targetSlot: <div data-testid="target-slot">Target</div>,
  contentSlot: <div data-testid="content-slot">Content</div>,
  isDrawerOpen: false,
  onRequestClose: vi.fn(),
  drawerLabels: { back: "Back" },
};

describe("DrawerTargetPane", () => {
  it("renders target and desktop content when desktop query matches", () => {
    mockUseMediaQuery.mockReturnValue(true);

    render(<DrawerTargetPane {...defaultProps} />);

    expect(screen.getByTestId("target-slot")).toBeInTheDocument();
    expect(screen.getByTestId("content-slot")).toBeInTheDocument();
    expect(screen.queryByTestId("mock-sliding-drawer")).not.toBeInTheDocument();
  });

  it("renders target and mobile drawer content when open on mobile", () => {
    mockUseMediaQuery.mockReturnValue(false);

    render(<DrawerTargetPane {...defaultProps} isDrawerOpen={true} />);

    expect(screen.getByTestId("target-slot")).toBeInTheDocument();
    expect(screen.getByTestId("mock-sliding-drawer")).toBeInTheDocument();
    expect(screen.getAllByTestId("content-slot")).toHaveLength(1);
  });

  it("does not render content on mobile when closed", () => {
    mockUseMediaQuery.mockReturnValue(false);

    render(<DrawerTargetPane {...defaultProps} isDrawerOpen={false} />);

    expect(screen.getByTestId("target-slot")).toBeInTheDocument();
    expect(screen.queryByTestId("content-slot")).not.toBeInTheDocument();
  });

  it("forwards layout props and custom desktop query", () => {
    mockUseMediaQuery.mockReturnValue(true);

    render(
      <DrawerTargetPane
        {...defaultProps}
        columns="3/9"
        minHeight="300px"
        desktopQuery="(min-width: 1024px)"
        className="custom-layout"
        data-testid="layout"
      />,
    );

    expect(mockUseMediaQuery).toHaveBeenCalledWith("(min-width: 1024px)");
    expect(screen.getByTestId("layout")).toHaveClass("custom-layout");
    expect(screen.getByTestId("layout")).toHaveStyle({ minHeight: "300px" });
  });

  it("uses minHeight prop over style minHeight", () => {
    mockUseMediaQuery.mockReturnValue(true);

    render(
      <DrawerTargetPane
        {...defaultProps}
        minHeight="300px"
        style={{ minHeight: "100px" }}
        data-testid="layout"
      />,
    );

    expect(screen.getByTestId("layout")).toHaveStyle({ minHeight: "300px" });
  });
});
