CREATE TABLE "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "alert_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_rule_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'firing' NOT NULL,
	"trigger_value" numeric(20, 6) NOT NULL,
	"triggered_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "alert_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"metric_name" varchar(80) NOT NULL,
	"comparator" varchar(4) NOT NULL,
	"threshold" numeric(20, 6) NOT NULL,
	"window_minutes" integer DEFAULT 5 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "builds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'queued' NOT NULL,
	"commit_ref" varchar(200) DEFAULT 'HEAD' NOT NULL,
	"logs" text DEFAULT '' NOT NULL,
	"error_message" text,
	"queued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"duration_ms" integer
);
--> statement-breakpoint
CREATE TABLE "deploys" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"build_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"is_rollback" boolean DEFAULT false NOT NULL,
	"deployed_by" varchar(320) NOT NULL,
	"deployed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_id" uuid NOT NULL,
	"metric_name" varchar(80) NOT NULL,
	"value" numeric(20, 6) NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(120) NOT NULL,
	"slug" varchar(120) NOT NULL,
	"repo_url" text NOT NULL,
	"build_command" text NOT NULL,
	"start_command" text NOT NULL,
	"working_directory" text DEFAULT '.' NOT NULL,
	"cpu_request_milli" integer DEFAULT 250 NOT NULL,
	"memory_request_mb" integer DEFAULT 512 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_alert_rule_id_alert_rules_id_fk" FOREIGN KEY ("alert_rule_id") REFERENCES "public"."alert_rules"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_events" ADD CONSTRAINT "alert_events_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "alert_rules" ADD CONSTRAINT "alert_rules_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "builds" ADD CONSTRAINT "builds_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deploys" ADD CONSTRAINT "deploys_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deploys" ADD CONSTRAINT "deploys_build_id_builds_id_fk" FOREIGN KEY ("build_id") REFERENCES "public"."builds"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "alert_events_service_id_idx" ON "alert_events" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "alert_events_alert_rule_id_idx" ON "alert_events" USING btree ("alert_rule_id");--> statement-breakpoint
CREATE INDEX "alert_rules_service_id_idx" ON "alert_rules" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "builds_service_id_idx" ON "builds" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "builds_status_idx" ON "builds" USING btree ("status");--> statement-breakpoint
CREATE INDEX "deploys_service_id_idx" ON "deploys" USING btree ("service_id");--> statement-breakpoint
CREATE INDEX "metrics_service_id_metric_name_idx" ON "metrics" USING btree ("service_id","metric_name");--> statement-breakpoint
CREATE INDEX "metrics_recorded_at_idx" ON "metrics" USING btree ("recorded_at");