-- Database Migration Script
-- Adds missing columns to the reports table

-- Add ai_conclusion column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reports' AND column_name = 'ai_conclusion'
    ) THEN
        ALTER TABLE reports ADD COLUMN ai_conclusion TEXT;
        RAISE NOTICE 'Column ai_conclusion added successfully';
    ELSE
        RAISE NOTICE 'Column ai_conclusion already exists';
    END IF;
END $$;

-- Add report_language column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reports' AND column_name = 'report_language'
    ) THEN
        ALTER TABLE reports ADD COLUMN report_language VARCHAR(10);
        RAISE NOTICE 'Column report_language added successfully';
    ELSE
        RAISE NOTICE 'Column report_language already exists';
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reports' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE reports ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE 'Column updated_at added successfully';
    ELSE
        RAISE NOTICE 'Column updated_at already exists';
    END IF;
END $$;

-- Update existing records to have updated_at same as created_at
UPDATE reports
SET updated_at = created_at
WHERE updated_at IS NULL;

-- Show the updated schema
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'reports'
ORDER BY ordinal_position;
