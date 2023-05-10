import speech from "@google-cloud/speech";
import { readFile } from "node:fs/promises";

import * as dotenv from "dotenv";

dotenv.config();

const client = new speech.SpeechClient();
const filename = "agent-login.wav";

const file = await readFile(filename);
const audioBytes = file.toString("base64");

const audio = {
  content: audioBytes,
};

const config = {
  encoding: "LINEAR16",
  // sampleRateHertz: 16000,
  enableAutomaticPunctuation: true,
  languageCode: "en-US",
};

const request = {
  audio: audio,
  config: config,
};

const [response] = await client.recognize(request);
const transcription = response.results
  .map((result) => result.alternatives[0].transcript)
  .join("\n");
console.log(`Transcription: ${transcription}`);

console.log(response.results[0].alternatives);
