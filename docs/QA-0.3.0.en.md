# 0.3.0 User Workflow Test Record

[简体中文](QA-0.3.0.md) | English

Date: 2026-10-01. Scope: the 0.3.0 source working tree and local production Web build. UI checks used a Chromium-based browser at 1280 × 720 with synthetic projects.

## Results

- 326 regression tests across 45 files pass, including 62 targeted cases for irregular roof editing, recovery of old projects without drawings, and malformed files.
- 73 UI checkpoints pass. Operations affected by fixes were retested in the production build.
- Four desktop verification tests, TypeScript checks and the production build pass.
- Final scenario: three roofs comprising a flat roof with an auxiliary building, a six-row gable roof and a concave roof; 718 modules and 394.90 kWp. The report is ready. The final browser check recorded no runtime errors.

## Operations Covered

| Scenario | Operations and results |
| --- | --- |
| Empty project | Create, fit view, cancel adding, delete the last roof and undo; no invalid bounds |
| Irregular roofs | Secondary-menu creation, slanted edges, concave corners, insufficient vertices and self-intersection rejection, drawing undo/redo |
| Layout | Missing-location blocking, coordinate validation, city location, current/all-roof layout and layout undo |
| Editing | Direction changes mark old results stale; vertex drag cancellation/application, undo/redo and recalculation |
| Roof types | Rotated gable creation, six rows, conversions to mono-pitch and flat roofs with the correct row limit |
| Objects | Create obstacles, exclusion zones and auxiliary buildings; reject outside objects; first double-click, cancel/apply edits and undo deletion |
| Rooftop modules | Enable auxiliary rooftop layout on an irregular roof and include it in combined checks and totals |
| Drawings | PNG import; single-page PDF import, distance validation, calibration, north, roof creation and layout; multi-page PDF rejection |
| Redrawing | Convert a PDF-based rectangular flat roof to an irregular outline, clear the old layout and recalculate |
| Projects | Cancel a new project without losing the current one; restart cleanly; preserve the current project on malformed import; edit/add to old projects without drawings |
| Module library | Prevent deletion of used modules; delete unused modules; reject invalid specifications; discard unapplied drafts on close |
| Reports | Preview multiple roofs and verify totals; block stale results and restore report readiness after recalculation |

The new batch regression combines convex/concave irregular outlines, latitudes 23°, 40° and −34°, four module directions and two roof rotations. Each case runs layout → reshape → undo/redo → recalculate → serialize/parse → change module and objects → recalculate → report, checking clearances, object world positions, invalidation of old results and consistent totals.

## Fixes

1. Selecting a list object no longer scrolls the panel to the top, which could break the first double-click.
2. Editing old projects without drawings recovers a blank canvas while preserving metric positions, north and roofs. Large-coordinate projects stay inside the canvas, and imported blank-canvas projects open with a usable initial editing view.
3. Returning before calibration now opens the creation page and retains the drawing for continued calibration or switching to a blank canvas.
4. A new vertex edit after undo clears the obsolete redo state.
5. Outline dragging no longer selects text; irregular-roof editing explicitly instructs users to drag vertices.
6. Malformed and non-project JSON receive clear Chinese errors without overwriting the current project.

## Verification Limits

Data persistence consistency is covered by automated regression, and project import was exercised through the UI. Writing, cancelling and overwriting through the native Windows save-location dialog still need manual acceptance. No new Windows package was generated; desktop verification does not replace testing an installed package. These results describe covered scenarios and do not exhaust every possible input combination.

## Additional related-issue review (2026-10-01)

Two interaction fixes were added:

- Measure the drawing canvas and initialize its viewport before the first paint. Opening an editor and immediately dragging a corner no longer uses an uninitialized pixel scale. Roofs, obstacles and keepouts share this editor.
- After deleting the last roof, the empty-region menu still offers Undo deletion. It restores the roof, its objects and its previous layout; stale layouts still require recalculation.

Existing protections were compared in code: reports reject stale layouts, out-of-bounds arrays, array collisions, obstacle conflicts and overlapping roofs; Escape cancels rename drafts; the module library guards unapplied drafts; dialogs manage focus and background interaction; small-window layout and button colors already have fixes; report capture rejects unready 3D materials, and location/light changes and fine-environment loading refresh the shadow cache.

All 326 automated tests in 45 files, TypeScript checking and the production build passed. A new report regression rejects obstacle conflicts even when the layout signature is current. Actual production-browser checks covered opening the roof editor and immediately dragging a corner (40×30 m changed normally to approximately 43.23×33.37 m), cancelling an obstacle corner edit and reopening its original 2×2 m geometry, and restoring the last deleted roof through the empty-region menu with its three objects and original 83 modules retained. No new Windows package was built. This review does not replace the native save/print acceptance checks described above.
