import { execFile } from "node:child_process";
import path from "node:path";

const text = "Der Wabbel Wackel Armige Windhosen Kamerad";
const modelName = "tts_models/de/thorsten/vits";
const outPath = path.join("data", "test.wav");

const tts = execFile(
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
