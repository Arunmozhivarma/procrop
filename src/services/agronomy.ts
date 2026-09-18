import { soilByField } from "@/data/sensing";
import type { RiskLevel, SeriesPoint } from "@/types/common";
import type { SoilMetric } from "@/types/sensing";

function round(v: number, d = 0) {
  const m = 10 ** d;
  return Math.round(v * m) / m;
}

function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function riskFromScore(score: number): RiskLevel {
  if (score >= 80) return "low";
  if (score >= 60) return "moderate";
  if (score >= 40) return "high";
  return "critical";
}

export function riskFromProbability(p: number): RiskLevel {
  if (p < 0.25) return "low";
  if (p < 0.5) return "moderate";
  if (p < 0.75) return "high";
  return "critical";
}

export function soilScore(metrics: SoilMetric[]) {
  const per = metrics.map((m) => {
    const [lo, hi] = m.ideal;
    if (m.value >= lo && m.value <= hi) return 100;
    const span = hi - lo || 1;
    const dist = m.value < lo ? lo - m.value : m.value - hi;
    return Math.max(20, 100 - (dist / span) * 90);
  });
  return Math.round(per.reduce((a, b) => a + b, 0) / per.length);
}

export function soilHistory(fieldId: string, days = 30): SeriesPoint[] {
  const base: SoilMetric[] = soilByField[fieldId] ?? soilByField["field-1"] ?? [];
  const rnd = seedRandom(fieldId.length * 97 + 13);
  const get = (k: string) => base.find((m) => m.key === k)?.value ?? 50;
  return Array.from({ length: days }, (_, i) => {
    const t = i / days;
    const wobble = (amp: number) => (rnd() - 0.5) * amp;
    const d = new Date(Date.UTC(2026, 6, 19 + i));
    return {
      date: d.toISOString().slice(5, 10),
      moisture: round(get("moisture") + wobble(9) + Math.sin(i / 3) * 4 - t * 5),
      ph: round(get("ph") + wobble(0.25), 2),
      n: round(get("n") + wobble(14) - t * 10),
      p: round(get("p") + wobble(6)),
      k: round(get("k") + wobble(18)),
      temp: round(get("temp") + wobble(2.4) + Math.sin(i / 5) * 1.5, 1),
    };
  });
}

export function environmentHistory(days = 30): SeriesPoint[] {
  const rnd = seedRandom(4711);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.UTC(2026, 6, 19 + i));
    return {
      date: d.toISOString().slice(5, 10),
      temp: round(29 + Math.sin(i / 4) * 3 + (rnd() - 0.5) * 2, 1),
      humidity: round(72 + Math.sin(i / 3 + 1) * 12 + (rnd() - 0.5) * 6),
      rainfall: round(Math.max(0, Math.sin(i / 2.4) * 14 + (rnd() - 0.35) * 18)),
      stress: round(38 + Math.sin(i / 5) * 18 + (rnd() - 0.4) * 12),
    };
  });
}
