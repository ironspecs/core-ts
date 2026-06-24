import { describe, expect, it } from "vitest";

import rule from "../rules/classes.js";

function createRuleHarness(policies) {
  const reports = [];
  const context = {
    options: [policies],
    report(report) {
      reports.push(report);
    },
  };
  const visitors = rule.createOnce(context);
  visitors.before();
  visitors.Program({ type: "Program" });
  return {
    reports,
    visitors,
  };
}

function createClassNameAttribute(className) {
  return {
    type: "JSXAttribute",
    name: {
      type: "JSXIdentifier",
      name: "className",
    },
    value: {
      type: "Literal",
      value: className,
    },
  };
}

describe("tailwind/classes", () => {
  it("flags important classes through normalized variant tokens", () => {
    const { reports, visitors } = createRuleHarness({
      important: "error",
    });

    visitors.JSXAttribute(createClassNameAttribute("hover:!bg-base-100"));

    expect(reports.map((report) => report.message)).toContain(
      'Tailwind class "hover:!bg-base-100" is forbidden by important.',
    );
  });

  it("preserves fixed border width and fixed radius hard bans", () => {
    const { reports, visitors } = createRuleHarness({
      fixedBorderRadius: "error",
      fixedBorderWidth: "error",
    });

    visitors.JSXAttribute(createClassNameAttribute("border rounded-lg"));

    expect(reports.map((report) => report.message)).toEqual(
      expect.arrayContaining([
        'Tailwind class "border" is forbidden by fixedBorderWidth.',
        'Tailwind class "rounded-lg" is forbidden by fixedBorderRadius.',
      ]),
    );
  });

  it("counts max policies across files", () => {
    const { reports, visitors } = createRuleHarness({
      backgroundColor: { max: 1 },
    });

    visitors.JSXAttribute(createClassNameAttribute("bg-red-500"));
    visitors.JSXAttribute(createClassNameAttribute("bg-blue-500"));

    expect(reports.map((report) => report.message)).toContain(
      'Tailwind class group backgroundColor allows 1 matches but has at least 2. Latest match: "bg-blue-500".',
    );
  });

  it("counts text size utilities through the textSize policy", () => {
    const { reports, visitors } = createRuleHarness({
      textSize: { max: 1 },
    });

    visitors.JSXAttribute(createClassNameAttribute("text-sm"));
    visitors.JSXAttribute(createClassNameAttribute("md:text-4xl"));

    expect(reports.map((report) => report.message)).toContain(
      'Tailwind class group textSize allows 1 matches but has at least 2. Latest match: "md:text-4xl".',
    );
  });
});
