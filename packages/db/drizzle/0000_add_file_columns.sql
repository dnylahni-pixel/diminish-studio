CREATE TABLE "library" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"song_id" integer NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"clerk_id" text,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"avatar_url" text,
	"bio" text,
	"preferred_instrument" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id"),
	CONSTRAINT "users_username_unique" UNIQUE("username"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "songs" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"artist_id" integer NOT NULL,
	"genre_id" integer,
	"difficulty" text DEFAULT 'beginner' NOT NULL,
	"duration" real,
	"file_key" text,
	"file_url" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"bpm" real,
	"musical_key" text,
	"mode" text,
	"time_signature" text,
	"cover_url" text,
	"play_count" integer DEFAULT 0 NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"bio" text,
	"avatar_url" text
);
--> statement-breakpoint
CREATE TABLE "song_analyses" (
	"song_id" integer PRIMARY KEY NOT NULL,
	"lyrics_timeline" jsonb,
	"chord_timeline" jsonb,
	"beat_timeline" jsonb,
	"sections_timeline" jsonb,
	"tempo_timeline" jsonb,
	"key_timeline" jsonb,
	"tracks" jsonb,
	"analysis_status" text DEFAULT 'pending' NOT NULL,
	"analysis_version" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "song_stems" (
	"song_id" integer PRIMARY KEY NOT NULL,
	"audio_url" text,
	"vocal_url" text,
	"instrumental_url" text,
	"drums_url" text,
	"bass_url" text,
	"piano_url" text,
	"guitar_url" text,
	"other_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chord_attempts" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" integer NOT NULL,
	"success" boolean NOT NULL,
	"confidence_score" real DEFAULT 0 NOT NULL,
	"attempted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chords" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"instrument" text DEFAULT 'guitar' NOT NULL,
	"difficulty" text DEFAULT 'beginner' NOT NULL,
	"fingers" text[] DEFAULT '{}' NOT NULL,
	"strings" text[] DEFAULT '{}' NOT NULL,
	"description" text,
	"audio_url" text
);
--> statement-breakpoint
CREATE TABLE "learning_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"chord_name" text NOT NULL,
	"instrument" text DEFAULT 'guitar' NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"attempts_count" integer DEFAULT 0 NOT NULL,
	"success_count" integer DEFAULT 0 NOT NULL,
	"mastered" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "library" ADD CONSTRAINT "library_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "songs" ADD CONSTRAINT "songs_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_analyses" ADD CONSTRAINT "song_analyses_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "song_stems" ADD CONSTRAINT "song_stems_song_id_songs_id_fk" FOREIGN KEY ("song_id") REFERENCES "public"."songs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chord_attempts" ADD CONSTRAINT "chord_attempts_session_id_learning_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."learning_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;