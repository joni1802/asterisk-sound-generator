import {
  readFile,
  readdir,
  writeFile,
  open,
  copyFile,
  mkdir,
} from "node:fs/promises";
import path from "node:path";

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

      // if (!files.includes(name)) {
      //   files.push(name);
      // }
    }
  }

  return files;
}

async function init() {
  const freepbxSource = "E:\\Coding\\freepbx-sounds\\en";
  const freepbx = await getSoundFiles(freepbxSource);

  const asteriskExtra = await getSoundFiles(
    "E:\\Coding\\asterisk-extra-sounds-en-g722"
  );
  const asteriskCore = await getSoundFiles("E:\\Coding\\asterisk-core");

  const combinedSounds = [...asteriskCore, ...asteriskExtra];

  const difference = freepbx.filter((file) => {
    const index = combinedSounds.findIndex((f) => f.name === file.name);

    if (index === -1) {
      return true;
    } else {
      return false;
    }
  });

  // await mkdir("temp");

  // for (const file of difference) {
  //   // const sourceFile = path.join(freepbxSource, )

  //   await copyFile();
  // }

  // console.log(difference.length);

  console.log(difference);
}

init();
