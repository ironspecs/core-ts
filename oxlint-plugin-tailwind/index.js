"use strict";

const { definePlugin } = require("./oxlint-plugin-compat.js");
const classes = require("./rules/classes.js");

module.exports = definePlugin({
  meta: {
    name: "tailwind",
  },
  rules: {
    classes,
  },
});
