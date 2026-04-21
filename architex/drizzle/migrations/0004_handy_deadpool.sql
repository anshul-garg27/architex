ALTER TABLE "lld_drill_attempts" ADD COLUMN "variant" varchar(20) DEFAULT 'timed-mock' NOT NULL;--> statement-breakpoint
ALTER TABLE "lld_drill_attempts" ADD COLUMN "current_stage" varchar(20) DEFAULT 'clarify' NOT NULL;--> statement-breakpoint
ALTER TABLE "lld_drill_attempts" ADD COLUMN "started_stage_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "lld_drill_attempts" ADD COLUMN "stages" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "lld_drill_attempts" ADD COLUMN "hint_log" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "lld_drill_attempts" ADD COLUMN "rubric_breakdown" jsonb;--> statement-breakpoint
ALTER TABLE "lld_drill_attempts" ADD COLUMN "postmortem" jsonb;--> statement-breakpoint
CREATE INDEX "drill_stage_idx" ON "lld_drill_attempts" USING btree ("user_id","current_stage");