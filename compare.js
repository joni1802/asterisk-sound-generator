import { open, readdir, copyFile, mkdir, constants } from "node:fs/promises";
import path from "node:path";
import { convertFile } from "./convert.js";
import { googleSpeech } from "./node-stt.js";
import { existsSync } from "node:fs";

async function getSoundFiles(sourcePath, files = []) {
  const dir = await readdir(sourcePath, { withFileTypes: true });

  for (const file of dir) {
    if (file.isDirectory()) {
      await getSoundFiles(path.join(sourcePath, file.name), files);
    } else {
      const { name, ext } = path.parse(file.name);
      const index = files.findIndex((f) => f.name === name);

      if (index !== -1) {
        files[index].ext.push(ext);
      } else {
        files.push({ name, ext: [ext], path: sourcePath });
      }
    }
  }

  return files;
}

function getFileDifference(a, b) {
  return a.filter((file) => {
    const index = b.findIndex((f) => f.name === file.name);

    if (index === -1) {
      return true;
    } else {
      return false;
    }
  });
}

async function copySoundFiles(files, targetDir) {
  await mkdir(targetDir, { recursive: true });

  for (const file of files) {
    if (file.ext.includes(".wav")) {
      const fileBase = `${file.name}.wav`;
      const sourceFile = path.join(file.path, fileBase);
      const targetFile = path.join(targetDir, fileBase);

      if (existsSync(targetFile)) {
        console.log(
          `${sourceFile} ➡️ ${targetFile} already exists. Skipped copying.`
        );
      } else {
        console.log(`${sourceFile} ➡️ ${targetFile}`);

        await copyFile(sourceFile, targetFile, constants.COPYFILE_EXCL);
      }

      continue;
    }

    if (file.ext.includes(".sln")) {
      const fileBase = `${file.name}.sln`;
      const newFileBase = `${file.name}.wav`;
      const sourceFile = path.join(file.path, fileBase);
      const targetFile = path.join(targetDir, newFileBase);

      await convertFile(sourceFile, targetFile, []);
    }
  }
}

async function transcriptFiles(sourcePath, targetFile) {
  const dir = await readdir(sourcePath);
  const target = await open(targetFile, "ax");

  for (const file of dir) {
    const { name, transcription } = await googleSpeech(
      path.join(sourcePath, file),
      "en-US"
    );

    console.log(`${name}: ${transcription}`);

    await target.writeFile(`${name}: ${transcription}\n`);
  }

  target.close();
}

async function init() {
  const freepbxSounds = await getSoundFiles("E:\\Coding\\freepbx-sounds\\en");
  const asteriskCoreSounds = await getSoundFiles("E:\\Coding\\asterisk-core");
  const asteriskExtraSounds = await getSoundFiles(
    "E:\\Coding\\asterisk-extra-sounds-en-g722"
  );

  const difference = getFileDifference(freepbxSounds, [
    ...asteriskCoreSounds,
    ...asteriskExtraSounds,
  ]);

  await copySoundFiles(difference, "temp");

  transcriptFiles("temp", "transcriptions\\freepbx-sounds-en.txt");
}
