import speech from "@google-cloud/speech";
import { readFile } from "node:fs/promises";
import path from "node:path";
import * as dotenv from "dotenv";

dotenv.config();

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
  const transcription = response.results
    .map((result) => result.alternatives[0].transcript)
    .join("\n");

  return {
    name: path.parse(sourceFile).name,
    transcription,
  };
}
