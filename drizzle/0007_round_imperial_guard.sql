CREATE TABLE "users" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"active" boolean NOT NULL,
	"deleted_at" timestamp with time zone
);
