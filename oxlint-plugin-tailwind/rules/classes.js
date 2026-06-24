"use strict";

const { defineRule } = require("../oxlint-plugin-compat.js");
const {
  collectTailwindClassTokensSafe,
  tailwindClassGroups,
} = require("./lib/tailwind-classes.js");
const {
  isTargetClassFunctionCallSafe,
  readAttributeNameSafe,
} = require("./lib/class-text.js");

function isPolicyError(policy) {
  return policy === "error";
}

function isCountPolicy(policy) {
  return (
    policy &&
    typeof policy === "object" &&
    Number.isInteger(policy.max) &&
    policy.max >= 0
  );
}

function readConfiguredPoliciesSafe(options) {
  const option = Array.isArray(options) && options[0] ? options[0] : {};
  const policies = new Map();
  const invalidGroupNames = [];
  const invalidPolicyNames = [];

  for (const [groupName, policy] of Object.entries(option)) {
    if (!Object.hasOwn(tailwindClassGroups, groupName)) {
      invalidGroupNames.push(groupName);
      continue;
    }

    if (!isPolicyError(policy) && !isCountPolicy(policy)) {
      invalidPolicyNames.push(groupName);
      continue;
    }

    policies.set(groupName, policy);
  }

  return {
    invalidGroupNames,
    invalidPolicyNames,
    policies,
  };
}

function buildConfigViolationMessages(config) {
  const messages = [];

  if (config.invalidGroupNames.length > 0) {
    messages.push(
      `Unknown Tailwind class policy group(s): ${config.invalidGroupNames.join(
        ", ",
      )}.`,
    );
  }

  if (config.invalidPolicyNames.length > 0) {
    messages.push(
      `Invalid Tailwind class policy for group(s): ${config.invalidPolicyNames.join(
        ", ",
      )}. Use "error" or { "max": number }.`,
    );
  }

  return messages;
}

function readMatchingPolicyEntries(config, classToken) {
  const matchingPolicies = [];

  for (const [groupName, policy] of config.policies) {
    const matcher = tailwindClassGroups[groupName];
    if (!matcher(classToken)) continue;

    matchingPolicies.push({
      groupName,
      policy,
    });
  }

  return matchingPolicies;
}

module.exports = defineRule({
  meta: {
    type: "problem",
    docs: {
      description:
        "Apply code-owned Tailwind class policies as hard bans or count ratchets.",
      recommended: false,
    },
    schema: [
      {
        additionalProperties: {
          oneOf: [
            {
              enum: ["error"],
            },
            {
              additionalProperties: false,
              properties: {
                max: {
                  minimum: 0,
                  type: "integer",
                },
              },
              required: ["max"],
              type: "object",
            },
          ],
        },
        type: "object",
      },
    ],
  },
  createOnce(context) {
    let config = readConfiguredPoliciesSafe(context.options);
    let hasReportedConfigViolation = false;
    let counts = new Map();

    function syncConfig() {
      config = readConfiguredPoliciesSafe(context.options);
    }

    function reportConfigViolations(node) {
      if (hasReportedConfigViolation) return;

      const messages = buildConfigViolationMessages(config);
      if (messages.length === 0) return;

      hasReportedConfigViolation = true;
      for (const message of messages) {
        context.report({
          message,
          node,
        });
      }
    }

    function reportErrorPolicy(node, classToken, groupName) {
      context.report({
        message: `Tailwind class "${classToken.raw}" is forbidden by ${groupName}.`,
        node,
      });
    }

    function reportCountPolicy(node, classToken, groupName, policy) {
      const nextCount = (counts.get(groupName) ?? 0) + 1;
      counts.set(groupName, nextCount);

      if (nextCount <= policy.max) return;

      context.report({
        message: `Tailwind class group ${groupName} allows ${policy.max} matches but has at least ${nextCount}. Latest match: "${classToken.raw}".`,
        node,
      });
    }

    function inspectClassTokens(node) {
      for (const classToken of collectTailwindClassTokensSafe(node)) {
        for (const entry of readMatchingPolicyEntries(config, classToken)) {
          if (isPolicyError(entry.policy)) {
            reportErrorPolicy(node, classToken, entry.groupName);
            continue;
          }

          reportCountPolicy(node, classToken, entry.groupName, entry.policy);
        }
      }
    }

    return {
      before() {
        syncConfig();
      },
      Program(node) {
        reportConfigViolations(node);
      },
      JSXAttribute(node) {
        const attributeName = readAttributeNameSafe(node);
        if (attributeName !== "className" && attributeName !== "class") return;

        inspectClassTokens(node.value);
      },
      CallExpression(node) {
        if (!isTargetClassFunctionCallSafe(node)) return;

        inspectClassTokens(node);
      },
    };
  },
});
