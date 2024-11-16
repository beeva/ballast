export type ParsedEnvVars = { ok: true; vars: Record<string, string> } | { ok: false; error: string };

const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

/**
 * Parses a textarea's worth of "KEY=VALUE" lines into a plain object, the
 * same shape passed straight through to the build subprocess's environment.
 * Blank lines and lines starting with "#" are skipped (comments), so the
 * textarea can double as its own inline documentation.
 */
export function parseEnvVarsText(text: string): ParsedEnvVars {
  const vars: Record<string, string> = {};

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) {
      return { ok: false, error: `Invalid line "${line}" - expected KEY=VALUE.` };
    }
    const key = line.slice(0, eqIndex).trim();
    const value = line.slice(eqIndex + 1).trim();
    if (!KEY_PATTERN.test(key)) {
      return { ok: false, error: `Invalid variable name "${key}" - use letters, numbers, and underscores, not starting with a number.` };
    }
    vars[key] = value;
  }

  return { ok: true, vars };
}

/** The inverse of parseEnvVarsText - used to prefill the edit form's textarea. */
export function formatEnvVarsText(vars: Record<string, string>): string {
  return Object.entries(vars)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}
