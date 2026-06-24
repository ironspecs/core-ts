import { describe, expect, it } from "vitest";

import rule from "../rules/max-type-declarations.js";

function createRuleHarness(options) {
  const reports = [];
  const context = {
    options: [options],
    report(report) {
      reports.push(report);
    },
  };
  const visitors = rule.createOnce(context);
  visitors.before();
  return {
    reports,
    visitors,
  };
}

describe("types/max-type-declarations", () => {
  it("allows declarations up to the configured maximum", () => {
    const { reports, visitors } = createRuleHarness({ max: 2 });

    visitors.TSTypeAliasDeclaration({ type: "TSTypeAliasDeclaration" });
    visitors.TSInterfaceDeclaration({ type: "TSInterfaceDeclaration" });

    expect(reports).toHaveLength(0);
  });

  it("fails when declarations exceed the configured maximum", () => {
    const { reports, visitors } = createRuleHarness({ max: 1 });

    visitors.TSTypeAliasDeclaration({ type: "TSTypeAliasDeclaration" });
    visitors.TSInterfaceDeclaration({ type: "TSInterfaceDeclaration" });

    expect(reports).toHaveLength(1);
    expect(reports[0].message).toContain(
      "This lint target declares more than 1 type aliases and interfaces.",
    );
  });
});
