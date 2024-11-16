import {
  boolean,
  index,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/**
 * A single admin dashboard user. Password auth only (see src/lib/auth) -
 * this is a single-tenant demo, not a multi-org identity system.
 */
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * A deployable unit. repoUrl is anything `git clone` accepts - a remote
 * URL or a local path - so the worker can build real repos (including a
 * local fixture repo) without needing a hosted git provider. cpu/memory
 * requests are declared, not measured, and only feed the cost estimator;
 * there's no actual scheduler enforcing them.
 */
export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  repoUrl: text("repo_url").notNull(),
  buildCommand: text("build_command").notNull(),
  startCommand: text("start_command").notNull(),
  workingDirectory: text("working_directory").notNull().default("."),
  cpuRequestMilli: integer("cpu_request_milli").notNull().default(250),
  memoryRequestMb: integer("memory_request_mb").notNull().default(512),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * One run of a service's build command. status moves queued -> running ->
 * success|failed, written by the worker as it actually executes the
 * command (see src/lib/builds/runner.ts) - logs is the real captured
 * stdout+stderr, not a summary.
 */
export const builds = pgTable(
  "builds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).notNull().default("queued"), // queued | running | success | failed
    commitRef: varchar("commit_ref", { length: 200 }).notNull().default("HEAD"),
    logs: text("logs").notNull().default(""),
    errorMessage: text("error_message"),
    queuedAt: timestamp("queued_at", { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    durationMs: integer("duration_ms"),
  },
  (table) => [
    index("builds_service_id_idx").on(table.serviceId),
    index("builds_status_idx").on(table.status),
  ]
);

/**
 * Which build is live for a service, and the history of how it got there.
 * A rollback is just a new deploy row pointing at an older build - nothing
 * is mutated or deleted, so "what was live at 3pm yesterday" is always a
 * query away.
 */
export const deploys = pgTable(
  "deploys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    buildId: uuid("build_id")
      .notNull()
      .references(() => builds.id, { onDelete: "restrict" }),
    status: varchar("status", { length: 20 }).notNull().default("active"), // active | superseded | rolled_back
    isRollback: boolean("is_rollback").notNull().default(false),
    deployedBy: varchar("deployed_by", { length: 320 }).notNull(),
    deployedAt: timestamp("deployed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("deploys_service_id_idx").on(table.serviceId)]
);

/**
 * Ingested time-series points. Deliberately narrow (name + numeric value +
 * timestamp) rather than a generic tags/labels model - this is a metrics
 * pipeline for a portfolio-scale deployment platform, not Prometheus.
 */
export const metrics = pgTable(
  "metrics",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    metricName: varchar("metric_name", { length: 80 }).notNull(),
    value: numeric("value", { precision: 20, scale: 6 }).notNull(),
    recordedAt: timestamp("recorded_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("metrics_service_id_metric_name_idx").on(table.serviceId, table.metricName),
    index("metrics_recorded_at_idx").on(table.recordedAt),
  ]
);

/**
 * A threshold rule evaluated against the rolling average of a metric over
 * windowMinutes. Evaluation (src/lib/alerts/evaluate.ts) is what actually
 * opens/closes alertEvents rows below - this table just holds the
 * declared rule.
 */
export const alertRules = pgTable(
  "alert_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    metricName: varchar("metric_name", { length: 80 }).notNull(),
    comparator: varchar("comparator", { length: 4 }).notNull(), // gt | gte | lt | lte
    threshold: numeric("threshold", { precision: 20, scale: 6 }).notNull(),
    windowMinutes: integer("window_minutes").notNull().default(5),
    /** Optional - if set, evaluateAlertRule POSTs a JSON payload here on fire/resolve. */
    webhookUrl: text("webhook_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("alert_rules_service_id_idx").on(table.serviceId)]
);

/**
 * One open-or-resolved firing of an alert rule. A rule firing twice in a
 * row while already firing doesn't create a second row - see evaluate.ts -
 * so "how many times did this page someone" is a real, meaningful count.
 */
export const alertEvents = pgTable(
  "alert_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    alertRuleId: uuid("alert_rule_id")
      .notNull()
      .references(() => alertRules.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 20 }).notNull().default("firing"), // firing | resolved
    triggerValue: numeric("trigger_value", { precision: 20, scale: 6 }).notNull(),
    triggeredAt: timestamp("triggered_at", { withTimezone: true }).notNull().defaultNow(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    index("alert_events_service_id_idx").on(table.serviceId),
    index("alert_events_alert_rule_id_idx").on(table.alertRuleId),
  ]
);
