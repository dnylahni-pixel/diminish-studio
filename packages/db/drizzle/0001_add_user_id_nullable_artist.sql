ALTER TABLE "songs" ALTER COLUMN "artist_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "songs" ADD COLUMN "user_id" integer;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;