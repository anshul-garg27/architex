CREATE TABLE "lld_bookmarks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pattern_slug" varchar(100) NOT NULL,
	"section_id" varchar(30) NOT NULL,
	"anchor_id" varchar(200) NOT NULL,
	"anchor_label" varchar(500) NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lld_concept_reads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"concept_id" varchar(100) NOT NULL,
	"pattern_slug" varchar(100) NOT NULL,
	"section_id" varchar(30) NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lld_learn_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"pattern_slug" varchar(100) NOT NULL,
	"section_progress" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"last_scroll_y" integer DEFAULT 0 NOT NULL,
	"active_section_id" varchar(30),
	"completed_section_count" integer DEFAULT 0 NOT NULL,
	"checkpoint_stats" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completed_at" timestamp with time zone,
	"visit_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lld_bookmarks" ADD CONSTRAINT "lld_bookmarks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lld_concept_reads" ADD CONSTRAINT "lld_concept_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lld_learn_progress" ADD CONSTRAINT "lld_learn_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lld_bookmarks_user_anchor_idx" ON "lld_bookmarks" USING btree ("user_id","pattern_slug","anchor_id");--> statement-breakpoint
CREATE INDEX "lld_bookmarks_user_recent_idx" ON "lld_bookmarks" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "lld_concept_reads_user_concept_idx" ON "lld_concept_reads" USING btree ("user_id","concept_id","read_at");--> statement-breakpoint
CREATE INDEX "lld_concept_reads_user_recent_idx" ON "lld_concept_reads" USING btree ("user_id","read_at");--> statement-breakpoint
CREATE UNIQUE INDEX "lld_learn_progress_user_pattern_idx" ON "lld_learn_progress" USING btree ("user_id","pattern_slug");--> statement-breakpoint
CREATE INDEX "lld_learn_progress_user_idx" ON "lld_learn_progress" USING btree ("user_id");