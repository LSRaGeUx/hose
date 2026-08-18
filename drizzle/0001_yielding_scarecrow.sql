CREATE TABLE "profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"energises" text,
	"drains" text,
	"aspiration" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;