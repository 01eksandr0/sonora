-- CreateTable
CREATE TABLE "favorite_tracks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "MusicProvider" NOT NULL DEFAULT 'DEEZER',
    "provider_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist_name" TEXT NOT NULL,
    "album_title" TEXT,
    "cover_url" TEXT,
    "duration" INTEGER NOT NULL,
    "preview_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorite_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listening_histories" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "MusicProvider" NOT NULL DEFAULT 'DEEZER',
    "provider_id" TEXT NOT NULL,
    "track_title" TEXT NOT NULL,
    "artist_name" TEXT NOT NULL,
    "album_title" TEXT,
    "cover_url" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "listened_seconds" INTEGER NOT NULL DEFAULT 0,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "listening_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "favorite_tracks_user_id_created_at_idx" ON "favorite_tracks"("user_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "favorite_tracks_user_id_provider_provider_id_key" ON "favorite_tracks"("user_id", "provider", "provider_id");

-- CreateIndex
CREATE INDEX "listening_histories_user_id_started_at_idx" ON "listening_histories"("user_id", "started_at" DESC);

-- AddForeignKey
ALTER TABLE "favorite_tracks" ADD CONSTRAINT "favorite_tracks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listening_histories" ADD CONSTRAINT "listening_histories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
