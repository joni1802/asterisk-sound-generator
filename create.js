import { coquiTts, googleTts, googleListVoices } from "./node-tts.js";
import { parseSoundFile } from "./parse.js";
import { readdirSync } from "node:fs";
import { mkdir, rename, readFile } from "node:fs/promises";
import inquirer from "inquirer";
import path from "node:path";
import { ffmpeg } from "./convert.js";
import { existsSync } from "node:fs";

async function createSilenceFiles(targetPath) {
  await mkdir(targetPath, { recursive: true });

  for (let i = 1; i <= 10; i++) {
    const targetFile = path.join(targetPath, `${i}.wav`);

    if (existsSync(targetFile)) {
      console.log(`${targetFile} skipped. Already exists.`);
    } else {
      console.log(`${targetFile} created.`);

      await ffmpeg(
        `-f lavfi -i anullsrc=r=16000:cl=stereo -t ${i} ${targetFile}`
      );
    }
  }
}

async function moveExtraSoundFiles(
  newTargetPaths,
  targetPath,
  targetFileExt = "wav"
) {
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

        await mkdir(path.join(targetDir, ...subdir), { recursive: true });
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

  if (/^extra/.test(transcription)) {
    const extraSoundsDirs = await readFile("extra-sounds-dirs.json", {
      encoding: "utf8",
    });

    await moveExtraSoundFiles(JSON.parse(extraSoundsDirs), targetDir);
  }

  if (/^core/.test(transcription)) {
    const silentSoundsDir = path.join(targetDir, "silence");

    await createSilenceFiles(silentSoundsDir);
  }

  console.timeEnd();
}

export default function init() {
  const questions = [
    {
      type: "list",
      name: "transcription",
      message: "Choose a transcription.",
      choices() {
        return readdirSync("transcriptions");
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

  inquirer.prompt(questions).then(createSoundFiles);
}
