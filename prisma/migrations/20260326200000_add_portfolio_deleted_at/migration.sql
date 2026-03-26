ALTER TABLE "portfolios" ADD COLUMN "deletedAt" TIMESTAMP;
CREATE INDEX "portfolios_deletedAt_idx" ON "portfolios"("deletedAt");
