import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MarkdownBlock } from "./MarkdownBlock.js";

describe("MarkdownBlock", () => {
  it("returns null for empty markdown", () => {
    const { container } = render(<MarkdownBlock markdown="" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("applies className and renders formatted content", () => {
    render(
      <MarkdownBlock
        className="test-wrapper"
        markdown={"Hello **World**\n\n- One"}
      />,
    );

    expect(screen.getByText("World").tagName).toBe("STRONG");
    expect(screen.getByText("One")).toBeInTheDocument();
    expect(document.querySelector(".test-wrapper")).not.toBeNull();
  });

  it("renders external links with safe attrs", () => {
    render(<MarkdownBlock markdown="[Docs](https://docs.example.com)" />);

    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute(
      "href",
      "https://docs.example.com",
    );
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute(
      "target",
      "_blank",
    );
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute(
      "rel",
      "noreferrer",
    );
  });

  it("renders inline and fenced code", () => {
    render(
      <MarkdownBlock
        markdown={"Use `bun test`.\n\n```ts\nconst ok = true;\n```"}
      />,
    );

    expect(screen.getByText("bun test")).toHaveClass("rounded-field", "px-1");
    expect(screen.getByText("const ok = true;")).toHaveClass("language-ts");
    expect(screen.getByText("const ok = true;").closest("pre")).toHaveClass(
      "rounded-box",
      "overflow-auto",
      "p-3",
    );
  });
});
