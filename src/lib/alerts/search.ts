export interface SearchableAlertRule {
  serviceName: string;
  metricName: string;
}

/** Case-insensitive substring match against the rule's service name or metric name. */
export function filterAlertRulesByQuery<T extends SearchableAlertRule>(rules: T[], query: string): T[] {
  const trimmed = query.trim().toLowerCase();
  if (trimmed === "") return rules;
  return rules.filter(
    (rule) => rule.serviceName.toLowerCase().includes(trimmed) || rule.metricName.toLowerCase().includes(trimmed)
  );
}
