CREATE TYPE "public"."payment_status" AS ENUM('pending', 'completed', 'failed', 'expired', 'refunded', 'disputed');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('relomatch_report', 'consultation');--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"questionnaire_response_id" uuid,
	"stripe_customer_id" text,
	"stripe_checkout_session_id" text,
	"stripe_payment_intent_id" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'ILS' NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"product_type" "product_type" NOT NULL,
	"product_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	"refunded_at" timestamp,
	"metadata" text
);
--> statement-breakpoint
ALTER TABLE "blog_posts" DROP CONSTRAINT "blog_posts_slug_idx";--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_user_id_user_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_questionnaire_response_id_questionnaire_responses_id_fk" FOREIGN KEY ("questionnaire_response_id") REFERENCES "public"."questionnaire_responses"("id") ON DELETE set null ON UPDATE no action;