-- AlterTable
ALTER TABLE "contact_submissions" ADD COLUMN "isRead" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "contact_submissions_portfolioId_isRead_idx" ON "contact_submissions"("portfolioId", "isRead");
