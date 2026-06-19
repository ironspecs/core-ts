/**
 * Verifies submit button rendering for idle, busy, and terminal success states.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SubmitButton } from "./SubmitButton.js";

describe("SubmitButton", () => {
  it("renders idle as enabled button text", () => {
    render(<SubmitButton state="idle">Save</SubmitButton>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button.hasAttribute("disabled")).toBe(false);
    expect(button.getAttribute("aria-busy")).toBe("false");
  });

  it("renders busy as disabled with aria-busy true", () => {
    render(<SubmitButton state="busy">Save</SubmitButton>);
    const button = screen.getByRole("button");
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("true");
  });

  it("renders success as disabled terminal state", () => {
    render(<SubmitButton state="success">Save</SubmitButton>);
    const button = screen.getByRole("button");
    expect(button.hasAttribute("disabled")).toBe(true);
    expect(button.getAttribute("aria-busy")).toBe("false");
  });

  it("accepts async onClick handlers", () => {
    const onClick = vi.fn(async () => undefined);
    render(
      <SubmitButton state="idle" onClick={onClick}>
        Submit
      </SubmitButton>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Submit" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
