CREATE TABLE "sessions" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"jti_hash" text NOT NULL,
	"user_id" varchar(21) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "sessions_jti_hash_unique" UNIQUE("jti_hash")
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;