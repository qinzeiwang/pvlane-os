export type PerformanceTrial = {
  fps: number;
  p95Ms: number;
  frames: number;
  durationMs: number;
};
export type PerformanceReport = {
  recordedAt: string;
  quality: string;
  panels: number;
  canvas: string;
  renderer: string;
  webgl: string;
  trials: PerformanceTrial[];
  medianFps: number;
  medianP95Ms: number;
  calls: number;
  triangles: number;
  geometries: number;
  textures: number;
  passed: boolean;
};
export type VisualOptions = {
  backgroundColor?: string;
  groundColor?: string;
  realistic: boolean;
  guides: boolean;
  stress: boolean;
  run: number;
  onProgress: (text: string) => void;
  onReport: (report: PerformanceReport) => void;
};
