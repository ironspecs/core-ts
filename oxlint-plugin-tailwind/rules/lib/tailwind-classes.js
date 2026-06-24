"use strict";

const { collectStaticClassTextSegmentsSafe } = require("./class-text.js");

const PALETTE_NAMES = new Set([
  "slate",
  "gray",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
]);

const DAISY_COLOR_NAMES = new Set([
  "base-100",
  "base-200",
  "base-300",
  "base-content",
  "primary",
  "primary-content",
  "secondary",
  "secondary-content",
  "accent",
  "accent-content",
  "neutral",
  "neutral-content",
  "info",
  "info-content",
  "success",
  "success-content",
  "warning",
  "warning-content",
  "error",
  "error-content",
]);

const FIXED_BORDER_WIDTH_TOKENS = new Set([
  "border",
  "border-0",
  "border-2",
  "border-4",
  "border-8",
  "border-t",
  "border-r",
  "border-b",
  "border-l",
  "border-x",
  "border-y",
]);

const FIXED_BORDER_RADIUS_TOKENS = new Set([
  "rounded",
  "rounded-sm",
  "rounded-md",
  "rounded-lg",
  "rounded-xl",
  "rounded-2xl",
  "rounded-3xl",
]);

const TEXT_SIZE_TOKENS = new Set([
  "text-xs",
  "text-sm",
  "text-base",
  "text-lg",
  "text-xl",
  "text-2xl",
  "text-3xl",
  "text-4xl",
  "text-5xl",
  "text-6xl",
  "text-7xl",
  "text-8xl",
  "text-9xl",
]);

const COLOR_UTILITY_PREFIXES = new Set([
  "bg",
  "border",
  "caret",
  "decoration",
  "divide",
  "fill",
  "from",
  "outline",
  "placeholder",
  "ring",
  "shadow",
  "stroke",
  "text",
  "to",
  "via",
]);

function isWhitespaceCharacter(character) {
  return (
    character === " " ||
    character === "\n" ||
    character === "\r" ||
    character === "\t" ||
    character === "\f" ||
    character === "\v"
  );
}

function readTopLevelSeparatorIndexes(text, separator) {
  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  const indexes = [];

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];

    if (character === "(") parenDepth += 1;
    if (character === ")" && parenDepth > 0) parenDepth -= 1;
    if (character === "[") bracketDepth += 1;
    if (character === "]" && bracketDepth > 0) bracketDepth -= 1;
    if (character === "{") braceDepth += 1;
    if (character === "}" && braceDepth > 0) braceDepth -= 1;

    if (
      character === separator &&
      parenDepth === 0 &&
      bracketDepth === 0 &&
      braceDepth === 0
    ) {
      indexes.push(index);
    }
  }

  return indexes;
}

function splitTailwindClassText(text) {
  if (typeof text !== "string" || text.trim().length === 0) return [];
  const tokens = [];
  let index = 0;

  while (index < text.length) {
    while (index < text.length && isWhitespaceCharacter(text[index])) {
      index += 1;
    }
    if (index >= text.length) return tokens;

    const tokenStart = index;
    let bracketDepth = 0;
    while (index < text.length) {
      const character = text[index];
      if (character === "[") bracketDepth += 1;
      if (character === "]" && bracketDepth > 0) bracketDepth -= 1;
      if (bracketDepth === 0 && isWhitespaceCharacter(character)) break;
      index += 1;
    }

    const token = text.slice(tokenStart, index);
    if (token.length > 0) tokens.push(token);
  }

  return tokens;
}

function normalizeTailwindClassToken(rawToken) {
  const separatorIndexes = readTopLevelSeparatorIndexes(rawToken, ":");
  const lastSeparatorIndex =
    separatorIndexes.length > 0
      ? separatorIndexes[separatorIndexes.length - 1]
      : -1;
  const variants =
    lastSeparatorIndex >= 0
      ? rawToken
          .slice(0, lastSeparatorIndex)
          .split(":")
          .filter((variant) => variant.length > 0)
      : [];
  const candidate =
    lastSeparatorIndex >= 0 ? rawToken.slice(lastSeparatorIndex + 1) : rawToken;
  const important = candidate.startsWith("!") && candidate.length > 1;
  const core = important ? candidate.slice(1) : candidate;

  return {
    core,
    important,
    raw: rawToken,
    variants,
  };
}

function collectTailwindClassTokensSafe(node) {
  return collectStaticClassTextSegmentsSafe(node).flatMap((textSegment) =>
    splitTailwindClassText(textSegment).map(normalizeTailwindClassToken),
  );
}

function readColorParts(core) {
  const separatorIndexes = readTopLevelSeparatorIndexes(core, "-");
  if (separatorIndexes.length < 1) return null;

  const prefix = core.slice(0, separatorIndexes[0]);
  if (!COLOR_UTILITY_PREFIXES.has(prefix)) return null;

  const colorName = core.slice(separatorIndexes[0] + 1);
  if (colorName.length === 0) return null;

  return {
    colorName,
    prefix,
  };
}

function isPaletteColorName(colorName) {
  const separatorIndexes = readTopLevelSeparatorIndexes(colorName, "-");
  if (separatorIndexes.length < 1) return false;

  const paletteName = colorName.slice(0, separatorIndexes[0]);
  const shade = colorName.slice(separatorIndexes[0] + 1);

  return PALETTE_NAMES.has(paletteName) && /^\d{2,3}$/.test(shade);
}

function hasColorPrefix(classToken, prefix) {
  const parts = readColorParts(classToken.core);
  if (!parts || parts.prefix !== prefix) return false;
  return isPaletteColorName(parts.colorName);
}

function isImportantClass(classToken) {
  return classToken.important;
}

function isFixedBorderWidthClass(classToken) {
  return FIXED_BORDER_WIDTH_TOKENS.has(classToken.core);
}

function isFixedBorderRadiusClass(classToken) {
  return FIXED_BORDER_RADIUS_TOKENS.has(classToken.core);
}

function isBorderRadiusClass(classToken) {
  return (
    classToken.core === "rounded" || classToken.core.startsWith("rounded-")
  );
}

function isBorderColorClass(classToken) {
  return hasColorPrefix(classToken, "border");
}

function isBackgroundColorClass(classToken) {
  return hasColorPrefix(classToken, "bg");
}

function isTextColorClass(classToken) {
  return hasColorPrefix(classToken, "text");
}

function isTextSizeClass(classToken) {
  return (
    TEXT_SIZE_TOKENS.has(classToken.core) ||
    classToken.core.startsWith("text-[") ||
    classToken.core.startsWith("text-(")
  );
}

function isDaisyColorClass(classToken) {
  const parts = readColorParts(classToken.core);
  if (!parts) return false;
  return DAISY_COLOR_NAMES.has(parts.colorName);
}

const tailwindClassGroups = {
  backgroundColor: isBackgroundColorClass,
  borderColor: isBorderColorClass,
  borderRadius: isBorderRadiusClass,
  daisyColor: isDaisyColorClass,
  fixedBorderRadius: isFixedBorderRadiusClass,
  fixedBorderWidth: isFixedBorderWidthClass,
  important: isImportantClass,
  textColor: isTextColorClass,
  textSize: isTextSizeClass,
};

module.exports = {
  collectTailwindClassTokensSafe,
  normalizeTailwindClassToken,
  splitTailwindClassText,
  tailwindClassGroups,
};
