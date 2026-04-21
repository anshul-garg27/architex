CREATE TABLE "lld_design_annotations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"design_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" varchar(30) DEFAULT 'sticky-note' NOT NULL,
	"node_id" varchar(100),
	"x" real DEFAULT 0 NOT NULL,
	"y" real DEFAULT 0 NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"color" varchar(20) DEFAULT 'amber' NOT NULL,
	"meta" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lld_design_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"design_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" varchar(20) DEFAULT 'auto' NOT NULL,
	"label" varchar(200),
	"note" text,
	"canvas_state" jsonb NOT NULL,
	"node_count" integer DEFAULT 0 NOT NULL,
	"edge_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lld_designs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(160) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"description" text,
	"template_id" uuid,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"is_pinned" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_opened_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lld_templates_library" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(100) NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text NOT NULL,
	"category" varchar(40) NOT NULL,
	"difficulty" varchar(20) DEFAULT 'intermediate' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"pattern_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"canvas_state" jsonb NOT NULL,
	"thumbnail_svg" text,
	"is_curated" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lld_design_annotations" ADD CONSTRAINT "lld_design_annotations_design_id_lld_designs_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."lld_designs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lld_design_annotations" ADD CONSTRAINT "lld_design_annotations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lld_design_snapshots" ADD CONSTRAINT "lld_design_snapshots_design_id_lld_designs_id_fk" FOREIGN KEY ("design_id") REFERENCES "public"."lld_designs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lld_design_snapshots" ADD CONSTRAINT "lld_design_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lld_designs" ADD CONSTRAINT "lld_designs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lld_design_annotations_design_idx" ON "lld_design_annotations" USING btree ("design_id");--> statement-breakpoint
CREATE INDEX "lld_design_annotations_node_idx" ON "lld_design_annotations" USING btree ("design_id","node_id");--> statement-breakpoint
CREATE INDEX "lld_design_snapshots_design_idx" ON "lld_design_snapshots" USING btree ("design_id","created_at");--> statement-breakpoint
CREATE INDEX "lld_design_snapshots_user_kind_idx" ON "lld_design_snapshots" USING btree ("user_id","kind");--> statement-breakpoint
CREATE UNIQUE INDEX "lld_designs_user_slug_idx" ON "lld_designs" USING btree ("user_id","slug");--> statement-breakpoint
CREATE INDEX "lld_designs_user_updated_idx" ON "lld_designs" USING btree ("user_id","updated_at");--> statement-breakpoint
CREATE INDEX "lld_designs_user_status_idx" ON "lld_designs" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "lld_templates_library_slug_idx" ON "lld_templates_library" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "lld_templates_library_category_idx" ON "lld_templates_library" USING btree ("category","sort_order");