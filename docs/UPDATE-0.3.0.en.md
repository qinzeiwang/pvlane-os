# 0.3.0 update notes

[简体中文](UPDATE-0.3.0.md) | English

Updated: 2026-10-01. Baseline: the previous GitHub version, `0.2.0` (commit `195b3ee`).

This update adds location-based shadows, polygon roofs, auxiliary rooftop layouts and a persistent module library, and improves rendering and interaction. The existing logo, pan/zoom controls, three rendering presets and double-click editing remain available.

## Added and improved

### Location and shadows

- Location and coordinates now drive lighting and layout checks, with 50 offline city reference points and manual coordinates.
- Visual shadows follow coordinates, date, local time, UTC offset and drawing north. Switch between current lighting and local winter-solstice checks.
- Automatic layout samples local winter-solstice true solar time from 09:00 to 15:00. Latitude affects shadow avoidance and row spacing. Visual date/time controls are separate from design checks.
- Missing locations require input. Invalid coordinates, location mismatches and polar-night conditions produce guidance or block unsuitable checks.

### Roofs and auxiliary buildings

- Flat roofs support polygon and concave outlines, free drawing of slanted edges, closure, vertex editing, boundary checks and actual area statistics. Polygon and single-slope creation are grouped under Other Roof Types; the drawing toolbar places polygon drawing under More. Polygon vertices no longer snap to horizontal or vertical axes.
- Flat tops of rooftop monitors, towers and other auxiliary buildings can carry modules with independent tilt and clearance, including related shadow checks.
- Top modules persist with projects and undo history and count toward roof and project reports. Disabling the top layout or deleting its building removes the associated modules.
- Gable roofs support up to six connected rows per slope instead of three. Mono-pitch roofs move to the Other roof types menu.

### Module library and materials

- Save a common module library in the current browser, choose a default for new projects and import common specifications into an existing project.
- Specification drafts require explicit application and can be canceled. Saving the common library is disabled while drafts are pending. Modules used by roofs remain protected from deletion.
- Upgrade factory walls, roofs, ground and PV materials. Fine rendering uses local concrete maps and an HDR environment, with third-party sources and license notices.

## Fixes and interaction improvements

- Fix blank scenes after fine materials finish loading and misplaced gray shadows caused by shadow-camera and environment-map refreshes.
- Report readiness now checks boundary, array-overlap, roof-overlap and obstacle footprint conflicts as well as stale parameters. Unready materials cannot produce a blank report capture.
- Fix Escape committing a region rename: Escape keeps the old name; Enter or leaving the field commits it.
- Unify primary, cancel, rendering selection, image action and checkbox colors using the existing blue accent.
- Improve initial modal focus, Tab / Shift+Tab cycling, background isolation, Escape dismissal and focus restoration. Escape in the drawing editor still cancels the current drawing.
- Prevent panels from covering the toolbar in small windows; add Frame selected object for small obstacles and exclusion zones, explanatory disabled states and busy-state protection.

- Fix first double-click editing of an unselected object and initialize the canvas before users can immediately drag a corner.
- Old projects without drawings can edit and add geometry on a recovered blank canvas, preserving metric coordinates and north.
- Undo deletion remains available after deleting the last roof and restores its objects and layout.
- Returning before drawing calibration retains the drawing on the creation page. A new edit clears obsolete redo state, and dragging no longer selects text.
- Malformed project files produce clear errors without replacing the current project.

## Windows offline builds

Compared with the previous GitHub source, this update includes Electron configuration, installer and portable ZIP build scripts, local generation of 20 random usernames, remembered first-time verification and a usage/license notice on every launch. Desktop interfaces support native saving and PDF export.

Plaintext usernames, verification lists, installers, staging directories and local QA screenshots are excluded from Git. Each distributor generates and retains their own list. The browser source edition does not require username activation.

**This update contains source and documentation only; no new 0.3.0 Windows package has been built or published.** See the [Windows offline guide](WINDOWS-OFFLINE.en.md).

## Existing projects and scope

- Back up project JSON before upgrading. After import, confirm location and settings and rerun layout if checks are missing, changed or marked stale; then save and generate a report.
- Recalculate after changing location, north, margins, roofs, objects or module specifications. Changing the visual date does not replace winter-solstice design checks.
- Polygon outlines currently apply to flat roofs; pitched roofs require rectangular outlines. Standard modules and the 5000-module project limit remain.
- Lightweight modules, carports, energy generation, 25-year forecasts and subtotals grouped by module or orientation are not added.
- Licensing is unchanged: personal noncommercial use and commercial demonstrations are permitted; restricted commercial activities such as selling code, paid development and software/code delivery require prior written authorization. Refer to [LICENSE.md](../LICENSE.md).

## Validation and documentation

- All 326 functional tests across 45 files and four desktop verification tests pass. TypeScript checks and the production build pass.
- Browser walkthroughs cover project creation, drawing/project imports, geometry editing, cancel/apply, undo/redo, module libraries, location/shadows, rendering, reports and a 5000-module scene. Modal keyboard behavior and 800×600 / 640×480 layouts were reviewed.
- Native save-dialog write/cancel behavior, system printing/PDF output and the new Windows package still require real-device validation. Automated tests and Web preview do not replace these checks.
- Updated bilingual READMEs, user guides, changelogs, Windows guides and test guides, plus third-party notices. See the [User Guide](USER-GUIDE.en.md) and [Testing Guide](TESTING.en.md).
- The [user workflow QA record](QA-0.3.0.en.md) describes 73 UI checkpoints, targeted automated regressions and production-browser follow-up checks, with verification limits.
