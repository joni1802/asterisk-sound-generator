import { readdir, rename, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import inquirer from "inquirer";

async function getFolders(sourcePath) {
  const dir = await readdir(sourcePath, { withFileTypes: true });

  return dir.filter((entry) => entry.isDirectory());
}

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

export async function moveFiles(sourcePath, targetPath, targetFileExt = "wav") {
  const newTargetPaths = await getTargetPaths(sourcePath);

  for (const { folderName, fileName } of newTargetPaths) {
    const oldPath = path.join(targetPath, `${fileName}.${targetFileExt}`);
    const newPath = path.join(
      targetPath,
      folderName,
      `${fileName}.${targetFileExt}`
    );

    await mkdir(path.join(targetPath, folderName), { recursive: true });

    await rename(oldPath, newPath);

    console.log(`${oldPath} => ${newPath}`);
  }
}

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
