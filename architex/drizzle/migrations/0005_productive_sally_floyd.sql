CREATE TABLE "lld_drill_interviewer_turns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"attempt_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"stage" varchar(20) NOT NULL,
	"persona" varchar(20) DEFAULT 'generic' NOT NULL,
	"seq" integer NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lld_drill_interviewer_turns" ADD CONSTRAINT "lld_drill_interviewer_turns_attempt_id_lld_drill_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."lld_drill_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "drill_turn_attempt_seq_idx" ON "lld_drill_interviewer_turns" USING btree ("attempt_id","seq");