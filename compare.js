// @ts-check
/**
 * @file This file was used to get the transcription of all missing audio files which are currently not in the official transcripts provided by Asterisk.
 */
import { open, readdir, copyFile, mkdir, constants } from "node:fs/promises";
import path from "node:path";
import { convertFile } from "./convert.js";
import { googleSpeech } from "./node-stt.js";
import { existsSync } from "node:fs";

/**
 * @typedef {Object} SoundFile
 * @property {string} name - name of the file
 * @property {string} path - file path
 * @property {string[]} ext - file extensions
 */

/**
 * Reads all files inside a directory recursively and returns an array with all files and its extensions.
 * @param {string} sourcePath - path of the directory
 * @param {SoundFile[]} files - files (for recursion)
 * @returns {Promise<SoundFile[]>}
 */
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

/**
 * Compares two file arrays and returns difference.
 * @param {SoundFile[]} a - sound files a
 * @param {SoundFile[]} b - sound files b
 * @returns {SoundFile[]} - sound files which are not in a
 */
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

/**
 * Copies the sound files into a target directory.
 * The WAV file takes precendes. So if the file exists in WAV and SLN format only WAV will be copied.
 * @param {SoundFile[]} files - sound files
 * @param {string} targetDir - target directory the files will be copied to
 */
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

/**
 * Transcripts audio files.
 * @param {string} sourcePath - source directory of the files
 * @param {*} targetFile - the path of the new transcript
 */
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

/**
 * Compares the core and extra sound files provided by Asterisk with the sound files in FreePBX.
 * Creates a transcript of the missing files.
 * @returns {Promise<void>}
 */
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
