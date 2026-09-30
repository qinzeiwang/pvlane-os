# PVLANE User Guide

[简体中文](USER-GUIDE.md) | English

## 1. Requirements

Use a Windows, macOS, or Linux desktop computer with a current version of Chrome or Edge and WebGL support. PVLANE runs locally in the browser and requires no account, backend, or database.

After installing Node.js 22 LTS, run the following commands in the project directory:

```sh
npm ci
npm run dev -- --port 5175
```

Open `http://127.0.0.1:5175`. Keep the terminal window running while using the application.

## 2. Create or open a project

The start page provides two options:

- **New Project**: start without a base drawing or import one.
- **Open Project**: select a JSON project previously saved by PVLANE.

Projects are not saved automatically. After important changes, use the save button in the upper-right corner to write the project JSON to your computer.

## 3. Create a roof without a base drawing

1. Select **New Project** and then **No Base Drawing**.
2. Select **Add Region** and choose a flat, mono-pitch, or gable roof.
3. Select **Start Drawing** and draw on the blank canvas. Click two endpoints and a third point for a rectangle. For flat roofs, choose **Polyline**, click successive corners, then click the starting point or **Close Roof**. Dimensions are limited to 2–200 m.
4. For a flat roof, enter roof height and parapet height. For a pitched roof, enter pitch and eave height, then set the slope or ridge direction.
5. Keep multiple roofs from overlapping.

## 4. Create a roof from a base drawing

PVLANE accepts PNG, JPG, WebP, and single-page PDF files. A base drawing may be up to 30 MB, and an image dimension may be up to 10000 pixels. Export the required page separately before importing a multi-page PDF.

1. Select **New Project** and then **Import Base Drawing**.
2. Enter the real-world length of a known segment on the drawing.
3. Select **Start Calibration**, click the two endpoints of that segment, and confirm.
4. Set north. If the top of the drawing is north, confirm that option directly.
5. Select **Add Region**, choose a roof type, and start drawing.
6. Click two endpoints of one roof edge, then click a third point to define the rectangular width.

Use the mouse wheel to zoom. Drag with the middle mouse button or hold Space while dragging to pan. Backspace removes one point and Escape cancels the current drawing. A roof must remain within the drawing and may not overlap another roof.

## 5. Obstacles and keep-out zones

- An **obstacle** has height and participates in footprint and shadow avoidance.
- A **keep-out zone** has no height and prevents modules from entering its area.

Use three points on the blank canvas or base drawing to create a rectangle. Double-click an object or use its Edit button to adjust its outline and height. Each roof allows up to 100 auxiliary buildings, obstacles, and keep-out zones combined.

Changing a roof, obstacle, module specification, or layout rule marks the existing layout as outdated. Run automatic layout again before generating a final report.

### Polygon roofs

Flat roofs support concave polygons with 3–64 vertices. Select **Polyline** in the drawing toolbar, click corners, then close the outline. Self-intersections and overlapping edges are rejected. Drag vertices in outline editing and run layout again. Polygon roofs currently support flat roofs only.

### Auxiliary building tops

Select **Add Auxiliary Building** under Region, enter its height above the roof, and draw a rotated rectangle. Select it, enable **Place Modules on Top**, and set top tilt and edge clearance. Run automatic layout. The footprint remains an obstacle while its horizontal top receives a separate array; taller neighboring objects participate in top shadow avoidance. Top modules count once under the parent roof. Top area is not added again to roof area. Disabling top layout or deleting the building removes its hosted arrays. Complex pitched tops and structural loading require separate review.

### Location and shadows

A recognized city uses an offline reference coordinate. For other locations, open **System Settings → Project Location → Enter Coordinates**, enter a complete latitude/longitude pair, and apply it. Manual coordinates take priority over the address. City reference points are approximate, not surveyed project coordinates.

Displayed shadows follow coordinates, date, local time, UTC offset, and drawing north. Automatic layout uses the local winter-solstice shadow envelope sampled from 09:00 to 15:00 true solar time; latitude affects design spacing. Changing the display date does not change the design interval. Southern-hemisphere winter is supported; polar-night locations are rejected by the current automatic check. Old projects without reliable coordinates retain geometry and arrays but require a location and recalculation. Coordinate, outline, and top-rule changes require recalculation.

## 6. Modules and automatic layout

1. Open the **Layout** tab.
2. Select a standard module from the project module library. The library supports name, power, length, width, and joint-gap editing.
3. Set connected rows, module direction, side aisle, and front-to-back spacing.
4. Select **Layout Current Roof**. For a multi-roof project, you can also select **Layout All Roofs**.

Main limits are: 0–60° tilt, 0–20 m side aisle and roof edge, 0–100 m front-to-back spacing, and 1–6 connected rows on gable roofs (1–3 on flat and single-slope roofs). A project supports up to 5000 modules.

