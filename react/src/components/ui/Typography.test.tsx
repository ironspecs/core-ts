import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Typography } from "./Typography.js";

describe("Typography", () => {
  it("renders a span by default", () => {
    render(<Typography>Body copy</Typography>);

    expect(screen.getByText("Body copy").tagName).toBe("SPAN");
    expect(screen.getByText("Body copy")).toHaveClass("font-medium", "text-sm");
  });

  it("applies variant and size classes", () => {
    render(
      <Typography variant="title" size="lg">
        Title
      </Typography>,
    );

    expect(screen.getByText("Title")).toHaveClass("font-semibold", "text-3xl");
  });

  it("applies muted styling", () => {
    render(
      <Typography muted variant="hint">
        Hint
      </Typography>,
    );

    expect(screen.getByText("Hint")).toHaveClass("opacity-70");
  });

  it("merges caller class names last", () => {
    render(
      <Typography variant="mono" className="custom-class">
        Mono
      </Typography>,
    );

    expect(screen.getByText("Mono")).toHaveClass("font-mono", "custom-class");
  });
});
