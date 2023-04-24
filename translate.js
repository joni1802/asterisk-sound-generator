import * as dotenv from "dotenv";
import * as deepl from "deepl-node";

dotenv.config();

const authKey = process.env.DEEPL_AUTH_KEY;
const translator = new deepl.Translator(authKey);

const result = await translator.translateText(
  "Please enter your personal identification number followed by the pound, or hash key.",
  null,
  "de"
);

console.log(result.text);
