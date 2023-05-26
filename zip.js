// @ts-check
/**
 * @file Used for building the zip files which are uploaded to Github.
 */
import archiver from "archiver";
import path from "node:path";
import {
  createWriteStream,
  readdirSync,
  existsSync,
  readFileSync,
} from "node:fs";
import inquirer from "inquirer";

/**
 * Creates a zip folder with all sound files.
 * It excludes all wav files because FreePBX is only able to transcode wav files in 8000Hz/16000Hz (.wav16).
 * The wav files created by the Google Text-To-Speech API have a sample rate of 24000Hz.
 * For transcoding the SLN16 files are used by FreePBX.
 * @param {string} sourcePath - path of the directory
 * @param {string} targetFile - full path of the zip file
 * @returns {Promise<void>} - stream close
 */
function zipFiles(sourcePath, targetFile) {
  return new Promise((resolve, reject) => {
    if (existsSync(targetFile)) {
      console.log(`${targetFile} already exists. Skipped.`);

      resolve();
    } else {
      const output = createWriteStream(targetFile);
      const allFiles = readDirRecursive(sourcePath);

      const archive = archiver("zip", {
        zlib: { level: 9 },
      });

      output.on("close", resolve);

      archive.on("error", reject);

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
  });
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

/**
 * Combines the folder name and version number to a zip filename.
 * @param {string} folderName - the name of the folder to zip
 * @returns {string} - zip file name
 */
function getZipFilename(folderName) {
  const packageJson = readFileSync("package.json", { encoding: "utf8" });

  const { version } = JSON.parse(packageJson);

  return `${folderName}-v${version}.zip`;
}

/**
 * Initiates the command line user interface.
 */
export default async function init() {
  const soundDir = "sounds";

  const questions = [
    {
      type: "checkbox",
      name: "folders",
      message: "Select the folder(s) to zip.",
      choices() {
        return readdirSync(soundDir, { withFileTypes: true })
          .filter((file) => file.isDirectory())
          .map((folder) => folder.name);
      },
    },
    {
      type: "confirm",
      name: "toBeZipped",
      message: "Start zipping files?",
      default: true,
    },
  ];

  const { folders, toBeZipped } = await inquirer.prompt(questions);

  if (toBeZipped) {
    for (const folder of folders) {
      const sourcePath = path.join(soundDir, folder);
      const targetFile = path.join(soundDir, getZipFilename(folder));

      await zipFiles(sourcePath, targetFile);
    }
  }
}
