ALTER TABLE "country_responses" RENAME TO "destination_responses";--> statement-breakpoint
ALTER TABLE "destination_responses" DROP CONSTRAINT "country_responses_report_id_questionnaire_reports_id_fk";
--> statement-breakpoint
ALTER TABLE "destination_responses" DROP CONSTRAINT "country_responses_country_id_countries_id_fk";
--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."notification_type";--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('report_ready', 'country_response_ready', 'questionnaire_completed', 'questionnaire_updated', 'questionnaire_resubmit_required', 'questionnaire_reminder', 'new_questionnaire_submitted', 'questionnaire_update_completed', 'system');--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "type" SET DATA TYPE "public"."notification_type" USING "type"::"public"."notification_type";--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD COLUMN "needs_update" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD COLUMN "last_schema_check" timestamp;--> statement-breakpoint
ALTER TABLE "destination_responses" ADD COLUMN "destination_name" varchar(200) NOT NULL;--> statement-breakpoint
ALTER TABLE "destination_responses" ADD COLUMN "destination_subtitle" varchar(200);--> statement-breakpoint
ALTER TABLE "destination_responses" ADD COLUMN "destination_image" text;--> statement-breakpoint
ALTER TABLE "destination_responses" ADD COLUMN "destination_badge" varchar(100);--> statement-breakpoint
ALTER TABLE "destination_responses" ADD COLUMN "narrative" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "destination_responses" ADD COLUMN "sections" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "destination_responses" ADD CONSTRAINT "destination_responses_report_id_questionnaire_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."questionnaire_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "destination_responses" DROP COLUMN "country_id";--> statement-breakpoint
ALTER TABLE "destination_responses" DROP COLUMN "personalized_content";--> statement-breakpoint
ALTER TABLE "destination_responses" DROP COLUMN "category_overrides";