CREATE TABLE "blueprint_courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"version" varchar(20) DEFAULT 'v1.0.0' NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blueprint_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"session_id" varchar(64),
	"event_name" varchar(80) NOT NULL,
	"event_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blueprint_journey_state" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"current_unit_slug" varchar(100),
	"current_section_id" varchar(100),
	"welcome_dismissed_at" timestamp with time zone,
	"streak_days" integer DEFAULT 0 NOT NULL,
	"streak_last_active_at" timestamp with time zone,
	"daily_review_target" integer DEFAULT 10 NOT NULL,
	"preferred_lang" varchar(10) DEFAULT 'ts' NOT NULL,
	"pinned_tool" varchar(20),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blueprint_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"slug" varchar(100) NOT NULL,
	"ordinal" integer NOT NULL,
	"title" text NOT NULL,
	"summary" text,
	"duration_minutes" integer DEFAULT 0 NOT NULL,
	"difficulty" varchar(20) DEFAULT 'foundation' NOT NULL,
	"prereq_unit_slugs" text[] DEFAULT '{}'::text[] NOT NULL,
	"tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"entity_refs" jsonb DEFAULT '{"patterns": [], "problems": []}'::jsonb NOT NULL,
	"recipe_json" jsonb DEFAULT '{"version": 1, "sections": []}'::jsonb NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "blueprint_user_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"unit_id" uuid NOT NULL,
	"state" varchar(20) DEFAULT 'available' NOT NULL,
	"section_states" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_position" varchar(100),
	"total_time_ms" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"mastered_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blueprint_events" ADD CONSTRAINT "blueprint_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blueprint_journey_state" ADD CONSTRAINT "blueprint_journey_state_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blueprint_units" ADD CONSTRAINT "blueprint_units_course_id_blueprint_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."blueprint_courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blueprint_user_progress" ADD CONSTRAINT "blueprint_user_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blueprint_user_progress" ADD CONSTRAINT "blueprint_user_progress_unit_id_blueprint_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."blueprint_units"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "blueprint_courses_slug_idx" ON "blueprint_courses" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "blueprint_events_user_occurred_idx" ON "blueprint_events" USING btree ("user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "blueprint_events_name_occurred_idx" ON "blueprint_events" USING btree ("event_name","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "blueprint_units_course_slug_idx" ON "blueprint_units" USING btree ("course_id","slug");--> statement-breakpoint
CREATE INDEX "blueprint_units_course_ordinal_idx" ON "blueprint_units" USING btree ("course_id","ordinal");--> statement-breakpoint
CREATE UNIQUE INDEX "blueprint_user_progress_user_unit_idx" ON "blueprint_user_progress" USING btree ("user_id","unit_id");--> statement-breakpoint
CREATE INDEX "blueprint_user_progress_user_idx" ON "blueprint_user_progress" USING btree ("user_id");