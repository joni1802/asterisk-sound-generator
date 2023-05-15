# How to contribute to this project

If you find a sound file with a bad translation and you want to improve it, you can create an issue or a pull request on Github. You can find all transcriptions in the folder **transcriptions**. Transcriptions which have a version number at the end of its name are old ones, don't edit these ones. Always edit the newest files without the a version number.

There are 3 different transcription files per language: **Core Sounds, Extra Sounds** and **FreePBX Sounds**. FreePBX uses all three. The english **Core** and **Extra Sounds** are officially from the **Asterisk** project. You can find them [here](https://downloads.asterisk.org/pub/telephony/sounds/). The **FreePBX Sounds** are additional sounds which are shipped by the FreePBX distro.

## Detect the playing sound files

The easiest way to see, which sound files are played by your PBX, is to log into your system via SSH and write the following command in your terminal:

```
tail -f /var/log/asterisk/full | grep Playing
```

You will see the name of the currently playing files. Then you can search for the file name (without the extension) in the transcriptions and make the changes.
