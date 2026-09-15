import type {LayoutOptions} from './auto-layout';

// Keep calculation and project-file acceptance on the same parameter contract.
export function validLayoutOptions(r: LayoutOptions | null | undefined): boolean {
  const range = (v: number, min: number, max: number) => Number.isFinite(v) && v >= min && v <= max;
  return !!r && typeof r.portrait === 'boolean'
    && range(r.tilt, 0, 60) && range(r.edge, 0, 20) && range(r.gap, 0, 20)
    && Number.isInteger(r.maxColumns) && range(r.maxColumns, 1, 100)
    && Number.isInteger(r.maxRows ?? 1) && range(r.maxRows ?? 1, 1, 100)
    && range(r.arrayGapY ?? r.gap, 0, 20) && range(r.rowGap ?? 0, 0, 100)
    && (r.direction === undefined || Number.isInteger(r.direction) && range(r.direction, 0, 3))
    && (r.tableRows === undefined || Number.isInteger(r.tableRows) && range(r.tableRows, 1, 3))
    && (r.spacingMode === undefined || ['solar', 'manual'].includes(r.spacingMode));
}
