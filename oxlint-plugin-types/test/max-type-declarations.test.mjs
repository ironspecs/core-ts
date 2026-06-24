import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const packageRoot = path.resolve(currentDirPath, "..");
const repoRoot = path.resolve(packageRoot, "..");
const oxlintBinary = path.join(
  repoRoot,
  "node_modules",
  ".bin",
  process.platform === "win32" ? "oxlint.cmd" : "oxlint",
);

function writeRuleConfig(tmpPath, max) {
  writeFileSync(
    path.join(tmpPath, "plugin.cjs"),
    `module.exports = require(${JSON.stringify(packageRoot)});\n`,
  );

  const configPath = path.join(tmpPath, "oxlint.json");
  writeFileSync(
    configPath,
    JSON.stringify(
      {
        jsPlugins: [
          {
            name: "types",
            specifier: "./plugin.cjs",
          },
        ],
        rules: {
          "types/max-type-declarations": ["error", { max }],
        },
      },
      null,
      2,
    ),
  );
  return configPath;
}

function runRuleOnSnippet(args) {
  const { code, max } = args;
  const tmpPath = mkdtempSync(path.join(tmpdir(), "max-type-declarations-"));

  try {
    const configPath = writeRuleConfig(tmpPath, max);
    const filePath = path.join(tmpPath, "fixture.ts");
    writeFileSync(filePath, code);

    const result = spawnSync(
      oxlintBinary,
      ["--import-plugin", "-c", configPath, filePath],
      {
        cwd: repoRoot,
        encoding: "utf8",
      },
    );

    return {
      output: `${result.stdout}${result.stderr}${result.error?.message ?? ""}`,
      status: result.status ?? 0,
    };
  } finally {
    rmSync(tmpPath, { force: true, recursive: true });
  }
}

describe("types/max-type-declarations", () => {
  it("allows declarations up to the configured maximum", () => {
    const result = runRuleOnSnippet({
      code: `
        type First = string;
        interface Second {
          value: string;
        }
      `,
      max: 2,
    });

    expect(result.status).toBe(0);
  });

  it("fails when declarations exceed the configured maximum", () => {
    const result = runRuleOnSnippet({
      code: `
        type First = string;
        interface Second {
          value: string;
        }
      `,
      max: 1,
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain(
      "This lint target declares more than 1 type aliases and interfaces.",
    );
  });
});
