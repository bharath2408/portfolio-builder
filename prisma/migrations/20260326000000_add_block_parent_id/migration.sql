-- AlterTable: add parentId column to blocks
ALTER TABLE "blocks" ADD COLUMN "parentId" TEXT;

-- AddForeignKey: self-referential parent relation (SetNull on delete)
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "blocks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex: index on parentId for efficient child lookups
CREATE INDEX "blocks_parentId_idx" ON "blocks"("parentId");
