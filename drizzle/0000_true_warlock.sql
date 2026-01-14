CREATE TYPE "public"."onboarding_status" AS ENUM('pending', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."questionnaire_status" AS ENUM('in_progress', 'completed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('country_response_ready', 'report_ready', 'questionnaire_completed');--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"id_number" varchar(20),
	"phone" varchar(20),
	"citizenship" varchar(100),
	"birth_date" timestamp,
	"preferred_language" varchar(10) DEFAULT 'he',
	"is_active" boolean DEFAULT true NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"onboarding_status" "onboarding_status" DEFAULT 'pending' NOT NULL,
	"onboarding_completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questionnaire_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"responses" jsonb DEFAULT '{"version":1,"preferredCountries":[]}'::jsonb NOT NULL,
	"status" "questionnaire_status" DEFAULT 'in_progress' NOT NULL,
	"current_step" varchar(50) DEFAULT 'countries' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "questionnaire_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"questionnaire_id" uuid NOT NULL,
	"recommendations" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"generated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(3) NOT NULL,
	"name" varchar(100) NOT NULL,
	"english_name" varchar(100) NOT NULL,
	"flag_image" varchar(500),
	"hero_image" varchar(500),
	"introduction" text,
	"categories" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "countries_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "country_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"country_id" uuid NOT NULL,
	"display_order" integer DEFAULT 1 NOT NULL,
	"match_score" integer DEFAULT 0 NOT NULL,
	"visa_type" varchar(200),
	"match_reasons" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"personalized_content" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"category_overrides" jsonb,
	"status" "report_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questionnaire_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"questionnaire_id" uuid NOT NULL,
	"greeting" text,
	"profile_summary" jsonb DEFAULT '{"userName":""}'::jsonb NOT NULL,
	"status" "report_status" DEFAULT 'draft' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" varchar(200) NOT NULL,
	"message" text,
	"related_id" uuid,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"read_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "questionnaire_responses" ADD CONSTRAINT "questionnaire_responses_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_results" ADD CONSTRAINT "questionnaire_results_questionnaire_id_questionnaire_responses_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."questionnaire_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "country_responses" ADD CONSTRAINT "country_responses_report_id_questionnaire_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."questionnaire_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "country_responses" ADD CONSTRAINT "country_responses_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_reports" ADD CONSTRAINT "questionnaire_reports_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "questionnaire_reports" ADD CONSTRAINT "questionnaire_reports_questionnaire_id_questionnaire_responses_id_fk" FOREIGN KEY ("questionnaire_id") REFERENCES "public"."questionnaire_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;