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
3. Enter roof width and length in the **Region** panel. Each dimension must be between 2 and 200 m.
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

Without a base drawing, the add button creates an editable rectangle. With a drawing, define the rectangle with three points. Each roof supports up to 100 obstacles and keep-out zones in total.

Changing a roof, obstacle, module specification, or layout rule marks the existing layout as outdated. Run automatic layout again before generating a final report.

## 6. Modules and automatic layout

1. Open the **Layout** tab.
2. Select a standard module from the project module library. The library supports name, power, length, width, and joint-gap editing.
3. Set connected rows, module direction, side aisle, and front-to-back spacing.
4. Select **Layout Current Roof**. For a multi-roof project, you can also select **Layout All Roofs**.

Main limits are: 0–60° tilt, 0–20 m side aisle and roof edge, 0–100 m front-to-back spacing, and 1–3 connected rows. A project supports up to 5000 modules.

After layout, check the status:

- **No footprint conflict** means the current checks found no boundary, overlap, or obstacle conflict.
- **Outdated** means parameters changed while the view still contains the previous result. Run layout again.
- If roofs overlap, return to **Region** and adjust their outlines or positions.

## 7. 2D, 3D, and image overlays

Use 2D for layout and conflict review. Use 3D to inspect roofs, modules, shadows, and the final report viewpoint. Display settings control the background, ground, material style, and winter-solstice solar time.

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

1. Confirm the **Report** tab has no update-required message.
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
