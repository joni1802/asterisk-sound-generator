import * as dotenv from "dotenv";
import * as deepl from "deepl-node";
import { open, mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import inquirer from "inquirer";

dotenv.config();

const debug = false;

async function translateFile(sourceFile, targetFile, targetLangCode) {
  const authKey = process.env.DEEPL_AUTH_KEY;
  const translator = new deepl.Translator(authKey);
  const source = await open(sourceFile);
  const target = await open(targetFile, "ax");

  let lineNumber = 1;

  for await (const line of source.readLines()) {
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

  source.close();
  target.close();
}

function getTargetLanguages() {
  const authKey = process.env.DEEPL_AUTH_KEY;
  const translator = new deepl.Translator(authKey);

  return translator.getTargetLanguages();
}

function getTargetFilename(sourceFile, targetLangCode) {
  const regex = /^(.*-).*(\.txt)$/i;

  return sourceFile.replace(regex, `$1${targetLangCode}$2`);
}

function logger(lineNumber, line) {
  console.log(`${lineNumber}\t${line}`);
}

export default async function init() {
  const targetDir = "transcriptions";

  const questions = [
    {
      type: "rawlist",
      name: "targetLangCode",
      message: "Select the language to translate into.",
      async choices() {
        const languages = await getTargetLanguages();

        return languages.map((language) => {
          return {
            name: language.name,
            value: language.code,
          };
        });
      },
    },
    {
      type: "rawlist",
      name: "sourceFile",
      message: "Select the file to be translated.",
      choices() {
        return readdir(targetDir);
      },
    },
    {
      type: "confirm",
      name: "toBeTranslated",
      message: "Start translation?",
      default: true,
    },
  ];

  const answers = await inquirer.prompt(questions);

  if (!answers.toBeTranslated) {
    return;
  }

  const targetLangCode = answers.targetLangCode;
  const sourceFile = path.join(targetDir, answers.sourceFile);
  const targetFile = path.join(
    targetDir,
    getTargetFilename(answers.sourceFile, targetLangCode)
  );

  mkdir(targetDir, { recursive: true });

  await translateFile(sourceFile, targetFile, targetLangCode);
}
