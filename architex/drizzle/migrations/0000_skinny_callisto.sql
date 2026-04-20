CREATE TABLE "achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"icon" varchar(50),
	"color" varchar(7),
	"xp_reward" integer DEFAULT 0 NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "achievements_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "user_achievements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"achievement_id" uuid NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"event" varchar(100) NOT NULL,
	"module_id" varchar(50),
	"concept_id" varchar(100),
	"metadata" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"model" varchar(100) NOT NULL,
	"tokens" integer NOT NULL,
	"cost" real DEFAULT 0 NOT NULL,
	"purpose" varchar(100),
	"metadata" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diagram_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" varchar(50) NOT NULL,
	"parent_type" varchar(50) NOT NULL,
	"parent_slug" varchar(200) NOT NULL,
	"mermaid_code" text NOT NULL,
	"classes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"relationships" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_curated" boolean DEFAULT false NOT NULL,
	"layout_algo" varchar(20) DEFAULT 'grid',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "diagrams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"slug" varchar(255),
	"description" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"template_id" uuid,
	"is_public" boolean DEFAULT false NOT NULL,
	"fork_count" integer DEFAULT 0 NOT NULL,
	"upvote_count" integer DEFAULT 0 NOT NULL,
	"forked_from_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diagram_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"upvotes" integer DEFAULT 0 NOT NULL,
	"author_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gallery_upvotes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lld_drill_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"problem_id" varchar(100) NOT NULL,
	"drill_mode" varchar(20) DEFAULT 'interview' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paused_at" timestamp with time zone,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone,
	"abandoned_at" timestamp with time zone,
	"elapsed_before_pause_ms" integer DEFAULT 0 NOT NULL,
	"duration_limit_ms" integer NOT NULL,
	"canvas_state" jsonb,
	"hints_used" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"grade_score" real,
	"grade_breakdown" jsonb
);
--> statement-breakpoint
CREATE TABLE "module_content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" varchar(50) NOT NULL,
	"content_type" varchar(50) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(300) NOT NULL,
	"category" varchar(100),
	"difficulty" varchar(20),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"summary" text,
	"tags" text[],
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"module_id" varchar(100) NOT NULL,
	"concept_id" varchar(100),
	"score" real DEFAULT 0 NOT NULL,
	"completed_at" timestamp with time zone,
	"stability" real,
	"difficulty" real,
	"elapsed_days" integer,
	"scheduled_days" integer,
	"reps" integer DEFAULT 0,
	"lapses" integer DEFAULT 0,
	"fsrs_state" integer DEFAULT 0,
	"next_review_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "quiz_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" varchar(50) NOT NULL,
	"quiz_type" varchar(50) NOT NULL,
	"slug" varchar(200) NOT NULL,
	"question" text NOT NULL,
	"context" text,
	"options" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"correct_index" integer NOT NULL,
	"explanation" text NOT NULL,
	"pattern_id" varchar(100),
	"difficulty" varchar(20),
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "simulation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"diagram_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"results" jsonb,
	"tick_count" integer,
	"duration" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"author_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"email" varchar(320) NOT NULL,
	"name" varchar(255),
	"tier" varchar(20) DEFAULT 'free' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_achievement_id_achievements_id_fk" FOREIGN KEY ("achievement_id") REFERENCES "public"."achievements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_events" ADD CONSTRAINT "activity_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_usage" ADD CONSTRAINT "ai_usage_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagrams" ADD CONSTRAINT "diagrams_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_submissions" ADD CONSTRAINT "gallery_submissions_diagram_id_diagrams_id_fk" FOREIGN KEY ("diagram_id") REFERENCES "public"."diagrams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_submissions" ADD CONSTRAINT "gallery_submissions_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_upvotes" ADD CONSTRAINT "gallery_upvotes_submission_id_gallery_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."gallery_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gallery_upvotes" ADD CONSTRAINT "gallery_upvotes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lld_drill_attempts" ADD CONSTRAINT "lld_drill_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress" ADD CONSTRAINT "progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulation_runs" ADD CONSTRAINT "simulation_runs_diagram_id_diagrams_id_fk" FOREIGN KEY ("diagram_id") REFERENCES "public"."diagrams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "simulation_runs" ADD CONSTRAINT "simulation_runs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "achievements_category_idx" ON "achievements" USING btree ("category");--> statement-breakpoint
