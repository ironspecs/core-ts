/**
 * Verifies the shared language switcher against the package language store.
 * The test uses the real store so menu selection and rendered state stay tied.
 */

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import {
  setCurrentLanguage,
  setLanguageChangePreparer,
} from "../lib/language.js";
import { LanguageSwitcher } from "./LanguageSwitcher.js";

describe("LanguageSwitcher", () => {
  afterEach(() => {
    setLanguageChangePreparer(async () => {});
    setCurrentLanguage("en");
  });

  it("renders the current language short label", () => {
    setCurrentLanguage("fr");

    render(<LanguageSwitcher labels={{ selectLanguage: "Select language" }} />);

    expect(screen.getByLabelText("Select language")).toBeInTheDocument();
    expect(screen.getByText("FR")).toBeInTheDocument();
  });

  it("lists supported languages and changes language on selection", async () => {
    render(<LanguageSwitcher labels={{ selectLanguage: "Select language" }} />);

    fireEvent.keyDown(screen.getByLabelText("Select language"), {
      key: "Enter",
    });
    fireEvent.click(await screen.findByText("Français"));

    await waitFor(() => {
      expect(screen.getByText("FR")).toBeInTheDocument();
    });
  });
});
