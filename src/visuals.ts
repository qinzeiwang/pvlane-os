// Shared vertices keep the two proof scenes comparable; no engine objects here.
export function outline(width: number, depth: number, y = 0.07) {
  return [
    -width / 2,
    y,
    -depth / 2,
    width / 2,
    y,
    -depth / 2,
    width / 2,
    y,
    depth / 2,
    -width / 2,
    y,
    depth / 2,
    -width / 2,
    y,
    -depth / 2,
  ];
}
export function direction(depth: number) {
  return [
    0,
    0.09,
    depth / 2 + 0.2,
    0,
    0.09,
    depth / 2 + 1,
    -0.3,
    0.09,
    depth / 2 + 0.7,
    0,
    0.09,
    depth / 2 + 1,
    0.3,
    0.09,
    depth / 2 + 0.7,
  ];
}
export const roofGrid: number[] = [];
for (let x = -15; x <= 15; x++) roofGrid.push(x, 0.006, -10, x, 0.006, 10);
for (let z = -10; z <= 10; z++) roofGrid.push(-15, 0.006, z, 15, 0.006, z);
export const centerAxes = [
  -15, 0.012, 0, 15, 0.012, 0, 0, 0.012, -10, 0, 0.012, 10,
];
export const northArrow = [
  -13, 0.04, -7, -13, 0.04, -9, -13.35, 0.04, -8.5, -13, 0.04, -9, -12.65, 0.04,
  -8.5,
];
