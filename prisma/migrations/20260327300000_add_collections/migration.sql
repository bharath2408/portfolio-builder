CREATE TABLE "collections" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "fields" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "collection_items" (
    "id" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "collection_items_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "collections_portfolioId_slug_key" ON "collections"("portfolioId", "slug");
CREATE INDEX "collections_portfolioId_idx" ON "collections"("portfolioId");
CREATE INDEX "collection_items_collectionId_idx" ON "collection_items"("collectionId");
CREATE INDEX "collection_items_collectionId_sortOrder_idx" ON "collection_items"("collectionId", "sortOrder");

ALTER TABLE "collections" ADD CONSTRAINT "collections_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "collection_items" ADD CONSTRAINT "collection_items_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
