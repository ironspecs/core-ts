"use strict";

const { defineRule } = require("../oxlint-plugin-compat.js");

const DEFAULT_MAX_TYPE_DECLARATIONS = 15;

function readMaxTypeDeclarationsSafe(options) {
  const option = Array.isArray(options) && options[0] ? options[0] : {};
  return Number.isInteger(option.max)
    ? option.max
    : DEFAULT_MAX_TYPE_DECLARATIONS;
}

module.exports = defineRule({
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Enforce a maximum number of TypeScript type aliases and interfaces across a lint target.",
      recommended: false,
    },
    schema: [
      {
        type: "object",
        properties: {
          max: {
            type: "integer",
            minimum: 1,
          },
        },
        additionalProperties: false,
      },
    ],
  },
  createOnce(context) {
    let maxTypeDeclarations = DEFAULT_MAX_TYPE_DECLARATIONS;
    let typeDeclarationCount = 0;
    let hasReportedExcess = false;

    function syncMaxTypeDeclarations() {
      maxTypeDeclarations = readMaxTypeDeclarationsSafe(context.options);
    }

    function reportExcessTypeDeclaration(node) {
      typeDeclarationCount += 1;
      if (hasReportedExcess) return;
      if (typeDeclarationCount <= maxTypeDeclarations) return;

      hasReportedExcess = true;
      context.report({
        node,
        message: `This lint target declares more than ${maxTypeDeclarations} type aliases and interfaces. This declaration is number ${typeDeclarationCount}.`,
      });
    }

    return {
      before() {
        syncMaxTypeDeclarations();
      },
      TSTypeAliasDeclaration(node) {
        reportExcessTypeDeclaration(node);
      },
      TSInterfaceDeclaration(node) {
        reportExcessTypeDeclaration(node);
      },
    };
  },
});
