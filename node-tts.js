// @ts-check
/**
 * @file Provides functions for the Coqui and Google text-to-speech APIs.
 */
import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import googleTtsApi from "@google-cloud/text-to-speech";
import * as dotenv from "dotenv";
import { existsSync } from "node:fs";

dotenv.config();

const debug = false;

/**
 * Node wrapper for the Coqui TTS command line tool.
 * Creates audio files from the provided text.
 * @param {string} text - transcription
 * @param {string} modelName - model name used for the audio
 * @param {string} targetFile - target audio file
 * @returns {Promise<void>}
 */
export function coquiTts(text, modelName, targetFile) {
  return new Promise((resolve, reject) => {
    if (fileExits(targetFile)) {
      resolve();
    }

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

/**
 * Wrapper for the Google Text-To-Speech API.
 * Creates audio files from the provided text.
 * @param {string} text - transcription
 * @param {string} langCode - language code
 * @param {string} voiceName - voice name of the AI
 * @param {string} targetFile - target audio file
 * @returns {Promise<void>}
 */
export async function googleTts(text, langCode, voiceName, targetFile) {
  if (fileExits(targetFile)) {
    return;
  }

  const client = new googleTtsApi.TextToSpeechClient();

  const request = {
    input: {
      text: splittedSentences(text),
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

  // @ts-ignore
  const [response] = await client.synthesizeSpeech(request);

  await writeFile(targetFile, response.audioContent, {
    flag: "wx",
    encoding: "binary",
  });

  console.log(targetFile);
}

/**
 * Gets a list of the available Google TTS voices filtered by the provided language code.
 * @param {string} langCode - language code
 * @returns {Promise<import("@google-cloud/text-to-speech").protos.google.cloud.texttospeech.v1.IVoice[] | null | undefined>}
 */
export async function googleListVoices(langCode) {
  const client = new googleTtsApi.TextToSpeechClient();
  const [response] = await client.listVoices();

  return response.voices?.filter((voice) => {
    return voice.languageCodes?.includes(langCode);
  });
}

/**
 * Workaround for the following error thrown by the google text to speech api:
 * "This request contains sentences that are too long. To fix, split up long sentences with sentence ending punctuation e.g. periods."
 * Replaces a comma in front of a number with a punctuation.
 * @param {string} text - source text
 * @returns {string} - modified text
 */
function splittedSentences(text) {
  const regex = /,(\s\d),/g;

  // The $1 is the backreference of the value inside the capuring group.
  return text.replace(regex, ".$1");
}

/**
 * Checks if the file exists.
 * @param {string} filePath - file path of the file
 * @returns {boolean}
 */
function fileExits(filePath) {
  if (existsSync(filePath)) {
    console.log(`${filePath} skipped. File already exists.`);

    return true;
  } else {
    return false;
  }
}
