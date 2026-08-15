/**
 * Velocity-aware pacing: entrance staggers collapse as scroll speed rises so
 * reveals never feel late. The app's stagger base is 0.04s (Motion.swift);
 * at high velocity we ship the same frame. Stagger hits zero entirely above
 * ~2400 px/s — fast enough that only a real flick gets there.
 */

import { scrollSpeed } from "./pointer";
import { MOTION } from "./springs";

export function pacedStagger(index: number): number {
  const speed = scrollSpeed();
  const collapse = Math.min(1, speed / 2400);
  return index * MOTION.durations.stagger * (1 - collapse);
}
