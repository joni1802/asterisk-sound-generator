import { readFile, readdir, writeFile, open } from "node:fs/promises";
import path from "node:path";

async function getSoundFiles(sourcePath, files = []) {
  const dir = await readdir(sourcePath, { withFileTypes: true });

  for (const file of dir) {
    if (file.isDirectory()) {
      await getSoundFiles(path.join(sourcePath, file.name), files);
    } else {
      const { name } = path.parse(file.name);

      if (!files.includes(name)) {
        files.push(name);
      }
    }
  }

  return files;
}

const freepbx = await getSoundFiles("E:\\Coding\\freepbx-sounds\\en");

const asteriskExtra = await getSoundFiles(
  "E:\\Coding\\asterisk-extra-sounds-en-g722"
);
const asteriskCore = await getSoundFiles("E:\\Coding\\asterisk-core");

const combinedSounds = [...asteriskCore, ...asteriskExtra];

const difference = freepbx.filter((file) => !combinedSounds.includes(file));

console.log(difference);
