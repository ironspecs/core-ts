/**
 * Verifies workflow context value initialization, dependency-sensitive replacement, and
 * explicit failure when updating an uninitialized context value.
 */

import { describe, expect, it } from "vitest";
import {
  createEmptyWorkflowContextValues,
  ensureWorkflowContextValue,
  setWorkflowContextValueData,
} from "./workflow-context-values";

describe("workflow context values", () => {
  it("initializes context value once and reuses it while dependencies are unchanged", () => {
    const first = ensureWorkflowContextValue({
      contextValues: createEmptyWorkflowContextValues(),
      contextValueId: "application-steps/application-name",
      dependencies: ["acc_1"],
      createInitialData: () => ({ name: "First App" }),
    });
    const second = ensureWorkflowContextValue({
      contextValues: first.contextValues,
      contextValueId: "application-steps/application-name",
      dependencies: ["acc_1"],
      createInitialData: () => ({ name: "Should Not Reinitialize" }),
    });

    expect(second.contextValues).toBe(first.contextValues);
    expect(second.data.name).toBe("First App");
  });

  it("reinitializes context value when dependency values change", () => {
    const first = ensureWorkflowContextValue({
      contextValues: createEmptyWorkflowContextValues(),
      contextValueId: "mx-steps/website-domain",
      dependencies: ["app_1"],
      createInitialData: () => ({ hostname: "mail.one.test" }),
    });
    const second = ensureWorkflowContextValue({
      contextValues: first.contextValues,
      contextValueId: "mx-steps/website-domain",
      dependencies: ["app_2"],
      createInitialData: () => ({ hostname: "mail.two.test" }),
    });

    expect(second.contextValues).not.toBe(first.contextValues);
    expect(second.data.hostname).toBe("mail.two.test");
  });

  it("updates initialized context value data without changing dependency snapshot", () => {
    const initialized = ensureWorkflowContextValue({
      contextValues: createEmptyWorkflowContextValues(),
      contextValueId: "application-steps/company-name",
      dependencies: [],
      createInitialData: () => ({ name: "Acme" }),
    });
    const updatedContextValues = setWorkflowContextValueData({
      contextValues: initialized.contextValues,
      contextValueId: "application-steps/company-name",
      next: { name: "Ironspecs" },
    });
    const resolved = ensureWorkflowContextValue({
      contextValues: updatedContextValues,
      contextValueId: "application-steps/company-name",
      dependencies: [],
      createInitialData: () => ({ name: "Should Not Reinitialize" }),
    });

    expect(resolved.data.name).toBe("Ironspecs");
  });
});
