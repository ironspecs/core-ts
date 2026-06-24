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

function writeRuleConfig(tmpPath, policies) {
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
            name: "tailwind",
            specifier: "./plugin.cjs",
          },
        ],
        rules: {
          "tailwind/classes": ["error", policies],
        },
      },
      null,
      2,
    ),
  );
  return configPath;
}

function runRuleOnSnippet(args) {
  const { code, policies } = args;
  return runRuleOnFiles({
    files: {
      "fixture.tsx": code,
    },
    policies,
  });
}

function runRuleOnFiles(args) {
  const { files, policies } = args;
  const tmpPath = mkdtempSync(path.join(tmpdir(), "tailwind-classes-"));

  try {
    const configPath = writeRuleConfig(tmpPath, policies);
    const filePaths = Object.entries(files).map(([relativePath, code]) => {
      const filePath = path.join(tmpPath, relativePath);
      writeFileSync(filePath, code);
      return filePath;
    });

    const result = spawnSync(
      oxlintBinary,
      ["--import-plugin", "-c", configPath, ...filePaths],
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

describe("tailwind/classes", () => {
  it("flags important classes through normalized variant tokens", () => {
    const result = runRuleOnSnippet({
      code: `
        export function Demo() {
          return <div className="hover:!bg-base-100" />;
        }
      `,
      policies: {
        important: "error",
      },
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain(
      'Tailwind class "hover:!bg-base-100" is forbidden by important.',
    );
  });

  it("preserves fixed border width and fixed radius hard bans", () => {
    const result = runRuleOnSnippet({
      code: `
        export function Demo() {
          return <div className="border rounded-lg" />;
        }
      `,
      policies: {
        fixedBorderRadius: "error",
        fixedBorderWidth: "error",
      },
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain(
      'Tailwind class "border" is forbidden by fixedBorderWidth.',
    );
    expect(result.output).toContain(
      'Tailwind class "rounded-lg" is forbidden by fixedBorderRadius.',
    );
  });

  it("counts max policies across files", () => {
    const result = runRuleOnFiles({
      files: {
        "first.tsx": `
          export function First() {
            return <div className="bg-red-500" />;
          }
        `,
        "second.tsx": `
          export function Second() {
            return <div className="bg-blue-500" />;
          }
        `,
      },
      policies: {
        backgroundColor: { max: 1 },
      },
    });

    expect(result.status).toBe(1);
    expect(result.output).toContain(
      "Tailwind class group backgroundColor allows 1 matches but has at least 2.",
    );
  });
});
