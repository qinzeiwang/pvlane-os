import { expect, it } from 'vitest';
import { autoLayout } from './auto-layout';
import { detect, obstacles } from './domain';
const options = { portrait: true, tilt: 20, edge: 0.5, gap: 1, maxColumns: 18 };
it('fills a roof and avoids rotated obstacles without array collisions', () => {
  for (const portrait of [true, false]) {
    const roof = { width: 30, depth: 20 };
    const result = autoLayout(roof, obstacles, { ...options, portrait });
    expect(result.count).toBeGreaterThan(36);
    expect(detect(result.arrays, obstacles, { width: 29, depth: 19 })).toEqual([]);
    expect(result.count).toBe(result.arrays.reduce((n, a) => n + a.rows * a.columns, 0));
  }
});
it('handles fully blocked or too-small roofs and limits capacity', () => {
  expect(autoLayout({ width: 2, depth: 2 }, [], options).count).toBe(0);
  expect(autoLayout({ width: 30, depth: 20 }, [{ ...obstacles[0], x: 0, z: 0, width: 40, depth: 40 }], options).count).toBe(0);
  const result = autoLayout({ width: 200, depth: 200 }, [], options);
  expect(result.count).toBe(5000);
  expect(result.capped).toBe(true);
});
it('rejects invalid scan steps', () => {
  expect(() => autoLayout({ width: 30, depth: 20 }, [], { ...options, gap: -3 })).toThrow();
});