CREATE UNIQUE INDEX "user_achievements_unique_idx" ON "user_achievements" USING btree ("user_id","achievement_id");--> statement-breakpoint
CREATE INDEX "user_achievements_user_idx" ON "user_achievements" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_events_user_idx" ON "activity_events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "activity_events_event_idx" ON "activity_events" USING btree ("event");--> statement-breakpoint
CREATE INDEX "activity_events_user_module_idx" ON "activity_events" USING btree ("user_id","module_id");--> statement-breakpoint
CREATE INDEX "activity_events_occurred_at_idx" ON "activity_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "ai_usage_user_id_idx" ON "ai_usage" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "ai_usage_created_at_idx" ON "ai_usage" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "ai_usage_user_purpose_idx" ON "ai_usage" USING btree ("user_id","purpose");--> statement-breakpoint
CREATE UNIQUE INDEX "diagram_templates_unique_idx" ON "diagram_templates" USING btree ("module_id","parent_type","parent_slug");--> statement-breakpoint
CREATE INDEX "diagram_templates_parent_idx" ON "diagram_templates" USING btree ("module_id","parent_type");--> statement-breakpoint
CREATE INDEX "diagrams_user_id_idx" ON "diagrams" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "diagrams_template_id_idx" ON "diagrams" USING btree ("template_id");--> statement-breakpoint
CREATE INDEX "diagrams_is_public_idx" ON "diagrams" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "diagrams_slug_idx" ON "diagrams" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "gallery_author_id_idx" ON "gallery_submissions" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "gallery_upvotes_idx" ON "gallery_submissions" USING btree ("upvotes");--> statement-breakpoint
CREATE UNIQUE INDEX "gallery_diagram_id_idx" ON "gallery_submissions" USING btree ("diagram_id");--> statement-breakpoint
CREATE UNIQUE INDEX "gallery_upvotes_user_submission_idx" ON "gallery_upvotes" USING btree ("user_id","submission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "one_active_drill_per_user" ON "lld_drill_attempts" USING btree ("user_id") WHERE "lld_drill_attempts"."submitted_at" IS NULL AND "lld_drill_attempts"."abandoned_at" IS NULL;--> statement-breakpoint
CREATE INDEX "drill_history_idx" ON "lld_drill_attempts" USING btree ("user_id","submitted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "module_content_unique_idx" ON "module_content" USING btree ("module_id","content_type","slug");--> statement-breakpoint
CREATE INDEX "module_content_module_type_idx" ON "module_content" USING btree ("module_id","content_type","sort_order");--> statement-breakpoint
CREATE INDEX "progress_user_module_idx" ON "progress" USING btree ("user_id","module_id");--> statement-breakpoint
CREATE UNIQUE INDEX "progress_user_module_concept_idx" ON "progress" USING btree ("user_id","module_id","concept_id");--> statement-breakpoint
CREATE UNIQUE INDEX "quiz_questions_unique_idx" ON "quiz_questions" USING btree ("module_id","quiz_type","slug");--> statement-breakpoint
CREATE INDEX "quiz_questions_module_type_idx" ON "quiz_questions" USING btree ("module_id","quiz_type");--> statement-breakpoint
CREATE INDEX "simulation_runs_diagram_id_idx" ON "simulation_runs" USING btree ("diagram_id");--> statement-breakpoint
CREATE INDEX "simulation_runs_user_id_idx" ON "simulation_runs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "templates_category_idx" ON "templates" USING btree ("category");--> statement-breakpoint
CREATE INDEX "templates_is_public_idx" ON "templates" USING btree ("is_public");--> statement-breakpoint
CREATE INDEX "templates_author_id_idx" ON "templates" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "users_clerk_id_idx" ON "users" USING btree ("clerk_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");