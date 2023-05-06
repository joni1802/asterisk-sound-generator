import { readFileSync, writeFileSync } from "node:fs";

export function parseSoundFile(sourceFile) {
  const file = readFileSync(sourceFile, "utf8");
  const lines = file.split("\n");

  return lines.map((line) => {
    let [name, text] = line.split(":");
    let specialChars = /\[.*\]|\(.*\)|\<.*\>|\.\.\./g;

    text = text?.replace(specialChars, "");

    return { name, text: text?.trim() };
  });
}

export function soundFileToJson(sourceFile, targetFile) {
  const sounds = parseSoundFile(sourceFile);

  writeFileSync(targetFile, JSON.stringify(sounds, null, 2), { flag: "wx" });
}
