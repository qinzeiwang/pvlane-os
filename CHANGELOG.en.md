# Changelog

[简体中文](CHANGELOG.md) | English

This file records notable user-facing changes.

## 0.3.0 - 2026-10-01

See the [0.3.0 update notes](docs/UPDATE-0.3.0.en.md) for the full comparison with GitHub 0.2.0 (`195b3ee`). This update includes source and documentation; no new Windows package has been built.

- Irregular roofs support free slanted edges and concave corners; polygon creation is in a secondary menu.
- Fix first object double-clicks and immediate corner dragging; old projects without drawings remain editable and the last roof deletion can be undone.
- Fix calibration return, contour redo state and malformed-file errors; add bilingual guidance and complete workflow regression coverage.
- Unify dialog, rendering selection and image action colors; fix Escape saving a roof rename and toolbar overlap in small windows; improve modal focus, cancellation of module edits and object framing.
- Fix the scene remaining blank after fine materials finish loading. Reports now require layouts without boundary, overlap, or obstacle footprint conflicts.
- Fix misplaced shadows by refreshing the shadow camera on quality changes and regenerating shadows after HDR loading.
- Gable roofs now support six connected rows; single-slope roofs move to a secondary menu; factory and fine-rendering materials are updated; persistent common module libraries and new-project defaults are available.
- Project location and coordinates drive visual lighting and local winter-solstice layout checks. Added offline city presets, manual coordinates, date/time, and UTC offset.
- Concave polygon flat roofs support drawing, vertex editing, boundary checks, and actual footprint area.
- Flat auxiliary building tops support independent module tilt and clearance, project persistence, and report totals.
- Old projects retain geometry and arrays but require recalculation when location or design checks are missing or changed.
- Preserved standard modules, the 5000-module limit, and offline activation. Carports, lightweight modules, and energy calculations remain outside scope.

## 0.2.1 - 2026-09-23

Local desktop build record; this version was not separately committed to GitHub.

- Added a Windows offline installer and portable ZIP; end users do not need Node.js.
- The assigned username is verified once per Windows user profile; the copyright, usage, license, and liability notice still appears at every launch.
- The startup screen can display the Chinese license summary and full English terms offline.
- Fixed the pan button remaining selected after switching projects and the hand cursor remaining after a drag.
- Verified 124 tests across 32 test files, four desktop authorization tests, and the production build.

## 0.2.0 - 2026-09-19

### Added

- Refreshed the PVLANE wordmark, fonts, and workbench interface, with consistent button colors and states.
- Added canvas pan, zoom in, zoom out, and fit-to-view controls.
- Separated the module library and system settings into dedicated entry points.
- Added Simple, Standard, and Fine rendering quality levels.
- Added projects without a base drawing, with project name and location fields.
- Added double-click editing for roofs, obstacles, and keep-out zones.

### Fixed

- `projectBounds([])` now returns zero-size bounds instead of `NaN` or an invalid view.
- Fit-to-view now includes all roofs and the imported base drawing.
- Standard pitched-roof layout now avoids obstacle shadow exclusion zones.
- Module deletion states now explain that used modules cannot be deleted and at least one module must remain.
- Numeric settings are applied only within their valid ranges and reset to a valid value on blur.

### Verification

- All 119 tests across 30 test files pass.
- TypeScript checks and the production build pass.
