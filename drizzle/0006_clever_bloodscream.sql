CREATE TABLE "video_chapters" (
	"id" varchar(21) PRIMARY KEY NOT NULL,
	"video_id" varchar NOT NULL,
	"content" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "video_chapters" ADD CONSTRAINT "video_chapters_video_id_videos_id_fk" FOREIGN KEY ("video_id") REFERENCES "public"."videos"("id") ON DELETE no action ON UPDATE no action;