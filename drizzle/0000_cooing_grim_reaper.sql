CREATE TABLE "transcriptions" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"created_by" varchar(255) NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"content" text NOT NULL,
	"youtube_url" text NOT NULL,
	"youtube_id" varchar(11) NOT NULL
);
