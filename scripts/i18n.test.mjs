import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vite-plus/test";

function sourceKeys(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return sourceKeys(path);
    if (!/\.tsx?$/.test(path) || path.endsWith(".test.ts")) return [];
    return [...readFileSync(path, "utf8").matchAll(/\bt(?:\.raw)?\(\s*"([^"]+)"/g)].map(
      (match) => match[1],
    );
  });
}

describe("translation coverage", () => {
  const keys = [...new Set(sourceKeys("src"))];
  for (const file of readdirSync("src/i18n").filter((file) => file.endsWith(".json"))) {
    it(`${file} covers every static UI key and map label`, () => {
      const dictionary = JSON.parse(readFileSync(join("src/i18n", file), "utf8"));
      for (const key of keys) {
        const value = key.split(".").reduce((node, part) => node?.[part], dictionary);
        expect(typeof value, `${file}: ${key}`).toBe("string");
        expect(value.trim(), `${file}: ${key}`).not.toBe("");
      }
      for (const name of [
        "North America",
        "South America",
        "Europe",
        "Africa",
        "Asia",
        "Australia",
        "Antarctica",
        "Pacific Ocean",
        "Atlantic Ocean",
        "Indian Ocean",
        "Arctic Ocean",
        "Southern Ocean",
      ])
        expect(dictionary.timezone.mapLabels[name], `${file}: ${name}`).toBeTruthy();
    });
  }
});
