CREATE TYPE "public"."blog_category" AS ENUM('visa', 'relocation', 'lifestyle', 'finance', 'legal', 'testimonial', 'press', 'general');--> statement-breakpoint
CREATE TYPE "public"."blog_content_type" AS ENUM('blog', 'press');--> statement-breakpoint
CREATE TYPE "public"."blog_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(255) NOT NULL,
	"content_type" "blog_content_type" DEFAULT 'blog' NOT NULL,
	"title" jsonb NOT NULL,
	"excerpt" jsonb,
	"content" jsonb NOT NULL,
	"meta_description" jsonb,
	"featured_image_url" text,
	"featured_image_alt" jsonb,
	"category" "blog_category",
	"tags" jsonb DEFAULT '[]'::jsonb,
	"author" varchar(255) DEFAULT 'Relogate' NOT NULL,
	"status" "blog_status" DEFAULT 'draft' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"view_count" integer DEFAULT 0 NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_unique" UNIQUE("slug"),
	CONSTRAINT "blog_posts_slug_idx" UNIQUE("slug")
);
--> statement-breakpoint
CREATE INDEX "blog_posts_status_idx" ON "blog_posts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "blog_posts_content_type_idx" ON "blog_posts" USING btree ("content_type");--> statement-breakpoint
CREATE INDEX "blog_posts_category_idx" ON "blog_posts" USING btree ("category");--> statement-breakpoint
CREATE INDEX "blog_posts_published_at_idx" ON "blog_posts" USING btree ("published_at");