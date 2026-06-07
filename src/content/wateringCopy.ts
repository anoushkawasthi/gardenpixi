/** PRD §9.5.2 — short bubble lines after a successful water (session-only brighten). */

export const WATER_SUCCESS_BUBBLES = [
  "Nice pour!",
  "That one's glowing.",
  "Hydration +10",
  "The garden thanks you.",
  "Splash! Much better.",
] as const;

export function randomWaterBubble(): string {
  const i = Math.floor(Math.random() * WATER_SUCCESS_BUBBLES.length);
  return WATER_SUCCESS_BUBBLES[i] ?? "Watered!";
}
