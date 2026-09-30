# Testing guide

[简体中文](TESTING.md) | English

After installing dependencies, run `npm test`, `npm run desktop:test`, and `npm run build`.

Automated tests cover geometry, layouts, capacity limits, location shadows, module libraries, project parsing, undo history, reports, and offline desktop access. `src/qa-workflow.test.ts` also combines flat, single-slope, and gable roofs, ridge axes, four module directions, and northern/southern latitudes. It checks calculation → editing → recalculation → save/restore → report consistency.

## UI regression workflow

Use desktop Chrome or Edge with synthetic drawings that contain no business data.

1. Create a project without a drawing. Check the empty scene and that pan is initially off. Import PNG and single-page PDF separately; reject multi-page PDF.
2. Calibrate distance and north. Create irregular roofs through Other Roof Types → Polygon Roof and the drawing toolbar More menu. Draw rectangles, slanted convex polygons and concave polygons, and verify that shallow slants are not snapped to axes; test undoing vertices, redrawing, dragging corners, cancellation, and applying edits.
3. Add, edit, double-click, and delete obstacles, exclusion zones, and auxiliary buildings. Reject objects outside the roof. Toggle top modules and verify counts.
4. Enter a recognized city. Test invalid, empty, valid manual coordinates, and cancellation. Change lighting using the actual keyboard or native date/time picker; check solar position and shadows. Recalculate after latitude changes.
5. Edit module specifications. Reject invalid values; prevent deleting used modules and allow deleting unused ones. Save the common library, create a new project, and verify defaults. Restore the original library after testing.
6. Test 1–6 gable rows, orientation, and ridge direction. Switch to single-slope or flat roofs and verify the three-row limit. Recalculate current and all roofs.
7. Undo and redo roof and object edits. Import test projects containing out-of-bounds or overlapping arrays. Pending layouts or footprint conflicts must block reports.
8. Switch simple, standard, and fine quality. On first entry, fine mode must display automatically after material loading. Check pan, zoom, and fit with all roofs visible.
9. Save JSON, cancel saving, and reopen it. Verify counts, capacity, coordinates, top modules, and pending state. A damaged JSON must leave the current project intact.
10. Generate a report and verify roof rows and totals, the 3D picture, escaped names, HTML saving, and PDF printing.

Record the revision, browser, workflows, actual results, fixes, and unverified items. Mocked save APIs do not replace manual Windows file-picker testing. A Web build does not validate an installer.

See the [0.3.0 user workflow test record](QA-0.3.0.en.md) for executed scenarios, fixes and verification limits.
