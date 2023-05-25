// @ts-check
/**
 * @file Used for building the zip files which are uploaded to Github.
 */
import archiver from "archiver";
import path from "node:path";
import { createWriteStream, readdirSync } from "node:fs";

/**
 * Creates a zip folder with all sound files.
 * It excludes all wav files because FreePBX is only able to transcode wav files in 8000Hz/16000Hz (.wav16).
 * The wav files created by the Google Text-To-Speech API have a sample rate of 24000Hz.
 * For transcoding the SLN16 files are used by FreePBX.
 * @param {string} sourcePath - path of the directory
 * @param {string} targetFile - full path of the zip file
 */
function zipFiles(sourcePath, targetFile) {
  const output = createWriteStream(targetFile);
  const allFiles = readDirRecursive(sourcePath);

  const archive = archiver("zip", {
    zlib: { level: 9 },
  });

  archive.pipe(output);

  for (const file of allFiles) {
    const { ext } = path.parse(file);

    if (ext.toLowerCase() !== ".wav") {
      const sourceFile = path.join(sourcePath, file);

      archive.file(sourceFile, { name: file });

      console.log(`${sourceFile} 📦 ${targetFile}`);
    }
  }

  archive.finalize();
}

/**
 * Reads a directory including all subfolders.
 * @param {string} sourcePath - path to directory
 * @returns {string[]} - full file paths
 */
function readDirRecursive(sourcePath) {
  const dir = readdirSync(sourcePath, { withFileTypes: true });
  const allFiles = [];

  for (const file of dir) {
    if (file.isDirectory()) {
      const subdir = readDirRecursive(path.join(sourcePath, file.name));

      const files = subdir.map((f) => {
        return path.join(file.name, f);
      });

      allFiles.push(...files);
    } else {
      allFiles.push(file.name);
    }
  }

  return allFiles;
}

// const lel = readdirSync(sourcePath, { withFileTypes: true });
// const lel2 = readDirRecursive(sourcePath);

// console.log(lel2);

const sourcePath = path.join("sounds", "test");
const targetFile = path.join("sounds", "test.zip");

await zipFiles(sourcePath, targetFile);
