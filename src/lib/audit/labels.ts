/** Human-readable label for an audit_log.action value - shared by the overview widget and the full audit log page. */
export const AUDIT_ACTION_LABEL: Record<string, string> = {
  "service.created": "created service",
  "service.updated": "updated service",
  "service.deleted": "deleted service",
  "build.triggered": "triggered build",
  "build.cancelled": "cancelled build",
  "deploy.created": "deployed",
  "deploy.rolled_back": "rolled back to",
  "alert_rule.created": "created alert rule",
  "alert_rule.updated": "updated alert rule",
  "alert_rule.deleted": "deleted alert rule",
};
