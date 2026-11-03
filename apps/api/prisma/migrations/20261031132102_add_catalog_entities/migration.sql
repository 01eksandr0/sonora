-- CreateTable
CREATE TABLE "artists" (
    "id" TEXT NOT NULL,
    "provider" "MusicProvider" NOT NULL DEFAULT 'DEEZER',
    "provider_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "images" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "albums" (
    "id" TEXT NOT NULL,
    "provider" "MusicProvider" NOT NULL DEFAULT 'DEEZER',
    "provider_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist_id" TEXT NOT NULL,
    "cover" JSONB DEFAULT '{}',
    "release_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "albums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracks" (
    "id" TEXT NOT NULL,
    "provider" "MusicProvider" NOT NULL DEFAULT 'DEEZER',
    "provider_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "title_version" TEXT,
    "duration" INTEGER NOT NULL,
    "preview_url" TEXT,
    "explicit" BOOLEAN NOT NULL DEFAULT false,
    "artist_id" TEXT NOT NULL,
    "album_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" TEXT NOT NULL,
    "provider" "MusicProvider" NOT NULL DEFAULT 'DEEZER',
    "provider_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "images" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "artists_provider_provider_id_key" ON "artists"("provider", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "albums_provider_provider_id_key" ON "albums"("provider", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "tracks_provider_provider_id_key" ON "tracks"("provider", "provider_id");

-- CreateIndex
CREATE UNIQUE INDEX "genres_provider_provider_id_key" ON "genres"("provider", "provider_id");

-- AddForeignKey
ALTER TABLE "albums" ADD CONSTRAINT "albums_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_artist_id_fkey" FOREIGN KEY ("artist_id") REFERENCES "artists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracks" ADD CONSTRAINT "tracks_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;
