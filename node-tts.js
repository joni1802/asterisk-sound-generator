import { execFile } from "node:child_process";
import path from "node:path";
import { parseSoundFile } from "./parse.js";
import { mkdir } from "node:fs/promises";

const debug = false;

async function init() {
  console.time();

  const targetLangCode = "de";
  const targetDir = `sounds/${targetLangCode}/core`;
  const coreSounds = parseSoundFile(
    path.join("transcriptions", `core-sounds-${targetLangCode}.txt`)
  );
  const modelName = "tts_models/de/thorsten/vits";

  await mkdir(targetDir, { recursive: true });

  // Just for testing
  // let counter = 0;

  for (let { name, text } of coreSounds) {
    // if (counter === 50) {
    //   break;
    // }

    if (text) {
      await tts(text, modelName, path.join(targetDir, `${name}.wav`));
    }

    // counter++;
  }

  console.timeEnd();
}

function tts(text, modelName, outPath) {
  return new Promise((resolve, reject) => {
    execFile(
      "tts",
      ["--text", text, "--model_name", modelName, "--out_path", outPath],
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

        console.log(outPath);

        resolve();
      }
    );
  });
}

init();
