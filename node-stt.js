// @ts-check
/**
 * @file Creates a transcription from audio files by using the Google Speech API.
 * This is used for english audio files in FreePBX which are not find in the officials Asterisk transcriptions.
 */
import speech from "@google-cloud/speech";
import { readFile } from "node:fs/promises";
import path from "node:path";
import * as dotenv from "dotenv";

dotenv.config();

/**
 * @typedef {Object} FileTranscription
 * @property {string} name - name of the file
 * @property {string} transcription - the resulted transcription of the file
 */

/**
 * Transcribes the source file to text.
 * @param {string} sourceFile - source audio file
 * @param {string} langCode - supported Google Speech language code
 * @returns {Promise<FileTranscription>}
 */
export async function googleSpeech(sourceFile, langCode) {
  const client = new speech.SpeechClient();

  const file = await readFile(sourceFile);
  const audioBytes = file.toString("base64");

  const audio = {
    content: audioBytes,
  };

  const config = {
    // encoding: "LINEAR16",
    // sampleRateHertz: 16000,
    enableAutomaticPunctuation: true,
    languageCode: langCode,
  };

  const request = {
    audio,
    config,
  };

  const [response] = await client.recognize(request);
  // @ts-ignore
  const transcription = response.results
    // @ts-ignore
    .map((result) => result.alternatives[0].transcript)
    .join("\n");

  return {
    name: path.parse(sourceFile).name,
    transcription,
  };
}
