# Install sound files in FreePBX

1. Log into your FreePBX webinterface and go to **Admin > Sound Languages**.
2. In the right navigation bar, click **Custom Languages**.
3. Click on the button **+ Add New Custom Language**.
4. Enter a language code, e.g. **de_custom** and a description, e.g. **DE Custom**. Click on submit.
5. In the right navigation bar, click **Settings**.
6. Select the newly added language **DE_Custom** as a **Global Language** and select the following **Download Formats**: **alaw**, **ulaw**, **g722**. Click on Submit.
7. Click on **Apply Changes**.
8. Download the three zip files `core-sounds-XX-vY.Y.Y.zip`, `extra-sounds-XX-vY.Y.Y.zip` and `freepbx-sounds-XX-vY.Y.Y.zip` from the [newest release](https://github.com/joni1802/asterisk-sounds-de/releases/latest) on Github.
9. Connect with a SFTP client like WinSCP to your FreePBX machine.
10. Go to the directory **/var/lib/asterisk/sounds/de_custom** and copy the content of the three zip files to the directory. If you get a warning that some files already exists, skip the copy of these files.
11. If you had any custom recordings before the language change, copy the folder **custom** from the old language folder to the new language folder.
12. Change the owner of the copied files from **root** to **asterisk**. You can do this in WinSCP or over SSH with the command `chown -R asterisk:asterisk /var/lib/asterisk/sounds/de_custom`.
