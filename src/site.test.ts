import { expect, it } from 'vitest';
import { defaultArrays, detect, obstacles } from './domain';

it('uses edited roof dimensions for boundary warnings', () => {
  const arrays = [{ ...defaultArrays()[0], x: 12, z: 0 }];
  expect(detect(arrays, [], { width: 20, depth: 20 }).some(i => i.kind === 'boundary')).toBe(true);
  expect(detect(arrays, [], { width: 40, depth: 20 })).toEqual([]);
});

it('uses current obstacle positions and keeps height separate from planar collision', () => {
  const arrays = [{ ...defaultArrays()[0], x: 0, z: 0 }];
  const obstacle = { ...obstacles[0], x: 0, z: 0, height: 5 };
  expect(detect(arrays, [obstacle]).some(i => i.kind === 'obstacle')).toBe(true);
  expect(detect(arrays, [{ ...obstacle, x: 50 }])).toEqual([]);
  expect(detect(arrays, [{ ...obstacle, height: 1 }])).toEqual(detect(arrays, [obstacle]));
  expect(detect(arrays, [])).toEqual([]);
});
