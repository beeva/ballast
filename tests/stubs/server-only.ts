// Vitest runs outside Next's bundler, which is normally what aliases the
// real `server-only` package to a no-op for server-side code. vitest.config.ts
// does the same aliasing here so server-only modules stay unit-testable.
export {};
