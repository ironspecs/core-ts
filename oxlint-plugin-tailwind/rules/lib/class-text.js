"use strict";

function readAttributeNameSafe(node) {
  if (!node || node.type !== "JSXAttribute") return null;
  const nameNode = node.name;
  return nameNode?.type === "JSXIdentifier" ? nameNode.name : null;
}

function readLiteralTextSafe(node) {
  if (!node || node.type !== "Literal") return null;
  return typeof node.value === "string" ? node.value : null;
}

function readTemplateTextSegmentsSafe(node) {
  if (!node || node.type !== "TemplateLiteral") return [];
  return node.quasis
    .map((quasiNode) => quasiNode.value?.cooked ?? quasiNode.value?.raw ?? "")
    .filter((text) => typeof text === "string" && text.length > 0);
}

function isTargetClassFunctionCallSafe(node) {
  if (!node || node.type !== "CallExpression") return false;
  const callee = node.callee;
  return (
    callee?.type === "Identifier" &&
    (callee.name === "cn" || callee.name === "cva" || callee.name === "clsx")
  );
}

function readPropertyKeyTextSafe(node) {
  if (!node || node.type !== "Property" || node.computed) return [];
  const keyNode = node.key;
  if (keyNode?.type === "Literal" && typeof keyNode.value === "string") {
    return [keyNode.value];
  }
  if (keyNode?.type === "TemplateLiteral") {
    return readTemplateTextSegmentsSafe(keyNode);
  }
  return [];
}

function collectArrayElementTextSafe(nodes) {
  return nodes.flatMap((node) => collectStaticClassTextSegmentsSafe(node));
}

function collectObjectPropertyTextSafe(node) {
  if (!node || node.type !== "Property") return [];
  return [
    ...readPropertyKeyTextSafe(node),
    ...collectStaticClassTextSegmentsSafe(node.value),
  ];
}

function collectStaticClassTextSegmentsSafe(node) {
  if (!node) return [];

  const literalText = readLiteralTextSafe(node);
  if (literalText !== null) return [literalText];

  if (node.type === "JSXExpressionContainer") {
    return collectStaticClassTextSegmentsSafe(node.expression);
  }

  if (node.type === "TemplateLiteral") {
    return readTemplateTextSegmentsSafe(node);
  }

  if (node.type === "ArrayExpression") {
    return collectArrayElementTextSafe(node.elements.filter(Boolean));
  }

  if (node.type === "ConditionalExpression") {
    return [
      ...collectStaticClassTextSegmentsSafe(node.consequent),
      ...collectStaticClassTextSegmentsSafe(node.alternate),
    ];
  }

  if (node.type === "LogicalExpression") {
    return [
      ...collectStaticClassTextSegmentsSafe(node.left),
      ...collectStaticClassTextSegmentsSafe(node.right),
    ];
  }

  if (node.type === "ParenthesizedExpression") {
    return collectStaticClassTextSegmentsSafe(node.expression);
  }

  if (node.type === "ObjectExpression") {
    return node.properties.flatMap((propertyNode) =>
      collectObjectPropertyTextSafe(propertyNode),
    );
  }

  if (node.type === "CallExpression" && isTargetClassFunctionCallSafe(node)) {
    return collectArrayElementTextSafe(node.arguments);
  }

  return [];
}

module.exports = {
  collectStaticClassTextSegmentsSafe,
  isTargetClassFunctionCallSafe,
  readAttributeNameSafe,
};
