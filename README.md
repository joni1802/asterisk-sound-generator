# Asterisk Sound Generator ☎️

**If you just want to download the prebuilt sound files, take a look at the [Github releases](https://github.com/joni1802/asterisk-sound-generator/releases/latest) of this project.**

This is a CLI tool for generating Asterisk sound files based of the original transcriptions from the Asterisk Open Source project. The goal is to provide better language support for currently unsupported languages like German. The sound files can be used by any phone software based on Asterisk - like FreePBX.
The tool uses the DeepL and ChatGPT API to translate the transcriptions and the Google Text-To-Speech API to generate the sound files. However, the translations still needs some manual work.
The tool also converts the generated sound files to the common codecs.

## Prerequirements

- Installed [Node.js](https://nodejs.org/) runtime (atleast Version 20.0.0)
- DeepL account with access to the [DeepL API](https://www.deepl.com/docs-api) (Free for up to 500.000 characters per month)
- OpenAI account (Not free but really cheap)
- Google Cloud account with access to the [Google Text-to-Speech API](https://cloud.google.com/text-to-speech) (Free for up to 1 Mio. characters per month)
- [FFmpeg binary](https://ffmpeg.org/download.html) for converting the sound files

## Install CLI

1. Clone the repository `git clone https://github.com/joni1802/asterisk-sound-generator.git`.
2. Change into the directory `cd asterisk-sound-generator`
3. Install the Node modules `npm install`
4. Start the CLI tool `npm run start`

### Using Google Text to Speech

1. Create a service account for the Google Text to Speech API.
2. Create a key pair for the service account and download the JSON file.
3. Create a .env file in the root directory of this project.
4. Add `GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/key.json` to the .env file.

More details: [Using the Text-to-Speech API with Node.js](https://codelabs.developers.google.com/codelabs/cloud-text-speech-node#0)

### Using Coqui TTS (not supported yet)

1. Install python.
2. Install Coqui TTS by running `pip install TTS`.

More details: [Coqui TTS Github Repo](https://github.com/coqui-ai/TTS)

### Using DeepL API for translations

1. Create a free DeepL account.
2. Generate an API key.
3. Create a .env file in the root directory of this project.
4. Add `DEEPL_AUTH_KEY=<your deepl api key>` to the .env file.

### Using ChatGPT for translations

1. Create an OpenAI account.
2. Generate an API key.
3. Create a .env file in the root directory of this project.
4. Add `OPEN_AI_AUTH_KEY=<your deepl api key>` to the .env file.

### Using FFmpeg for converting audio files

1. Download the prebuilt FFmpeg binary from an official source.
2. Copy the binary (executable) to the root directory of this project or add it to the PATH environment variable.

## More usefull sources

- [Google Audio Codecs](https://cloud.google.com/speech-to-text/docs/encoding)
- [Supported codecs Asterisk](https://wiki.asterisk.org/wiki/display/AST/Codec+Modules)
- [Supported codecs FreePBX](https://wiki.freepbx.org/display/DIMG/Supported+Codecs)
