CREATE TABLE "pages" (
    "id" TEXT NOT NULL,
    "portfolioId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "pages_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "sections" ADD COLUMN "pageId" TEXT;

CREATE UNIQUE INDEX "pages_portfolioId_slug_key" ON "pages"("portfolioId", "slug");
CREATE INDEX "pages_portfolioId_idx" ON "pages"("portfolioId");
CREATE INDEX "sections_pageId_idx" ON "sections"("pageId");

ALTER TABLE "pages" ADD CONSTRAINT "pages_portfolioId_fkey" FOREIGN KEY ("portfolioId") REFERENCES "portfolios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "sections" ADD CONSTRAINT "sections_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
