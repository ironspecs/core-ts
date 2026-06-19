import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Heading } from "./Heading.js";

describe("Heading", () => {
  it("renders the requested heading element", () => {
    render(<Heading as="h2">Section title</Heading>);

    expect(
      screen.getByRole("heading", { level: 2, name: "Section title" }),
    ).toBeInTheDocument();
  });

  it("applies the default size classes", () => {
    render(<Heading as="h1">Page title</Heading>);

    expect(screen.getByRole("heading", { level: 1 })).toHaveClass(
      "font-semibold",
      "text-2xl",
    );
  });

  it("applies the requested size classes", () => {
    render(
      <Heading as="h3" size="sm">
        Subsection
      </Heading>,
    );

    expect(screen.getByRole("heading", { level: 3 })).toHaveClass("text-lg");
  });

  it("merges caller class names last", () => {
    render(
      <Heading as="h4" className="custom-class">
        Custom
      </Heading>,
    );

    expect(screen.getByRole("heading", { level: 4 })).toHaveClass(
      "custom-class",
    );
  });
});
