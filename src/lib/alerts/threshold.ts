export type Comparator = "gt" | "gte" | "lt" | "lte";

export function isComparator(value: string): value is Comparator {
  return value === "gt" || value === "gte" || value === "lt" || value === "lte";
}

export function compareValue(value: number, comparator: Comparator, threshold: number): boolean {
  switch (comparator) {
    case "gt":
      return value > threshold;
    case "gte":
      return value >= threshold;
    case "lt":
      return value < threshold;
    case "lte":
      return value <= threshold;
  }
}

/** Arithmetic mean, or null for an empty window - distinct from 0, which is a real average of real zeros. */
export function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
