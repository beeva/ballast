export type BuildStatus = "queued" | "running" | "success" | "failed";
export type DeployStatus = "active" | "superseded" | "rolled_back";
export type AlertStatus = "firing" | "resolved";

export const BUILD_STATUS_LABEL: Record<BuildStatus, string> = {
  queued: "Queued",
  running: "Running",
  success: "Success",
  failed: "Failed",
};

export const BUILD_STATUS_TONE: Record<BuildStatus, "neutral" | "copper" | "moss" | "danger"> = {
  queued: "neutral",
  running: "copper",
  success: "moss",
  failed: "danger",
};

export function isBuildStatus(value: string): value is BuildStatus {
  return value in BUILD_STATUS_LABEL;
}

export const ALERT_STATUS_LABEL: Record<AlertStatus, string> = {
  firing: "Firing",
  resolved: "Resolved",
};

export const ALERT_STATUS_TONE: Record<AlertStatus, "neutral" | "copper" | "moss" | "danger"> = {
  firing: "danger",
  resolved: "moss",
};

export function isAlertStatus(value: string): value is AlertStatus {
  return value in ALERT_STATUS_LABEL;
}
