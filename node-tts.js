import { execFile } from "node:child_process";
import path from "node:path";
import { parseSoundFile } from "./parse.js";
import { mkdir, writeFile } from "node:fs/promises";
import googleTtsApi from "@google-cloud/text-to-speech";
import * as dotenv from "dotenv";

dotenv.config();

const debug = false;

async function init() {
  console.time();

  const targetLangCode = "de";
  const targetDir = path.join("sounds", targetLangCode, "core");
  const coreSounds = parseSoundFile(
    path.join("transcriptions", `core-sounds-${targetLangCode}.txt`)
  );
  const modelName = "tts_models/de/thorsten/vits";
  const voiceName = "de-DE-Neural2-C";

  await mkdir(targetDir, { recursive: true });

  // Just for testing
  let counter = 0;

  for (let { name, text } of coreSounds) {
    if (counter === 10) {
      break;
    }

    if (text) {
      if (name.split("/").length > 1) {
        let subdir = name.split("/").slice(0, -1);

        mkdir(path.join(targetDir, ...subdir), { recursive: true });
      }
      // await coquiTts(text, modelName, path.join(targetDir, `${name}.wav`));
      await googleTts(
        text,
        `${targetLangCode}-DE`,
        voiceName,
        path.join(targetDir, `${name}.mp3`)
      );
    }

    counter++;
  }

  console.timeEnd();
}

function coquiTts(text, modelName, targetFile) {
  return new Promise((resolve, reject) => {
    execFile(
      "tts",
      ["--text", text, "--model_name", modelName, "--out_path", targetFile],
      {
        // This environment variables needs to be set. Otherwise the tts child process will throw an error.
        // See https://stackoverflow.com/a/63573649
        env: { PYTHONIOENCODING: "utf-8", PYTHONLEGACYWINDOWSSTDIO: "utf-8" },
      },
      (err, stdout) => {
        debug && console.log(stdout);

        if (err) {
          reject(err);
        }

        console.log(targetFile);

        resolve();
      }
    );
  });
}

async function googleTts(text, langCode, voiceName, targetFile) {
  const client = new googleTtsApi.TextToSpeechClient();

  const request = {
    input: {
      text,
    },
    voice: {
      languageCode: langCode,
      name: voiceName,
    },
    audioConfig: { audioEncoding: "MP3" },
  };

  const [response] = await client.synthesizeSpeech(request);

  await writeFile(targetFile, response.audioContent, {
    flag: "wx",
    encoding: "binary",
  });

  console.log(targetFile);
}

init();
