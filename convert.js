import { exec } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

function ffmpeg(cmd) {
  return new Promise((resolve, reject) => {
    exec(`ffmpeg ${cmd}`, (err, _stdout, stderr) => {
      if (err) {
        reject(err);
      }

      resolve(stderr);
    });
  });
}

async function convertFile(sourceFile, targetFile, options) {
  if (existsSync(targetFile)) {
    console.log(
      `${sourceFile} ➡️ ${targetFile} already exists. Skipped converting.`
    );

    return;
  }

  console.log(`${sourceFile} ➡️ ${targetFile}`);

  return await ffmpeg(`-i ${sourceFile} ${options.join(" ")} ${targetFile}`);
}

async function convertAllFiles(sourcePath, targetFileExt, options) {
  const dir = readdirSync(sourcePath, { withFileTypes: true });

  for (const file of dir) {
    if (file.isDirectory()) {
      convertAllFiles(path.join(sourcePath, file.name), targetFileExt, options);
    } else {
      const sourceFile = path.join(sourcePath, file.name);
      const { name: sourceFileName } = path.parse(file.name);

      const targetFile = path.join(
        sourcePath,
        `${sourceFileName}.${targetFileExt}`
      );

      await convertFile(sourceFile, targetFile, options);
    }
  }
}

convertAllFiles(".\\tests", "g722", ["-ar 16000"]);
