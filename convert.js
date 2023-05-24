// @ts-check
/**
 * @file Converts the audio files from wav to ulaw, alaw and g722 using ffmpeg.
 */
import { exec } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import inquirer from "inquirer";

/**
 * Node wrapper for the ffmpeg cli tool.
 * @param {string} cmd - the raw ffmpeg command
 * @returns {Promise<string>} - output from the ffmpeg binary.
 */
export function ffmpeg(cmd) {
  return new Promise((resolve, reject) => {
    exec(`ffmpeg ${cmd}`, (err, _stdout, stderr) => {
      if (err) {
        reject(err);
      }

      resolve(stderr); // the output from ffmpeg is not stdout.
    });
  });
}

/**
 * A higher level wrapper for using ffmpeg.
 * @param {string} sourceFile - source file
 * @param {string} targetFile - target file
 * @param {string[]} options - ffmpeg options
 * @returns {Promise<string | undefined>}
 */
export async function convertFile(sourceFile, targetFile, options) {
  if (existsSync(targetFile)) {
    console.log(
      `${sourceFile} ➡️ ${targetFile} already exists. Skipped converting.`
    );

    return;
  }

  console.log(`${sourceFile} ➡️ ${targetFile}`);

  return await ffmpeg(`-i ${sourceFile} ${options.join(" ")} ${targetFile}`);
}

/**
 * Converts all files of a directory recursively to the target file format.
 * @param {string} sourcePath - path to the folder with the audio files
 * @param {string} sourceFileExt - the file extension of the files being converted
 * @param {string} targetFileExt - the target extension to convert into
 * @param {string[]} options - ffmpeg options
 */
async function convertAllFiles(
  sourcePath,
  sourceFileExt,
  targetFileExt,
  options
) {
  const dir = readdirSync(sourcePath, { withFileTypes: true });

  for (const file of dir) {
    if (file.isDirectory()) {
      convertAllFiles(
        path.join(sourcePath, file.name),
        sourceFileExt,
        targetFileExt,
        options
      );
    } else {
      const sourceFile = path.join(sourcePath, file.name);
      const { name: sourceFileName, ext: fileExt } = path.parse(file.name);

      const targetFile = path.join(
        sourcePath,
        `${sourceFileName}.${targetFileExt}`
      );

      if (
        fileExt.toLocaleLowerCase() === `.${sourceFileExt}`.toLocaleLowerCase()
      ) {
        await convertFile(sourceFile, targetFile, options);
      }
    }
  }
}

/**
 * Initiates the command line interface
 * @returns {Promise<void>}
 */
export default async function init() {
  const questions = [
    {
      type: "checkbox",
      name: "codecs",
      message: "Choose one or more codecs.",
      choices: [
        {
          name: "G.722",
          value: "g722",
          checked: true,
        },
        {
          name: "G.711 U-Law",
          value: "ulaw",
          checked: true,
        },
        {
          name: "G.711 A-Law",
          value: "alaw",
          checked: true,
        },
        {
          name: "GSM",
          value: "gsm",
          checked: true,
        },
      ],
    },
    {
      type: "checkbox",
      name: "folders",
      message: "Choose the sound folders.",
      choices() {
        return readdirSync("sounds", { withFileTypes: true }).filter((file) =>
          file.isDirectory()
        );
      },
    },
    {
      type: "confirm",
      name: "toBeConverted",
      default: true,
    },
  ];

  const { codecs, folders, toBeConverted } = await inquirer.prompt(questions);

  if (!toBeConverted) {
    return;
  }

  for (const folder of folders) {
    const sourcePath = path.join("sounds", folder);
    const sourceExt = "wav";

    for (const codec of codecs) {
      switch (codec) {
        case "g722":
          await convertAllFiles(sourcePath, sourceExt, "g722", ["-ar 16000"]);
          break;
        case "ulaw":
          await convertAllFiles(sourcePath, sourceExt, "ulaw", [
            "-ar 8000",
            "-codec:a pcm_mulaw",
            "-f mulaw",
          ]);
          break;
        case "alaw":
          await convertAllFiles(sourcePath, sourceExt, "alaw", [
            "-ar 8000",
            "-codec:a pcm_alaw",
            "-f alaw",
          ]);
        case "gsm":
          await convertAllFiles(sourcePath, sourceExt, "gsm", [
            "-ar 8000",
            "-codec:a gsm",
            "-ac 1",
          ]);
      }
    }
  }
}
