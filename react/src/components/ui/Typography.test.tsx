import { describe, expect, it } from "bun:test";

import { Typography } from "./Typography.js";

describe("Typography", () => {
  it("renders a span by default", () => {
    const element = Typography({ children: "Body copy" });

    expect(element.type).toBe("span");
    expect(element.props.children).toBe("Body copy");
    expect(element.props.className).toContain("font-medium");
    expect(element.props.className).toContain("text-sm");
  });

  it("applies variant and size classes", () => {
    const element = Typography({
      children: "Title",
      variant: "title",
      size: "lg",
    });

    expect(element.props.className).toContain("font-semibold");
    expect(element.props.className).toContain("text-3xl");
  });

  it("applies muted styling", () => {
    const element = Typography({
      children: "Hint",
      muted: true,
      variant: "hint",
    });

    expect(element.props.className).toContain("opacity-70");
  });

  it("merges caller class names last", () => {
    const element = Typography({
      children: "Mono",
      variant: "mono",
      className: "custom-class",
    });

    expect(element.props.className).toContain("font-mono");
    expect(element.props.className).toContain("custom-class");
  });
});
