/**
 * Feature flags derived from environment variables.
 * Read once per call; env is fixed for the process lifetime.
 */

/**
 * Whether the AI chat panel is enabled.
 *
 * - `ENABLE_AI=false` (or 0/no/off) hard-disables it, regardless of AI_* vars.
 * - Otherwise it is enabled only when AI_BASE_URL, AI_API_KEY and AI_MODEL are
 *   all set (so leftover placeholder values don't half-enable a broken panel).
 */
export function isAiEnabled(): boolean {
  const flag = (process.env.ENABLE_AI ?? "").trim().toLowerCase();
  if (["false", "0", "no", "off"].includes(flag)) return false;

  return !!(
    process.env.AI_BASE_URL &&
    process.env.AI_API_KEY &&
    process.env.AI_MODEL
  );
}
