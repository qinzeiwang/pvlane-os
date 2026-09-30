# Windows offline edition

[简体中文](WINDOWS-OFFLINE.md) | English

The current source version is 0.3.0 and includes offline build support. No matching Windows package has been rebuilt or published in this update. Installation steps below apply to a package you have actually received; use the version number on that package.

## Install and start

For Windows 10/11 x64. Users do not need Node.js, Git, or development tools.

- Installer: run `PVLANE-Offline-<version>-Windows-x64-Setup.exe` and choose an installation folder.
- ZIP: extract the complete archive to a writable folder and run `PVLANE Offline.exe`. Do not copy the executable alone.
- Enter your assigned username on first use. Later starts under the same Windows account on the same computer do not require it again. Names are case-insensitive; surrounding spaces are ignored.
- A copyright, permitted-use, and liability notice appears at every launch. Click the agreement button to enter the workspace.
- The application operates locally without registration, drawing uploads, or online updates.

## Projects and reports

The Save button opens a native Windows dialog and writes a JSON project. Use Open Project after restarting to continue editing.

After completing layout, open Report and generate a preview. Use Download to save HTML or Save PDF to export PDF directly. Canceling a save writes no file. Run layout again after editing geometry or settings before generating a report. See the [User Guide](USER-GUIDE.en.md) for other operations.

## Username management

This build embeds verification hashes for 20 usernames. It has no password, device binding, online checks, or expiration. A name works on multiple computers; anyone who knows it can enter. This is a simple access gate, not tamper-proof protection.

The first successful check stores only a username verification hash in the current Windows user's application data, not the plaintext name. Application data may remain after uninstalling. Removing `%APPDATA%\PVLANE-Offline\activation.json` requires entering a username again. A new embedded username list also requires re-entry if the stored hash is no longer present.

The plaintext username list is for the distributor only. Assign one name per user and do not ship the entire list. Changing the list requires a new build; existing builds cannot be remotely disabled.

Build locally:

```sh
npm ci
npm run desktop:users
npm run desktop:pack
```

Re-running `desktop:users` preserves existing names. Back up `.desktop-private/` separately; it is excluded from Git. Installers and ZIP archives are written to `release/` and do not contain the plaintext list.

This build has no commercial code-signing certificate, so Windows may display an unknown publisher. Verify the distributor and SHA-256 checksum. The source license remains in [LICENSE.md](../LICENSE.md); the access gate does not change rights already granted for the published source.

The source is publicly available under a license that restricts commercial use. See the [Chinese license summary](../LICENSE.zh-CN.md) and the full [English terms](../LICENSE.md). The software is provided as-is; users must check their project results. The legal disclaimer is governed by the license and applicable law.
