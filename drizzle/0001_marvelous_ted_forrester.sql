ALTER TABLE "transcriptions" ADD COLUMN "video_url" text;--> statement-breakpoint
ALTER TABLE "transcriptions" ADD COLUMN "video_id" varchar;

UPDATE transcriptions SET video_url = youtube_url;
UPDATE transcriptions SET video_id = youtube_id;
