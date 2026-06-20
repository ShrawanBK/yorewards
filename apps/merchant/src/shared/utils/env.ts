/** True in local `next dev` — safe for dev-only UI and seed actions. */
/* eslint-disable turbo/no-undeclared-env-vars -- NODE_ENV is a standard Next.js build-time constant */
export const isDevEnvironment = process.env.NODE_ENV === "development";
