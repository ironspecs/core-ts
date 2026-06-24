"use strict";

const { definePlugin } = require("./oxlint-plugin-compat.js");
const maxTypeDeclarations = require("./rules/max-type-declarations.js");

module.exports = definePlugin({
  meta: {
    name: "types",
  },
  rules: {
    "max-type-aliases": maxTypeDeclarations,
    "max-type-declarations": maxTypeDeclarations,
  },
});
