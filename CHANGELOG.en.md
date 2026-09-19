# Changelog

[简体中文](CHANGELOG.md) | English

This file records notable user-facing changes.

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
