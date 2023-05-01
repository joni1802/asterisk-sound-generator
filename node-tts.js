import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import googleTtsApi from "@google-cloud/text-to-speech";
import * as dotenv from "dotenv";
import { existsSync } from "node:fs";

dotenv.config();

const debug = false;

export function coquiTts(text, modelName, targetFile) {
  if (fileExits(targetFile)) {
    return;
  }

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

export async function googleTts(text, langCode, voiceName, targetFile) {
  if (fileExits(targetFile)) {
    return;
  }

  const client = new googleTtsApi.TextToSpeechClient();

  const request = {
    input: {
      text,
    },
    voice: {
      languageCode: langCode,
      name: voiceName,
    },
    audioConfig: {
      audioEncoding: "LINEAR16",
      effectsProfileId: ["telephony-class-application"],
    },
  };

  const [response] = await client.synthesizeSpeech(request);

  await writeFile(targetFile, response.audioContent, {
    flag: "wx",
    encoding: "binary",
  });

  console.log(targetFile);
}

export async function googleListVoices(langCode) {
  const client = new googleTtsApi.TextToSpeechClient();
  const [response] = await client.listVoices();

  return response.voices.filter((voice) => {
    return voice.languageCodes.includes(langCode);
  });
}

function fileExits(filePath) {
  if (existsSync(filePath)) {
    console.log(`${filePath} skipped. File already exists.`);

    return true;
  } else {
    return false;
  }
}
