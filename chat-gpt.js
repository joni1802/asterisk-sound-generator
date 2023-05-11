import { OpenAI } from "openai-streams/node";
import * as dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";

dotenv.config();

function askChatGPT(content) {
  return OpenAI(
    "chat",
    { model: "gpt-3.5-turbo", messages: [{ role: "user", content }] },
    { apiKey: process.env.OPEN_AI_AUTH_KEY }
  );
}

async function translateTranscription(sourceFile, targetFile) {
  const source = await readFile(sourceFile, { encoding: "utf8" });
  const target = createWriteStream(targetFile);
  const content = `
Translate a transcription of a phone system to german. Only translate everything after the semicolon.
Here is the transcription:
${source}
`;

  const stream = await askChatGPT(content);

  stream.setEncoding("utf8");

  stream.pipe(target);

  stream.on("data", (data) => {
    process.stdout.write(data);
  });

  stream.on("end", () => {
    console.log("STREAM END");
  });
}

translateTranscription(
  "transcriptions\\freepbx-sounds-en.txt",
  "transcriptions\\freepbx-sounds-de.txt"
);
