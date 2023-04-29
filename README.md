# This is a title

## Create audio files

### Using Coqui TTS

1. Install python.
2. Install Coqui TTS by running `pip install TTS`.

More details: [Coqui TTS Github Repo](https://github.com/coqui-ai/TTS)

### Using Google Text to Speech

1. Create a service account for the Google Text to Speech API.
2. Create a key pair for the service account and download the JSON file.
3. Create a .env file in the root directory of this project.
4. Add `GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/key.json` to the .env file.

More details: [Using the Text-to-Speech API with Node.js](https://codelabs.developers.google.com/codelabs/cloud-text-speech-node#0)

## Create transcriptions

1. Create a .env file in the root directory of this project.
2. Add `DEEPL_AUTH_KEY=<your deepl api key><` to the .env file.
