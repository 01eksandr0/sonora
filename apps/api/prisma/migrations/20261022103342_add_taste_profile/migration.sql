-- CreateEnum
CREATE TYPE "TasteSignalSource" AS ENUM ('ONBOARDING', 'LIKE', 'LISTEN', 'SKIP', 'MANUAL');

-- CreateTable
CREATE TABLE "taste_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "moods" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "taste_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taste_genre_preferences" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "genre" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "source" "TasteSignalSource" NOT NULL DEFAULT 'ONBOARDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "taste_genre_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taste_artist_preferences" (
    "id" TEXT NOT NULL,
    "profile_id" TEXT NOT NULL,
    "artist_name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "source" "TasteSignalSource" NOT NULL DEFAULT 'ONBOARDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "taste_artist_preferences_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "taste_profiles_user_id_key" ON "taste_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "taste_genre_preferences_profile_id_genre_key" ON "taste_genre_preferences"("profile_id", "genre");

-- CreateIndex
CREATE UNIQUE INDEX "taste_artist_preferences_profile_id_artist_name_key" ON "taste_artist_preferences"("profile_id", "artist_name");

-- AddForeignKey
ALTER TABLE "taste_profiles" ADD CONSTRAINT "taste_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taste_genre_preferences" ADD CONSTRAINT "taste_genre_preferences_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "taste_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "taste_artist_preferences" ADD CONSTRAINT "taste_artist_preferences_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "taste_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