After layout, check the status:

- **No footprint conflict** means the current checks found no boundary, overlap, or obstacle conflict.
- **Outdated** means parameters changed while the view still contains the previous result. Run layout again.
- If roofs overlap, return to **Region** and adjust their outlines or positions.

## 7. 2D, 3D, and image overlays

Use 2D for layout and conflict review. Use 3D to inspect roofs, modules, shadows, and the final report viewpoint. Display settings control the background, ground, simple/standard/fine rendering quality, date, local time, UTC offset, and shadow mode.

**Image Overlay** imports an independent PNG, JPG, or WebP reference image. Each file may be up to 8 MB, with a maximum of eight images. You can move, proportionally resize, rotate, change opacity, hide, or delete an overlay.

## 8. Save, restore, and report

### Save a project

Use the save button and choose a location for the `.json` file. A project includes its base drawing, overlays, roofs, module library, and layout results, so image-based projects can be large. The maximum project file size accepted when opening is 120 MB.

Consider saving milestones with separate names:

```text
project-01-roofs.json
project-02-layout.json
project-03-report.json
```

### Generate a report

1. Update every roof and resolve boundary, module overlap, and obstacle footprint conflicts. The **Report** page lists roofs that still require attention.
2. Select **Enter 3D and Preview Report**.
3. Adjust the 3D viewpoint and preview the report.
4. Select **Download to...** to save HTML, or use **Print / Save as PDF** inside the report.

The report contains developed roof area, module count, installed capacity, projected module area, and project totals. It is intended for early-stage estimates.

## 9. Troubleshooting

### The browser cannot choose a save location

Use desktop Chrome or Edge and access the app through `http://127.0.0.1`. Do not open an HTML file directly.

### A PDF cannot be imported

Confirm that it is a single-page PDF no larger than 30 MB. Split or export the required page from a multi-page file.

### A report cannot be generated after editing

Return to **Layout** and update every roof marked as outdated. Overlapping roofs, invalid parameters, or more than 5000 modules also prevent layout completion.

### 3D is blank or slow

Update the graphics driver and enable browser hardware acceleration. Close other GPU-intensive applications and reload. For a large project, reduce overlays or module count.

### A project cannot be opened

Use a JSON file saved by the current PVLANE version, make sure it was not corrupted by manual editing, and keep it below 120 MB. The application displays a specific message when it encounters unsupported data.

## 10. Data and privacy

PVLANE has no backend upload flow. Imported drawings and project data are processed in the current browser and written only to the local file you explicitly choose. Before publishing, sending, or attaching these files, check whether they contain sensitive project information.

## 11. Getting help

When opening a GitHub Issue, include your operating system, browser and version, Node.js version, reproduction steps, actual result, and expected result. A project JSON may contain base drawings and business data; attach it only after confirming that its contents may be public.

### Common module library

In Settings → Module Library, add or edit specifications and apply edits first. Select the default module for new projects, then click Save as Common Library. The library is stored in the current browser or offline application. New projects use it automatically; clearing storage or changing browsers does not transfer it. Existing project files keep their own catalog. Import Common Library appends specifications without overwriting existing ones. Each catalog supports up to 50 standard module types.

The primary roof menu contains flat and gable roofs. Expand Other Roof Types for a single-slope roof. Gable roofs support 1–6 connected rows; flat and single-slope roofs support 1–3. Switching from gable to another type clamps the setting to at most three rows and requires recalculation.

Simple, standard and fine rendering remain available. Pitched roofs use metal-roof textures and factory details. Fine mode adds neutral-grey PV cells, concrete wall textures, concrete ground and a bundled HDR environment. These are illustrative materials; the HDR does not replace the solar direction calculated from project coordinates and time. Fine mode uses more graphics memory. All resources work offline.

## Editing and keyboard controls

- System settings apply immediately. Recalculate layouts after changing location, north or edge margins. Closing discards coordinate drafts that have not been applied.
- Module edits take effect only after selecting Apply specifications. Cancel changes restores the original values. Save to common library is disabled while edits are pending; closing the library discards pending drafts.
- Rename a region: Enter or leaving the field commits the name; Escape cancels and keeps the original name.
- Tab / Shift+Tab moves through modal controls. Escape closes the dialog and restores focus to its opener. In the drawing editor, Escape cancels the current drawing without closing the editor.
- When editing a small obstacle or exclusion zone, Frame selected object zooms in and Show entire drawing restores the overview. Done applies the edit; Cancel preserves the original geometry.
- Polygon roofs currently support flat roofs. Create a rectangular region for a pitched roof. Collapse the operation panel to free canvas space in a small window.
