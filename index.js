import inquirer from "inquirer";
import convert from "./convert.js";
import extraSounds from "./extra-sounds.js";

async function init() {
  const question = [
    {
      type: "rawlist",
      name: "action",
      message: "Choose the action.",
      choices: [
        {
          name: "Create sound files.",
          value: "create",
        },
        {
          name: "Convert sound files.",
          value: "convert",
        },
        {
          name: "Translate transcription file.",
          value: "translate",
        },
        {
          name: "Generate list of directories for the extra sound files.",
          value: "extra-sounds",
        },
      ],
    },
  ];

  const { action } = await inquirer.prompt(question);

  switch (action) {
    case "create":
      // await create()
      break;
    case "convert":
      await convert();
      break;
    case "translate":
      // await translate()
      break;
    case "extra-sounds":
      await extraSounds();
  }
}

init();