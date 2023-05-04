import { coquiTts, googleTts, googleListVoices } from "./node-tts.js";
import { parseSoundFile } from "./parse.js";
import { readdirSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import inquirer from "inquirer";
import path from "node:path";

const questions = [
  {
    type: "list",
    name: "transcription",
    message: "Choose a transcription.",
    choices() {
      const dir = readdirSync("transcriptions");

      // Order files by language code
      return dir.sort((a, b) => {
        const [_, aLangCode] = a.match(/^.*-([a-z]{2,})\.txt$/);
        const [__, bLangCode] = b.match(/^.*-([a-z]{2,})\.txt$/);

        return aLangCode.charCodeAt(0) - bLangCode.charCodeAt(0);
      });
    },
  },
  {
    type: "list",
    name: "tts",
    message: "Choose a Text-To-Speech engine.",
    choices: ["Coqui", "Google"],
    filter(val) {
      return val.toLowerCase();
    },
  },
  {
    type: "rawlist",
    name: "voice",
    message: "Which voice name should be used?",
    default: 13,
    when(answers) {
      return answers.tts === "google";
    },
    async choices() {
      const langCode = "de-DE";
      const voices = await googleListVoices(langCode);

      return voices.map((voice) => ({
        name: `${voice.name} (${voice.ssmlGender})`,
        value: {
          langCode,
          name: voice.name,
        },
      }));
    },
  },
];

async function createSoundFiles(answers) {
  console.time();

  const { transcription, tts, voice } = answers;
  const targetDir = path.join("sounds", path.parse(transcription).name);
  const transcriptionArray = parseSoundFile(
    path.join("transcriptions", transcription)
  );

  await mkdir(targetDir, { recursive: true });

  for (let { name, text } of transcriptionArray) {
    if (text) {
      if (name.split("/").length > 1) {
        let subdir = name.split("/").slice(0, -1);

        mkdir(path.join(targetDir, ...subdir), { recursive: true });
      }
      // await coquiTts(text, modelName, path.join(targetDir, `${name}.wav`));

      if (tts === "google") {
        await googleTts(
          text,
          voice.langCode,
          voice.name,
          path.join(targetDir, `${name}.wav`)
        );
      }
    }
  }

  console.timeEnd();
}

inquirer.prompt(questions).then(createSoundFiles);
