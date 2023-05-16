// @ts-check
/**
 * @file Used for translating the transcriptions by using the DeepL and OpenAI APIs.
 */

import * as dotenv from "dotenv";
import * as deepl from "deepl-node";
import { open, mkdir, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import inquirer from "inquirer";
import { OpenAI } from "openai-streams/node";
import { createWriteStream } from "node:fs";
import { encode, decode } from "gpt-3-encoder";

dotenv.config();

const debug = false;

/**
 * Reads the source file line by line, parses it and translates the text with the DeepL API.
 * The translated text will be written to the target file line by line.
 * @param {string} sourceFile - the file that will be translated
 * @param {string} targetFile - the translated file
 * @param {deepl.TargetLanguageCode} targetLangCode - target language code
 */
async function deeplTranslateFile(sourceFile, targetFile, targetLangCode) {
  const authKey = process.env.DEEPL_AUTH_KEY;
  // @ts-ignore
  const translator = new deepl.Translator(authKey);
  const source = await open(sourceFile);
  const target = await open(targetFile, "ax");

  let lineNumber = 1;

  for await (const line of source.readLines()) {
    const [name, text] = line.split(/:(.*)/);

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

/**
 * Returns the list of all support languages by DeepL
 * @returns {Promise<readonly deepl.Language[]>}
 */
function getTargetLanguages() {
  const authKey = process.env.DEEPL_AUTH_KEY;
  // @ts-ignore
  const translator = new deepl.Translator(authKey);

  return translator.getTargetLanguages();
}

/**
 * Reads the name of the source file, extracts the language code and replaces it with the target language code.
 * @param {string} sourceFile - source file name
 * @param {string} targetLangCode - target language code
 * @returns {string} - new file name with target language code
 */
function getTargetFilename(sourceFile, targetLangCode) {
  const regex = /^(.*-).*(\.txt)$/i;

  return sourceFile.replace(regex, `$1${targetLangCode}$2`);
}

/**
 * Translates the text using gpt-3.5-turbo. The response stream gets piped to a target file.
 * @param {string} text - text that gets translated
 * @param {*} targetFile - the translated file
 * @param {*} language - any language
 * @returns {Promise<void>} - when the stream is finished
 */
async function openaiTranslateFile(text, targetFile, language) {
  return new Promise(async (resolve, reject) => {
    const target = createWriteStream(targetFile, { flags: "a" });
    const content = `Translate a transcription of a phone system to ${language}. Translate each line individually. Split each line by the colon and only translate everything after the colon. 
Here is the transcription:
${text}
`;

    const stream = await OpenAI(
      "chat",
      { model: "gpt-3.5-turbo", messages: [{ role: "user", content }] },
      { apiKey: process.env.OPEN_AI_AUTH_KEY }
    );

    stream.setEncoding("utf8");

    stream.pipe(target, { end: false });

    stream.on("data", (data) => {
      process.stdout.write(data);
    });

    stream.on("end", () => {
      console.log("\n");

      target.end("\n", resolve);
    });

    stream.on("error", reject);
  });
}

/**
 * The model gpt-3.5-turbo only supports 4096 tokens for the requenst and the response combined.
 * This function splits the request into smaller chunks sized by the token limit.
 * It makes sure that every chunks ends with whole line.
 * Because the used tokens by the response are unknown, the token limit should be set much smaller than the maximum support limit.
 * @param {string} sourceFile - source transcription file
 * @param {number} tokenLimit - token limit per chunk
 * @returns {Promise<string[]>} - array of text chunks of the source file
 */
async function getFileChunks(sourceFile, tokenLimit = 3800) {
  const source = await readFile(sourceFile, { encoding: "utf8" });
  const tokens = encode(source);
  const chunks = [];

  let lastLine = "";

  for (let i = 0; i < tokens.length; i = i + tokenLimit) {
    const chunk = tokens.slice(i, i + tokenLimit);

    let decoded = lastLine + decode(chunk);

    const lines = decoded.split("\n");

    lastLine = lines[lines.length - 1];

    decoded = decoded.replace(lastLine, "");

    chunks.push(decoded);
  }

  return chunks;
}

/**
 * Logs the line number followed by a tab and the line to stdout.
 * @param {number} lineNumber - line number
 * @param {string} line - text with line number
 */
function logger(lineNumber, line) {
  console.log(`${lineNumber}\t${line}`);
}

/**
 * Initiates the command line user interface.
 * Translates the selected transcriptions into the selected language.
 * @returns {Promise<void>}
 */
export default async function init() {
  const targetDir = "transcriptions";

  const questions = [
    {
      type: "list",
      name: "translator",
      message: "Choose the translation engine.",
      choices: [
        {
          name: "ChatGPT",
          value: "chatgpt",
        },
        {
          name: "DeepL",
          value: "deepl",
        },
      ],
    },
    {
      type: "rawlist",
      name: "targetLangCode",
      message: "Select the language to translate into.",
      when(answers) {
        return answers.translator === "deepl";
      },
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
      name: "targetLanguage",
      message: "Select the language to translate into.",
      when(answers) {
        return answers.translator === "chatgpt";
      },
      // to-do: improve list and maybe combine list with deepls one.
      choices: [
        {
          name: "German",
          value: {
            code: "de",
            name: "german",
          },
        },
      ],
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

  const targetLangCode = answers.targetLangCode || answers.targetLanguage.code;
  const sourceFile = path.join(targetDir, answers.sourceFile);
  const targetFile = path.join(
    targetDir,
    getTargetFilename(answers.sourceFile, targetLangCode)
  );

  mkdir(targetDir, { recursive: true });

  switch (answers.translator) {
    case "deepl":
      await deeplTranslateFile(sourceFile, targetFile, targetLangCode);
      break;
    case "chatgpt":
      // The token limit is 4096 tokens for input and output.
      // Because the amount of tokens used by chatGPT for the output can't be calculated, the limit should be set much lower than 4096 tokens.
      // Also languages like german consume up to three times more tokens then english.
      const chunks = await getFileChunks(sourceFile, 1500);

      for (const text of chunks) {
        await openaiTranslateFile(
          text,
          targetFile,
          answers.targetLanguage.name
        );
      }
  }
}
