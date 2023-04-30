import * as dotenv from "dotenv";
import * as deepl from "deepl-node";
import { open, mkdir } from "node:fs/promises";
import path from "node:path";

dotenv.config();

const debug = false;

const authKey = process.env.DEEPL_AUTH_KEY;
const translator = new deepl.Translator(authKey);

async function init() {
  const targetDir = "transcriptions";
  const targetLangCode = "nl";
  const sourceFile = path.join(targetDir, "core-sounds-en.txt");
  const targetFile = path.join(targetDir, `core-sounds-${targetLangCode}.txt`);

  mkdir(targetDir, { recursive: true });

  translateFile(sourceFile, targetFile, targetLangCode);
}

async function translateFile(sourceFile, targetFile, targetLangCode) {
  const source = await open(sourceFile);
  const target = await open(targetFile, "ax");

  let lineNumber = 1;

  for await (const line of source.readLines()) {
    // Translate max. 1000 lines by default.
    // Deepl Free allows max. 500.000 characters to translate.
    if (lineNumber === 2000) {
      break;
    }

    const [name, text] = line.split(":");

    if (text) {
      const translation = await translator.translateText(
        text,
        null,
        targetLangCode
      );

      debug && console.log(translation);

      await target.writeFile(`${name}:${translation.text}\n`);

      logger(lineNumber, `${name}:${translation.text}`);
    } else {
      await target.writeFile(`${line}\n`);

      logger(lineNumber, line);
    }

    lineNumber++;
  }
}

function logger(lineNumber, line) {
  console.log(`${lineNumber}\t${line}`);
}

init();
