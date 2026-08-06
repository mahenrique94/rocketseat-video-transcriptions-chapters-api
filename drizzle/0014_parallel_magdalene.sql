ALTER TABLE "users" ADD COLUMN "confirmation_token_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "confirmation_token_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_confirmation_token_hash_unique" UNIQUE("confirmation_token_hash");