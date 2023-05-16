// @ts-check
/**
 * @file Parses the transcription file to a javascript object.
 */
import { readFileSync, writeFileSync } from "node:fs";

/**
 * @typedef {Object} SoundFile
 * @property {string} name - name of the sound file
 * @property {string} text - the transcription of the audio file
 */

/**
 * Parses the transcription - source file - to an array.
 * Removes special text that sould not be read by the text to speech api.
 * @param {string} sourceFile - source transcription file
 * @returns {SoundFile[]} - array with parsed object
 */
export function parseSoundFile(sourceFile) {
  const file = readFileSync(sourceFile, "utf8");
  const lines = file.split("\n");

  return lines.map((line) => {
    let [name, text] = line.split(/:(.*)/); //split only by the first colon
    let specialChars = /\[.*\]|\(.*\)|\<.*\>|\.\.\./g;

    text = text?.replace(specialChars, "");

    return { name, text: text?.trim() };
  });
}

/**
 * Writes the parsed sound file to new json file.
 * @param {string} sourceFile - source transcription file
 * @param {string} targetFile - target json file
 */
export function soundFileToJson(sourceFile, targetFile) {
  const sounds = parseSoundFile(sourceFile);

  writeFileSync(targetFile, JSON.stringify(sounds, null, 2), { flag: "wx" });
}
