import { timingSafeEqual } from "node:crypto";

const AUTH_HEADER_PREFIX = "Bearer ";

/**
 * Validates the ingestion endpoint's shared-secret Authorization header
 * against METRICS_INGEST_KEY. Constant-time so a slow-comparison timing
 * side channel can't be used to guess the key one byte at a time - same
 * reasoning as password verification, just for a symmetric secret instead
 * of a hash. Fails closed: an unconfigured key rejects every request
 * rather than accepting all of them.
 */
export function isValidIngestKey(authHeader: string | null): boolean {
  const configuredKey = process.env.METRICS_INGEST_KEY;
  if (!configuredKey) return false;
  if (!authHeader || !authHeader.startsWith(AUTH_HEADER_PREFIX)) return false;

  const provided = Buffer.from(authHeader.slice(AUTH_HEADER_PREFIX.length));
  const configured = Buffer.from(configuredKey);
  if (provided.length !== configured.length) return false;
  return timingSafeEqual(provided, configured);
}
