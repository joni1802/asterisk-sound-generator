import { readdir, rename, mkdir } from "node:fs/promises";
import path from "node:path";

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
