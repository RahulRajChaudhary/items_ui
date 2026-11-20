/**
 * The only place the module reads the environment. Switching from the built-in mock server to a real backend
 * means setting NEXT_PUBLIC_BOSS_API_BASE and nothing else.
 */
export const API_BASE: string = process.env.NEXT_PUBLIC_BOSS_API_BASE ?? "/api/mock";

/** Organization used when the host passes none (standalone mode). */
export const DEFAULT_ORGANIZATION_ID = "60095924962";
