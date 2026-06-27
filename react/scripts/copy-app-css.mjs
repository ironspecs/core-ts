import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectoryPath = dirname(fileURLToPath(import.meta.url));
const packageDirectoryPath = resolve(scriptDirectoryPath, "..");
const sourcePath = resolve(packageDirectoryPath, "src/styles/app.css");
const destinationPath = resolve(packageDirectoryPath, "dist/app.css");

await mkdir(dirname(destinationPath), { recursive: true });
await copyFile(sourcePath, destinationPath);
