# PVLANE

[简体中文](README.md) | English

PVLANE is a browser-based tool for early-stage photovoltaic design, including roof modeling, automatic module layout, and installed-capacity reporting.

## Features

- Import PNG, JPG, WebP, or single-page PDF base drawings; calibrate scale and set north, or start without a drawing.
- Model flat, mono-pitch, and gable roofs; add obstacles and keep-out zones.
- Manage standard PV modules, configure direction and spacing, and run automatic layout.
- Review the design in 2D and 3D.
- Save and reopen projects, undo and redo changes, and add reference-image overlays.
- Preview an installed-capacity report containing roof area, module count, capacity, occupied area, and project totals; save it as HTML or print it to PDF.

## Report definitions

Roof area is the developed surface area and is not reduced by obstacles or keep-out zones. PV occupied area is the sum of module projection areas on the roof and excludes gaps and access aisles. Capacity uses the rated power of the modules actually placed. A calculated roof that fits no modules may report zero; an uncalculated or outdated roof must be updated first.

## Local installation

Install the following software:

- Git, or download the repository ZIP from GitHub.
- Node.js 22 LTS. The minimum supported version is Node.js 20.19. npm is included with Node.js.
- Desktop Chrome or Edge with WebGL support.

Open a terminal in the project directory and run:

```sh
git clone https://github.com/qinzeiwang/pvlane-os.git
cd pvlane-os
npm ci
npm run dev -- --port 5175
```

Open the address printed in the terminal, normally `http://127.0.0.1:5175`. `npm ci` installs React, Three.js, PDF.js, and the other project dependencies automatically. No backend, database, Docker, Python, or standalone PDF application is required. Do not run the app by double-clicking `index.html`.

Chrome or Edge is required for choosing where to save project and report files.

## Quick workflow

1. Select **New Project**. Start without a base drawing, or import a PNG, JPG, WebP, or single-page PDF.
2. With a drawing, calibrate a known distance, confirm north, and define a rectangular roof with three points. Without a drawing, enter the roof width and length.
3. Choose a flat, mono-pitch, or gable roof and add obstacles or keep-out zones as needed.
4. In **Layout**, confirm the module and spacing settings, then lay out the current roof or all roofs.
5. Check boundaries and conflicts in 2D, then inspect the result in 3D.
6. Save the project JSON. When every roof is up to date, preview and save the installed-capacity report.

See the [English User Guide](docs/USER-GUIDE.en.md) for complete instructions and troubleshooting. The application interface is currently in Simplified Chinese.

See the [Changelog](CHANGELOG.en.md) for version history.

## Development checks

```sh
npm test
npm run build
npm run preview -- --port 4175
```

Read the [Contributing Guide](CONTRIBUTING.en.md) before submitting changes. Report security issues according to [SECURITY.md](SECURITY.md).

## Project compatibility

Use project JSON files saved by the current version. Unsupported or invalid data is rejected with an explicit message and is not silently removed. If an imported roof is marked as outdated, run layout again.

## License

PVLANE uses the [PolyForm Noncommercial License 1.0.0](LICENSE.md) as its base license with an additional commercial-display permission.

- Personal use, research, testing, hobby use, and other noncommercial use are permitted.
- Commercial presentations, live demonstrations, marketing, bid presentations, customer communications, and display of screenshots, videos, reports, and other generated output are permitted without separate authorization.
- Commercial display does not include delivering source code, a build, a software copy, or an online service for continued independent use by a customer or another party.
- Prior written authorization from the licensor is required to profit from selling, licensing, renting, developing, customizing, deploying, hosting, supporting, or delivering this code, modified versions, or derivative software, including SaaS.

Commercial authorization requires prior written permission from the copyright holder. Open a GitHub Issue in this repository to contact `qinzeiwang`, and do not include contracts, customer information, or other sensitive material in a public Issue. The complete terms in [LICENSE.md](LICENSE.md) control; an [informal Chinese license summary](LICENSE.zh-CN.md) is also available. Third-party dependencies remain subject to their own licenses as listed in [Third-party Notices](THIRD-PARTY-NOTICES.md).

Because the license restricts some commercial activities, PVLANE is source-available and is not Open Source under the OSI definition.

## Project status

The current version focuses on standard-module roof layout and installed-capacity reporting. The interface bundles Inter and Noto Sans SC with the application build. Their licenses are included in [docs/font-licenses](docs/font-licenses) and the [Third-party Notices](THIRD-PARTY-NOTICES.md).
