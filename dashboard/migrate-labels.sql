-- Create junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS "_TestObjectLabels" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- Migrate existing labelId to many-to-many
INSERT INTO "_TestObjectLabels" ("A", "B")
SELECT id as "A", "labelId" as "B"
FROM "TestObject"
WHERE "labelId" IS NOT NULL;

-- Create unique index
CREATE UNIQUE INDEX IF NOT EXISTS "_TestObjectLabels_AB_unique" ON "_TestObjectLabels"("A", "B");

-- Create indices for performance
CREATE INDEX IF NOT EXISTS "_TestObjectLabels_B_index" ON "_TestObjectLabels"("B");

-- Add foreign key constraints
ALTER TABLE "_TestObjectLabels"
ADD CONSTRAINT "_TestObjectLabels_A_fkey"
FOREIGN KEY ("A") REFERENCES "Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_TestObjectLabels"
ADD CONSTRAINT "_TestObjectLabels_B_fkey"
FOREIGN KEY ("B") REFERENCES "TestObject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop the old labelId column
ALTER TABLE "TestObject" DROP COLUMN IF EXISTS "labelId";
