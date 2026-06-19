import { describe, expect, it } from "bun:test";

import { Heading } from "./Heading.js";

describe("Heading", () => {
  it("renders the requested heading element", () => {
    const element = Heading({ as: "h2", children: "Section title" });

    expect(element.type).toBe("h2");
    expect(element.props.children).toBe("Section title");
  });

  it("applies the default size classes", () => {
    const element = Heading({ as: "h1", children: "Page title" });

    expect(element.props.className).toContain("font-semibold");
    expect(element.props.className).toContain("text-2xl");
  });

  it("applies the requested size classes", () => {
    const element = Heading({
      as: "h3",
      children: "Subsection",
      size: "sm",
    });

    expect(element.props.className).toContain("text-lg");
  });

  it("merges caller class names last", () => {
    const element = Heading({
      as: "h4",
      children: "Custom",
      className: "custom-class",
    });

    expect(element.props.className).toContain("custom-class");
  });
});
