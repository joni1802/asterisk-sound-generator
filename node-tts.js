import { execFile } from "node:child_process";
import path from "node:path";
import { parseSoundFile } from "./parse.js";

function init() {
  const sounds = parseSoundFile(path.join("data", "core-sounds-de.txt"));
  const modelName = "tts_models/de/thorsten/vits";

  console.log(sounds);

  let counter = 0;

  for (let { name, text } of sounds) {
    if (counter === 10) {
      break;
    }

    if (text) {
      tts(text, modelName, path.join("data", `${name}.wav`));
    }

    counter++;
  }
}

function tts(text, modelName, outPath) {
  execFile(
    "tts",
    ["--text", text, "--model_name", modelName, "--out_path", outPath],
    {
      // This environment variables needs to be set. Otherwise the tts child process will throw an error.
      // See https://stackoverflow.com/a/63573649
      env: { PYTHONIOENCODING: "utf-8", PYTHONLEGACYWINDOWSSTDIO: "utf-8" },
    },
    (err, stdout) => {
      console.log(stdout);
    }
  );
}

init();
