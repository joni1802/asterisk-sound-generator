// @ts-check
/**
 * @file Rengerates the directory structure for the extra sound files.
 * Unlike the core files the transcription for the extra files does not contain directories for some files.
 * This file generates a json file with the directory structure by using the original extra sound directory provided by Asterisk.
 */
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import inquirer from "inquirer";

/**
 * Gets all folders from the original extra sounds folder.
 * @param {string} sourcePath - path to an original extra sounds folder
 * @returns {Promise<import("fs").Dirent[]>} - folders
 */
async function getFolders(sourcePath) {
  const dir = await readdir(sourcePath, { withFileTypes: true });

  return dir.filter((entry) => entry.isDirectory());
}

/**
 * @typedef {Object} TargetPath
 * @property {string} folderName - name of the folder
 * @property {string} fileName - name of the audio file inside that folder
 */

/**
 * Returns all file names and their associated folder in an array.
 * @param {string} sourcePath - path to an original extra sounds folder
 * @returns {Promise<TargetPath[]>}
 */
async function getTargetPaths(sourcePath) {
  const folders = await getFolders(sourcePath);

  let targetPaths = [];

  for (const { name: folderName } of folders) {
    const files = await readdir(path.join(sourcePath, folderName));

    for (const file of files) {
      const { name: fileName } = path.parse(file);

      targetPaths.push({ folderName, fileName });
    }
  }

  return targetPaths;
}

/**
 * Initiates the command line interface
 * @returns {Promise<void>}
 */
export default async function init() {
  const questions = [
    {
      type: "input",
      name: "sourcePath",
      message:
        "Path of the original Asterisk extra sounds files. (Download here: https://downloads.asterisk.org/pub/telephony/sounds/)",
      default: "/your/path/to/the/original/files",
      async validate(sourcePath) {
        try {
          await readdir(sourcePath);

          return true;
        } catch (err) {
          return err.message;
        }
      },
    },
    {
      type: "input",
      name: "filename",
      message: "Set a filename.",
      default: "extra-sounds-dirs.json",
      validate(filename) {
        const { ext } = path.parse(filename);

        if (ext.toLowerCase() === ".json") {
          return true;
        }

        return "The target file needs to be a JSON file.";
      },
    },
  ];

  const { sourcePath, filename } = await inquirer.prompt(questions);
  const targetPaths = await getTargetPaths(sourcePath);

  await writeFile(filename, JSON.stringify(targetPaths, null, 2), {
    flag: "ax",
  });

  console.log(`➡️ ${path.resolve(filename)} successfully created.`);
}
