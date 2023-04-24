import { readFileSync, writeFileSync } from "node:fs";

function init() {
  const coreSoundsEn = "core-sounds-en.txt";
  const extraSoundsEn = "extra-sounds-en.txt";

  parseSoundFile(coreSoundsEn, "core-sounds-en.json");
  parseSoundFile(extraSoundsEn, "extra-sounds-en.json");
}

function parseSoundFile(filePath, output) {
  const file = readFileSync(filePath, "utf8");
  const lines = file.split("\n");

  const list = lines.map((line) => {
    let [name, text] = line.split(":");
    let specialChars = /\[.*\]|\(.*\)|\<.*\>/;

    text = text?.replace(specialChars, "");

    return { name, text: text?.trim() };
  });

  writeFileSync(output, JSON.stringify(list, null, 2), { flag: "wx" });
}

function test() {
  return [
    "Hey",
    "activated: Activated.",
    "added: Added.",
    "an-error-has-occured: An error has occurred. (Symlink to 'an-error-has-occurred')",
    "beep: [this is a simple beep tone]",
    "confbridge-leave: <beep decending>",
  ];
}

init();
