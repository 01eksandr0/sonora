-- CreateTable
CREATE TABLE "recommendation_collections" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tracks" JSONB NOT NULL,
    "refreshed_at" TIMESTAMP(3),
    "next_refresh_at" TIMESTAMP(3),
    "refresh_token" TEXT,
    "refresh_lock_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recommendation_collections_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recommendation_collections_user_id_key" ON "recommendation_collections"("user_id");

-- CreateIndex
CREATE INDEX "recommendation_collections_next_refresh_at_idx" ON "recommendation_collections"("next_refresh_at");

-- AddForeignKey
ALTER TABLE "recommendation_collections" ADD CONSTRAINT "recommendation_collections_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
